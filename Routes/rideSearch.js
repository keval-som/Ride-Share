import express from "express";
import { ridePost, users } from "../config/mongoCollection.js";
import { ObjectId } from "mongodb";
import dayjs from "dayjs";
import validator from "../helper.js";
import { locations } from "../constants.js";

const router = express.Router();

// Ensure the user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

router.get("/", ensureAuthenticated, (req, res) => {
  res.render("rideSearch", {
    title: "Ride Search",
    user: req.session.user,
    showNav: true,
  });
});

router.post("/", ensureAuthenticated, async (req, res) => {
  try {
    let {
      startLocation,
      endLocation,
      date,
      time,
      seatsRequired,
      minPrice,
      maxPrice,
    } = req.body;
    const user = req.session.user;

    if (
      !startLocation ||
      !endLocation ||
      !date ||
      !time ||
      !seatsRequired ||
      !minPrice ||
      !maxPrice
    ) {
      return res.status(400).render("error", {
        message: "All fields are required.",
      });
    }

    try {
      startLocation = validator.checkString(startLocation, "Start location");
      endLocation = validator.checkString(endLocation, "End location");
      date = validator.checkString(date, "Date");
      seatsRequired = validator.checkNumber(seatsRequired, "Seats required");
      minPrice = validator.checkNumber(minPrice, "Minimum price");
      maxPrice = validator.checkNumber(maxPrice, "Maximum price");
      if (minPrice > maxPrice) {
        throw new Error("Minimum price cannot be greater than maximum price.");
      }
      if (startLocation === endLocation) {
        throw new Error("Start and end locations cannot be the same.");
      }
      if (
        !locations.includes(startLocation) ||
        !locations.includes(endLocation)
      ) {
        throw new Error("Invalid location.");
      }
    } catch (error) {
      return res.status(400).render("error", {
        message: error.message,
      });
    }

    // Validate the time format (HH:mm)

    const riderTime = dayjs(`${date} ${time}`, "YYYY-MM-DD HH:mm", true);
    if (!riderTime.isValid()) {
      return res.status(400).render("error", {
        message: "Invalid date or time.",
      });
    }

    const timeWindow = 6; // in hours
    // Create a one-hour time window around the requested time
    const timeLowerBound = riderTime
      .subtract(timeWindow, "hour")
      .startOf("day")
      .format("HH:mm");
    const timeUpperBound = riderTime
      .add(timeWindow, "hour")
      .endOf("day")
      .format("HH:mm");

    let amountLowerBound = validator.checkNumber(minPrice, "Minimum price");
    let amountUpperBound = validator.checkNumber(maxPrice, "Maximum price");

    const ridePostCollection = await ridePost();
    const usersCollection = await users();

    const availableRides = await ridePostCollection
      .find({
        isAvailable: true,
        date,
        seats: { $gte: parseInt(seatsRequired) },
        origin: startLocation,
        destination: endLocation,
        driverId: { $ne: user.username },
        time: { $gte: timeLowerBound, $lte: timeUpperBound },
        amount: { $gte: amountLowerBound, $lte: amountUpperBound },
      })
      .toArray();

    const ridesWithDetails = await Promise.all(
      availableRides.map(async (ride) => {
        const driver = await usersCollection.findOne({
          username: ride.driverId,
        });
        return {
          rideId: ride._id.toString(),
          origin: ride.origin,
          destination: ride.destination,
          date: ride.date,
          time: ride.time,
          seats: ride.seats,
          amount: ride.amount,
          driverName: driver
            ? `${driver.firstname} ${driver.lastname}`
            : "Unknown",
          carType: ride.carType,
          description: ride.description,
          driverId: ride.driverId,
        };
      })
    );

    res.render("rides", {
      title: "Available Rides",
      hasRides: ridesWithDetails.length > 0,
      rides: ridesWithDetails,
      showNav: true,
    });
  } catch (error) {
    console.error("Error during ride search:", error);
    res.status(500).render("error", {
      message: "Unable to fetch rides. Please try again later.",
    });
  }
});

export default router;
