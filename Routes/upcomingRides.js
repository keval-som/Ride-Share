import express from "express";
import {
  rideRequests,
  ridePost,
  chatSessions,
  rideHistory,
} from "../config/mongoCollection.js";
import { ObjectId } from "mongodb";
import dayjs from "dayjs";
import { sendEmail } from "./utils/mailer.js";
import cron from "node-cron";
import usersData from "../data/users.js";
import { chatCleanup } from "./utils/chatCleanup.js";

const router = express.Router();

const ensureAuthenticated = (req, res, next) => {
  if (req.session?.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;
    const rideRequestsCollection = await rideRequests();
    const ridePostCollection = await ridePost();

    const acceptedRequests = await rideRequestsCollection
      .find({
        $or: [{ driver: user.username }, { rider: user.username }],
        status: "accepted",
      })
      .toArray();

    const upcomingRides = await Promise.all(
      acceptedRequests.map(async (request) => {
        const ride = await ridePostCollection.findOne({
          _id: new ObjectId(request.rideId),
        });

        if (!ride) {
          console.warn(`Ride not found for rideId: ${request.rideId}`);
          return null;
        }

        const rideStartTime = dayjs(`${ride.date} ${ride.time}`);
        const estimatedEndTime = rideStartTime.add(
          Math.ceil(ride.estimatedDuration / 60),
          "minute"
        );
        const currentTime = dayjs();
        const canFinish = currentTime.isAfter(estimatedEndTime);

        const canCancel = rideStartTime.diff(currentTime, "hour") > 12;

        if (!request.confirmationEmailSent) {
          const driverDetails = await usersData.findByUsername(request.driver);
          const riderDetails = await usersData.findByUsername(request.rider);

          const riderEmailContent = `
            <h2>Ride Confirmation</h2>
            <p>Your ride has been confirmed:</p>
            <ul>
              <li>Driver: ${driverDetails.firstname} ${driverDetails.lastname}</li>
              <li>Date: ${ride.date}</li>
              <li>Time: ${ride.time}</li>
              <li>Origin: ${ride.origin}</li>
              <li>Destination: ${ride.destination}</li>
            </ul>
            <p>Enjoy your ride!</p>
          `;
          sendEmail(riderDetails.email, "Ride Confirmation", riderEmailContent);

          const driverEmailContent = `
            <h2>Ride Confirmation</h2>
            <p>Your ride has been confirmed:</p>
            <ul>
              <li>Rider: ${riderDetails.firstname} ${riderDetails.lastname}</li>
              <li>Date: ${ride.date}</li>
              <li>Time: ${ride.time}</li>
              <li>Origin: ${ride.origin}</li>
              <li>Destination: ${ride.destination}</li>
            </ul>
            <p>Drive safely!</p>
          `;
          sendEmail(
            driverDetails.email,
            "Ride Confirmation",
            driverEmailContent
          );

          await rideRequestsCollection.updateOne(
            { _id: request._id },
            { $set: { confirmationEmailSent: true } }
          );
        }

        return {
          rideId: request.rideId,
          role: request.driver === user.username ? "Driver" : "Rider",
          rider: request.rider,
          driver: request.driver,
          origin: ride.origin || "Unknown",
          destination: ride.destination || "Unknown",
          date: ride.date || "Unknown",
          time: ride.time || "Unknown",
          amount: ride.amount || "Unknown",
          carType: ride.carType,
          canCancel,
          canFinish,
        };
      })
    );

    const filteredRides = upcomingRides.filter((ride) => ride !== null);

    res.render("upcomingRides", {
      rides: filteredRides,
      showNav: true,
    });
  } catch (err) {
    console.error("Error fetching upcoming rides:", err);
    res.status(500).render("error", {
      message: "Unable to fetch upcoming rides. Please try again later.",
    });
  }
});

