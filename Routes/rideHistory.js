import express from "express";
import { rideHistory, users } from "../config/mongoCollection.js";
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
    const rideHistoryCollection = await rideHistory();
    const currentUser = req.session.user.username;

    const rides = await rideHistoryCollection
      .find({
        $or: [{ driver: currentUser }, { rider: currentUser }],
      })
      .sort({ archivedAt: -1 })
      .toArray();

    res.render("rideHistory", {
      rides,
      user: req.session?.user,
      stars: [1, 2, 3, 4, 5],
      showNav: true,
    });
  } catch (error) {
    console.error("Error fetching ride history:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/rateUser", ensureAuthenticated, async (req, res) => {
  try {
    const { rideId, userId, role, rating } = req.body;

    if (!rideId || !userId || !role || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Invalid data provided" });
    }

    const rideHistoryCollection = await rideHistory();
    const ride = await rideHistoryCollection.findOne({
      _id: new ObjectId(rideId),
    });

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    if (
      (role === "driver" && ride.driverRated) ||
      (role === "rider" && ride.riderRated)
    ) {
      const alertMessage =
        role === "driver"
          ? `You have already rated the rider: ${ride.rider}`
          : `You have already rated the driver: ${ride.driver}`;
      return res.status(400).json({ error: alertMessage });
    }

    const usersCollection = await users();
    const user = await usersCollection.findOne({ username: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const field = role === "driver" ? "driver_review" : "rider_review";
    const reviewCountField =
      role === "driver" ? "driver_review_count" : "rider_review_count";

    const updatedRating =
      ((user[field] || 0) * (user[reviewCountField] || 0) + rating) /
      ((user[reviewCountField] || 0) + 1);

    await usersCollection.updateOne(
      { username: userId },
      {
        $set: { [field]: updatedRating.toFixed(1) },
        $inc: { [reviewCountField]: 1 },
      }
    );

    const updateField = role === "driver" ? "driverRated" : "riderRated";
    await rideHistoryCollection.updateOne(
      { _id: new ObjectId(rideId) },
      { $set: { [updateField]: true } }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error submitting rating:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reportUser", ensureAuthenticated, async (req, res) => {
  try {
    const { rideId, userId } = req.body;
    const reportingUser = req.session.user.username;

    if (!rideId || !userId) {
      return res.status(400).json({ error: "Invalid data provided" });
    }

    const rideHistoryCollection = await rideHistory();
    const ride = await rideHistoryCollection.findOne({
      _id: new ObjectId(rideId),
    });

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    if (ride.reportedBy?.includes(reportingUser)) {
      return res
        .status(400)
        .json({ error: "You have already reported this user." });
    }

    const usersCollection = await users();
    const reportedUser = await usersCollection.findOne({ username: userId });

    if (!reportedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await usersCollection.updateOne(
      { username: userId },
      { $inc: { number_of_reports_made: 1 } }
    );

    if ((reportedUser.number_of_reports_made || 0) + 1 > 3) {
      await usersCollection.deleteOne({ username: userId });
    }

    await rideHistoryCollection.updateOne(
      { _id: new ObjectId(rideId) },
      { $addToSet: { reportedBy: reportingUser } }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error reporting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
