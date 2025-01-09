import express from "express";
import {
  rideRequests,
  ridePost,
  chatSessions,
} from "../config/mongoCollection.js";

import { chatCleanup } from "./utils/chatCleanup.js";
import { ObjectId } from "mongodb";

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

    const requests = await rideRequestsCollection
      .find({
        $or: [{ driver: user.username }, { rider: user.username }],
      })
      .toArray();

    const requestsWithRideDetails = await Promise.all(
      requests.map(async (request) => {
        const ride = await ridePostCollection.findOne({
          _id: new ObjectId(request.rideId),
        });

        return {
          requestId: request._id.toString(),
          rideId: request.rideId,
          role: request.driver === user.username ? "Driver" : "Rider",
          rider: request.rider,
          driver: request.driver,
          origin: ride?.origin || "Unknown",
          destination: ride?.destination || "Unknown",
          date: ride?.date || "Unknown",
          time: ride?.time || "Unknown",
          amount: ride?.amount || "Unknown",
          status: request.status,
        };
      })
    );

    res.render("requestedRides", {
      requests: requestsWithRideDetails,
      showNav: true,
    });
  } catch (err) {
    console.error("Error fetching requested rides:", err);
    res.status(500).render("error", {
      message: "Unable to fetch requested rides. Please try again later.",
    });
  }
});

// Accept a ride request
router.post("/accept/:requestId", ensureAuthenticated, async (req, res) => {
  try {
    const { requestId } = req.params;
    const user = req.session.user;

    const rideRequestsCollection = await rideRequests();
    const ridePostCollection = await ridePost();

    // Fetch the request to get rideId
    const request = await rideRequestsCollection.findOne({
      _id: new ObjectId(requestId),
      driver: user.username,
    });
    let ridePostC = await ridePostCollection.findOne({
      _id: new ObjectId(request.rideId),
    });

    if (!request) {
      return res.status(404).render("error", {
        message: "Ride request not found.",
      });
    }
    let rider = request.rider;
    let ridersList = ridePostC.riders;
    if (!ridersList) {
      ridersList = [];
    }
    ridersList.push(rider);
    let seatsAvailable = ridePostC.seats;
    if (seatsAvailable === 0) {
      await ridePostCollection.updateOne(
        { _id: new ObjectId(request.rideId) },
        { $set: { isAvailable: false } }
      );
      return res.status(400).render("error", {
        message: "No seats available.",
      });
    }
    if (seatsAvailable === 1) {
      await ridePostCollection.updateOne(
        { _id: new ObjectId(request.rideId) },
        {
          $set: {
            isAvailable: false,
            riders: ridersList,
            seats: seatsAvailable - 1,
          },
        }
      );
    } else {
      await ridePostCollection.updateOne(
        { _id: new ObjectId(request.rideId) },
        { $set: { riders: ridersList, seats: seatsAvailable - 1 } }
      );
    }

    // Update the request status to accepted
    await rideRequestsCollection.updateOne(
      { _id: new ObjectId(requestId) },
      { $set: { status: "accepted" } }
    );

    // Update other pending requests for the same ride to waiting
    await rideRequestsCollection.updateMany(
      { rideId: request.rideId, _id: { $ne: new ObjectId(requestId) } },
      { $set: { status: "waiting" } }
    );

    res.redirect("/requestedRides");
  } catch (err) {
    console.error("Error accepting ride request:", err);
    res.status(500).render("error", {
      message: "Unable to accept the ride request. Please try again later.",
    });
  }
});

// Reject a ride request
router.post("/reject/:requestId", ensureAuthenticated, async (req, res) => {
  try {
    const { requestId } = req.params;
    const user = req.session.user;

    const rideRequestsCollection = await rideRequests();

    // Fetch the ride request to get rideId
    const request = await rideRequestsCollection.findOne({
      _id: new ObjectId(requestId),
      driver: user.username,
    });

    if (!request) {
      return res.status(404).render("error", {
        message: "Ride request not found.",
      });
    }

    // Delete the request from the collection
    await rideRequestsCollection.deleteOne({ _id: new ObjectId(requestId) });

    res.redirect("/requestedRides");
  } catch (err) {
    console.error("Error rejecting ride request:", err);
    res.status(500).render("error", {
      message: "Unable to reject the ride request. Please try again later.",
    });
  }
});

export default router;