router.post("/finish/:rideId", ensureAuthenticated, async (req, res) => {
  try {
    const { rideId } = req.params;

    const ridePostCollection = await ridePost();
    const rideHistoryCollection = await rideHistory();
    const rideRequestsCollection = await rideRequests();

    const ride = await ridePostCollection.findOne({
      _id: new ObjectId(rideId),
    });
    if (!ride) {
      return res.status(404).render("error", { message: "Ride not found." });
    }

    const rideRequest = await rideRequestsCollection.findOne({
      rideId,
      status: "accepted",
    });
    const riderUsername = rideRequest?.rider || "Unknown";

    await rideHistoryCollection.insertOne({
      rideId: ride._id.toString(),
      driver: ride.driverId,
      rider: riderUsername,
      origin: ride.origin,
      destination: ride.destination,
      date: ride.date,
      time: ride.time,
      amount: ride.amount,
      carType: ride.carType,
      status: "Finished",
      archivedAt: new Date().toISOString(),
    });

    await ridePostCollection.deleteOne({ _id: new ObjectId(rideId) });
    await chatCleanup();

    res.redirect("/upcomingRides", { showNav: true });
  } catch (err) {
    console.error("Error finishing ride:", err);
    res.status(500).render("error", {
      message: "Unable to finish the ride. Please try again later.",
    });
  }
});

router.post("/cancel/:rideId", ensureAuthenticated, async (req, res) => {
  try {
    const { rideId } = req.params;

    const rideRequestsCollection = await rideRequests();
    const ridePostCollection = await ridePost();
    const rideHistoryCollection = await rideHistory();
    const chatSessionsCollection = await chatSessions();

    const ride = await ridePostCollection.findOne({
      _id: new ObjectId(rideId),
    });
    if (!ride) {
      return res.status(404).render("error", { message: "Ride not found." });
    }

    const acceptedRequest = await rideRequestsCollection.findOne({
      rideId,
      status: "accepted",
    });
    const riderUsername = acceptedRequest?.rider || "Unknown";

    await rideHistoryCollection.insertOne({
      rideId: ride._id.toString(),
      driver: ride.driverId,
      rider: riderUsername,
      origin: ride.origin,
      destination: ride.destination,
      date: ride.date,
      time: ride.time,
      amount: ride.amount,
      carType: ride.carType,
      status: "Cancelled",
      archivedAt: new Date().toISOString(),
    });

    await chatSessionsCollection.deleteMany({ rideId });

    await ridePostCollection.updateOne(
      { _id: new ObjectId(rideId) },
      { $set: { isAvailable: true } }
    );

    await rideRequestsCollection.deleteOne({
      rideId,
      status: "accepted",
    });

    await rideRequestsCollection.updateMany(
      { rideId, status: "waiting" },
      { $set: { status: "pending" } }
    );

    res.redirect("/upcomingRides", { showNav: true });
  } catch (err) {
    console.error("Error canceling ride:", err);
    res.status(500).render("error", {
      message: "Unable to cancel the ride. Please try again later.",
    });
  }
});

cron.schedule("0 * * * *", async () => {
  try {
    const rideRequestsCollection = await rideRequests();
    const ridePostCollection = await ridePost();

    const now = new Date();
    const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    const upcomingRides = await rideRequestsCollection
      .find({
        status: "accepted",
        rideStartTime: { $gte: now, $lte: sixHoursLater },
      })
      .toArray();

    upcomingRides.forEach(async (ride) => {
      const driver = await rideRequestsCollection.findOne({
        username: ride.driver,
      });

      const rider = await rideRequestsCollection.findOne({
        username: ride.rider,
      });

      const riderReminderContent = `
        <h2>Upcoming Ride Reminder</h2>
        <p>Your ride is scheduled to start in the next 6 hours:</p>
        <ul>
          <li>Driver: ${driver.firstname} ${driver.lastname}</li>
          <li>Date: ${ride.date}</li>
          <li>Time: ${ride.time}</li>
          <li>Origin: ${ride.origin}</li>
          <li>Destination: ${ride.destination}</li>
        </ul>
        <p>Enjoy your ride!</p>
      `;
      sendEmail(rider.email, "Upcoming Ride Reminder", riderReminderContent);

      const driverReminderContent = `
        <h2>Upcoming Ride Reminder</h2>
        <p>Your ride is scheduled to start in the next 6 hours:</p>
        <ul>
          <li>Rider: ${rider.firstname} ${rider.lastname}</li>
          <li>Date: ${ride.date}</li>
          <li>Time: ${ride.time}</li>
          <li>Origin: ${ride.origin}</li>
          <li>Destination: ${ride.destination}</li>
        </ul>
        <p>Drive safely!</p>
      `;
      sendEmail(driver.email, "Upcoming Ride Reminder", driverReminderContent);
    });
  } catch (err) {
    console.error("Error sending ride reminders:", err);
  }
});

export default router;
