import express from "express";
import validator from "../helper.js";
import bcrypt from "bcrypt";
import usersData from "../data/users.js";
//import isAuthenticated from "../middleware/authMiddleware.js";
import rideData from "../data/rides.js";
import { sendEmail } from "./utils/mailer.js";
import bookRide from "../data/bookRide.js";
import { rideRequests, ridePost } from "../config/mongoCollection.js";
import { ObjectId } from "mongodb";

const router = express.Router();

const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

router.get("/signup", (req, res) => {
  res.render("signup", { title: "Sign Up", showNav: false });
});

router.post("/signup", async (req, res) => {
  let { firstname, lastname, phone, username, email, password } = req.body;

  if (!firstname || !lastname || !phone || !username || !email || !password) {
    return res.status(400).render("error", {
      message: "All fields must be filled out.",
      title: "Sign Up",
    });
  }

  let errors = [];
  try {
    firstname = validator.checkString(firstname, "First Name");
  } catch (e) {
    errors.push(e);
  }
  try {
    lastname = validator.checkString(lastname, "Last Name");
  } catch (e) {
    errors.push(e);
  }
  try {
    phone = validator.isValidPhoneNumber(phone, "Phone Number");
  } catch (e) {
    errors.push(e);
  }
  try {
    username = validator.checkString(username, "Username");
  } catch (e) {
    errors.push(e);
  }
  try {
    password = validator.checkString(password, "Password");
  } catch (e) {
    errors.push(e);
  }
  try {
    email = validator.isValidEmail(email, "Email");
  } catch (e) {
    errors.push(e);
  }

  if (await usersData.findByUsername(username)) {
    errors.push(`${username} already exists.`);
  }

  if (await usersData.findByEmail(email)) {
    errors.push(`You already have a coount with Email: ${email}`);
  }

  if (errors.length > 0) {
    return res.status(400).render("signup", {
      errors,
      hasErrors: true,
      signup: { firstname, lastname, phone, username, email },
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await usersData.addUser({
      firstname,
      lastname,
      phone,
      username,
      email,
      password: hashedPassword,
      rider_review: 0,
      Driver_review: 0,
      rider_review_count: 0,
      Driver_review_count: 0,
      number_of_rides_taken: 0,
      number_of_rides_given: 0,
      number_of_reports_made: 0,
    });
    res.redirect("/login");
  } catch (e) {
    res.status(500).render("signup", {
      error: "Error creating account. Please try again.",
      title: "Sign Up",
    });
  }
});

router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("login", { title: "Login", showNav: false });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await usersData.findByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.user = {
        id: user.id,
        username: user.username,
        isVerified: user.isVerified,
      };
      return res.redirect("/dashboard");
    } else {
      return res.status(400).render("login", {
        error: "Invalid username or password",
        title: "Login",
      });
    }
  } catch (e) {
    res.status(500).render("login", {
      error: "Login failed",
      title: "Login",
    });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Unable to log out");
    }
    res.redirect("/login");
  });
});

router.get("/", ensureAuthenticated, (req, res) => {
  res.render("dashboard", {
    title: "Dashboard",
    user: req.session.user,
    showNav: true,
  });
});

router.get("/profile", ensureAuthenticated, async (req, res) => {
  try {
    const username = req.session.user.username;
    const user = await usersData.findByUsername(username);

    if (!user) {
      return res
        .status(404)
        .render("error", { message: "User not found", title: "Error" });
    }

    const generateStars = (rating) => {
      let stars = "";
      for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
          stars += '<span class="star filled">&#9733;</span>';
        } else {
          stars += '<span class="star">&#9733;</span>';
        }
      }
      return stars;
    };

    const riderStars = generateStars(Math.round(user.rider_review || 0));
    const driverStars = generateStars(Math.round(user.Driver_review || 0));

    res.render("profile", {
      title: "Profile",
      user: {
        name: `${user.firstname} ${user.lastname}`,
        phone: user.phone || "Not Provided",
        email: user.email || "Not Provided",
        username: user.username,
        riderReview: user.rider_review,
        driverReview: user.driver_review,
        riderReviewCount: user.rider_review_count || 0,
        driverReviewCount: user.Driver_review_count || 0,
        ridesTaken: user.number_of_rides_taken || 0,
        ridesGiven: user.number_of_rides_given || 0,
        reportsMade: user.number_of_rides_made || 0,
      },
      showNav: true,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .render("error", { message: "Internal Server Error", title: "Error" });
  }
});

router.get("/rideinfo/:id", ensureAuthenticated, async (req, res) => {
  try {
    const ride = await rideData.getRide(req.params.id)
    res.render("rideInfo", {
      title: "Ride Info",
      ride: ride,
      isError: false,
      booked: false,
      showNav: true,
    });
  } catch (e) {
    return res.status(400).render("error", {
      message: e,
      title: "Ride Info",
    });
  }
});
router.post("/rideinfo/:id", ensureAuthenticated, async (req, res) => {
  try {
    await bookRide(req.params.id, req.session.user._id);
    return res.redirect("/rideinfo", {
      isError: false,
      booked: true
    });
  } catch (e) {
    return res.redirect("/rideinfo", {
      isError: true,
    });
  }
});

router.post(
  "/profile/shareTripStatus",
  ensureAuthenticated,
  async (req, res) => {
    const { shareEmail } = req.body;
    const user = req.session.user;

    if (!shareEmail) {
      return res.status(400).render("error", {
        message: "Email is required to share the trip status",
        title: "Error",
      });
    }

    try {
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

          const driverDetails = await usersData.findByUsername(request.driver);
          const riderDetails = await usersData.findByUsername(request.rider);

          if (!driverDetails) {
            return res.status(404).render("error", {
              message: "Driver details not found",
              title: "Error",
            });
          }

          if (!riderDetails) {
            return res.status(404).render("error", {
              message: "Rider details not found",
              title: "Error",
            });
          }

          const emailContent = `
          <h2>Trip Status</h2>
          <p>${user.username} has shared their trip status with you.</p>
          <p>Current trip details:</p>
          <ul>
            <li><strong>Origin:</strong> ${ride.origin}</li>
            <li><strong>Destination:</strong> ${ride.destination}</li>
            <li><strong>Date:</strong> ${ride.date}</li>
            <li><strong>Time:</strong> ${ride.time}</li>
          </ul>
          <p>Driver details:</p>
          <ul>
            <li><strong>Name:</strong> ${driverDetails.firstname} ${driverDetails.lastname}</li>
            <li><strong>Phone:</strong> ${driverDetails.phone}</li>
            <li><strong>Car Model:</strong> ${ride.carType}</li>
            <li><strong>License Plate:</strong> ${driverDetails.driverDetails.license}</li>
          </ul>`;

          await sendEmail(shareEmail, "Trip Status Shared", emailContent);

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
          };
        })
      );
      req.session.flash = { success: "Trip status shared successfully!" };
      res.redirect("/profile");
    } catch (error) {
      console.error("Error sharing trip status:", error);
      res.status(500).render("error", {
        message: "Unable to share trip status. Please try again later.",
        title: "Error",
      });
    }
  }
);

export default router;
