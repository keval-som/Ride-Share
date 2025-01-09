import express from "express";
import ridePostData from "../data/ridePost.js";
import validator from "../helper.js";
import axios from "axios";
import dotenv from "dotenv";
import { carTypes, locations } from "../constants.js";

dotenv.config();

const router = express.Router();

const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

router.get("/", ensureAuthenticated, (req, res) => {
  if (!req.session.user.isVerified) {
    return res.redirect("/verify");
  }
  res.render("ridePost", {
    title: "Ride Post",
    user: req.session.user,
    showNav: true,
  });
});

router.post("/post", ensureAuthenticated, async (req, res) => {
  try {
    const {
      origin,
      destination,
      date,
      time,
      seats,
      amount,
      carType,
      description,
    } = req.body;

    if (
      !origin ||
      !destination ||
      !date ||
      !time ||
      !seats ||
      !amount ||
      !carType ||
      !description
    ) {
      return res
        .status(400)
        .render("error", { message: "All fields are required!" });
    }

    const validatedOrigin = validator.checkString(origin, "Origin");
    const validatedDestination = validator.checkString(
      destination,
      "Destination"
    );
    if (
      !locations.includes(validatedOrigin) ||
      !locations.includes(validatedDestination)
    ) {
      return res.status(400).render("error", {
        message: "Origin and destination must be valid locations!",
      });
    }
    if (validatedOrigin === validatedDestination) {
      return res.status(400).render("error", {
        message: "Origin and destination cannot be the same!",
      });
    }
    const validatedSeats = validator.checkNumber(seats, "Seats");
    if (!carTypes.get(carType)) {
      return res.status(400).render("error", {
        message: "Car type must be valid!",
      });
    }
    if (carTypes.get(carType) < validatedSeats) {
      return res.status(400).render("error", {
        message: "Car type must have enough seats!",
      });
    }
    const validatedAmount = validator.checkNumber(amount, "Amount");
    let validatedDate = validator.checkDate(date, "Date");
    const validatedTime = validator.checkTime(time, "Time");

    if (validatedSeats <= 0 || validatedAmount <= 0) {
      return res.status(400).render("error", {
        message: "Seats and amount must be greater than 0!",
      });
    }

    const updateddescription = validator.checkString(
      description,
      "Description"
    );

    const driverId = req.session.user.username;

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      validatedOrigin
    )}&destinations=${encodeURIComponent(validatedDestination)}&key=${apiKey}`;

    let estimatedDuration = null;

    try {
      const response = await axios.get(distanceMatrixUrl);

      if (response.data && response.data.rows[0].elements[0].status === "OK") {
        estimatedDuration = response.data.rows[0].elements[0].duration.value; // Duration in seconds
      } else {
        console.warn("Unable to fetch estimated duration from Google API.");
      }
    } catch (apiError) {
      console.error("Error fetching estimated duration:", apiError);
    }

    const ridePost = await ridePostData.addRidePost({
      driverId: driverId,
      origin: validatedOrigin,
      destination: validatedDestination,
      date: validatedDate,
      time,
      seats: validatedSeats,
      amount: validatedAmount,
      carType,
      estimatedDuration,
      description: updateddescription,
    });

    res.redirect(`/dashboard`);
  } catch (error) {
    console.error("Error in ride post:", error);
    res.status(500).render("error", {
      message: "Unable to post ride. Please try again later.",
    });
  }
});

export default router;
