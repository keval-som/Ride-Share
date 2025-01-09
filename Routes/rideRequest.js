import express from "express";
import { rideRequests, ridePost } from "../config/mongoCollection.js";
import { ObjectId } from "mongodb";

const router = express.Router();

const ensureAuthenticated = (req, res, next) => {
  if (req.session?.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

router.post("/", ensureAuthenticated, async (req, res) => {
  try {
    const { rideId, rider } = req.body;
    const user = req.session.user;

    if (!rideId || !rider) {
      return res.status(400).json({ error: "Ride ID is required." });
    }

    const ridePostCollection = await ridePost();
    const rideRequestsCollection = await rideRequests();

    const ride = await ridePostCollection.findOne({
      _id: new ObjectId(rideId),
    });
    if (!ride) {
      return res.status(404).json({ error: "Ride not found." });
    }

    const existingRequest = await rideRequestsCollection.findOne({
      rideId,
      rider: rider,
    });
    if (existingRequest) {
      return res.status(400).json({ error: "Ride request already exists." });
    }

    const request = {
      rideId,
      rider: user.username,
      driver: ride.driverId,
      status: "pending",
      createdAt: new Date(),
    };

    await rideRequestsCollection.insertOne(request);

    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error requesting ride:", err);
    res.status(500).render("error", {
      message: "Unable to request ride. Please try again later.",
    });
  }
});

export default router;
