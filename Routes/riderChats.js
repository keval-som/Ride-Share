import express from "express";
import { chatSessions, ridePost, users } from "../config/mongoCollection.js";
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
    const user = req.session?.user;
    const chatSessionCollection = await chatSessions();
    const ridePostCollection = await ridePost();
    const userCollection = await users();

    const chats = await chatSessionCollection
      .find({ rider: user.username })
      .toArray();

    const riderChats = await Promise.all(
      chats.map(async (chat) => {
        const ride = await ridePostCollection.findOne({
          _id: new ObjectId(chat.rideId),
        });

        if (!ride) {
          console.warn(`Ride not found for rideId: ${chat.rideId}`);
          return null;
        }

        const driver = await userCollection.findOne({
          username: ride.driverId,
        });

        if (!driver) {
          console.warn(`Driver not found for driverId: ${ride.driverId}`);
          return null;
        }

        return {
          chatId: chat._id.toString(),
          driver: driver.username,
          ride: {
            rideId: ride._id.toString(),
            origin: ride.origin || "Unknown",
            destination: ride.destination || "Unknown",
            date: ride.date || "Unknown",
            time: ride.time || "Unknown",
            seats: ride.seats || "Not Available",
            amount: ride.amount || "Not Available",
            driverPhone: driver.phone || "Not Available",
            driverEmail: driver.email || "Not Available",
          },
        };
      })
    );

    const filteredChats = riderChats.filter((chat) => chat !== null);

    res.render("riderChats", { chats: filteredChats, showNav: true });
  } catch (err) {
    console.error("Error fetching rider chats:", err);
    res.status(500).render("error", {
      message: "Unable to fetch chats. Please try again later.",
    });
  }
});

export default router;
