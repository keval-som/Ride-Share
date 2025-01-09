import express from "express";
import { ridePost, chatSessions } from "../config/mongoCollection.js";
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
    const ridePostCollection = await ridePost();
    const chatSessionCollection = await chatSessions();

    const postedRides = await ridePostCollection
      .find({ driverId: user.username })
      .toArray();

    const postedRidesWithChats = await Promise.all(
      postedRides.map(async (ride) => {
        const chats = await chatSessionCollection
          .find({ rideId: ride._id.toString() })
          .toArray();

        return {
          rideId: ride._id.toString(),
          origin: ride.origin,
          destination: ride.destination,
          date: ride.date,
          time: ride.time,
          seats: ride.seats,
          amount: ride.amount,
          isAvailable: ride.isAvailable,
          chats: chats.map((chat) => ({
            chatId: chat._id.toString(),
            rider: chat.rider,
          })),
        };
      })
    );

    res.render("postedRide", {
      postedRides: postedRidesWithChats,
      showNav: true,
    });
  } catch (err) {
    console.error("Error fetching posted rides and chats:", err);
    res.status(500).render("error", {
      message:
        "Unable to fetch posted rides and chats. Please try again later.",
    });
  }
});

export default router;
