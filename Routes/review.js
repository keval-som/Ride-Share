import express from "express";
import { ObjectId } from "mongodb";
import validator from "../helper.js";
import { users, rideHistory } from "../config/mongoCollection.js";
const router = express.Router();

router.get("/", async (req, res) => {
  let { reviewer, user, rideId } = req.query;
  try {
    reviewer = validator.checkString(reviewer, "Reviewer");
    user = validator.checkString(user, "User");
    rideId = validator.isValidId(rideId, "Ride ID");
  } catch (e) {
    return res.status(400).render("review", {
      reviewer,
      user,
      rideId,
      error: "User not found",
    });
  }
  try {
    const userCollection = await users();
    let userData = await userCollection.findOne({ username: user });
    if (!userData) {
      return res.status(400).render("review", {
        reviewer,
        user,
        rideId,
        error: "User not found",
      });
    }
    let reviewerData = await userCollection.findOne({ username: reviewer });
    if (!reviewerData) {
      return res.status(400).render("review", {
        reviewer,
        user,
        rideId,
        error: "Reviewer not found",
      });
    }
    return res.render("review", {
      user: user,
      reviewer: reviewer,
      rideId: rideId,
      showNav: true,
    });
  } catch (e) {
    return res.status(500).render("review", {
      reviewer,
      user,
      rideId,
      error: e,
    });
  }
});

router.post("/", async (req, res) => {
  let reviewer = req.body.reviewer;
  let user = req.body.user;
  let rideId = req.body.rideId;
  let rating = req.body.rating;
  let comment = req.body.comment;
  try {
    reviewer = validator.checkString(reviewer, "Reviewer");
    user = validator.checkString(user, "User");
    rideId = validator.isValidId(rideId, "Ride ID");
    rating = validator.checkNumber(rating, "Rating");
    if (rating < 1 || rating > 5) {
      throw "Rating should be between 1 and 5";
    }
    comment = validator.checkString(comment, "Comment");
  } catch (e) {
    return res.status(400).render("review", {
      reviewer,
      user,
      rideId,
      error: e,
      title: "Error",
    });
  }
  try {
    const userCollection = await users();
    let userData = await userCollection.findOne({ username: user });
    if (!userData) {
      throw new Error("User not found");
    }
    let reviewerData = await userCollection.findOne({ username: reviewer });
    if (!reviewerData) {
      throw new Error("Reviewer not found");
    }
    let rideHistoryCollection = await rideHistory();
    let rideHist = await rideHistoryCollection.findOne({
      _id: new ObjectId(rideId),
    });
    if (!rideHist) {
      return res.status(400).render("review", {
        reviewer,
        user,
        rideId,
        error: "Ride not found",
      });
    }
    if (rideHist.driver !== user || rideHist.riders.indexOf(reviewer) === -1) {
      console.log(rideHist.driver, user, rideHist.riders, reviewer);
      return res.status(400).render("review", {
        reviewer,
        user,
        rideId,
        error: "You are not the driver or rider of this ride",
      });
    }
    let reviewsList = userData.reviews;
    if (!reviewsList) {
      reviewsList = [];
    } else {
      for (let review of reviewsList) {
        if (review.rideId === rideId) {
          return res.status(400).render("review", {
            reviewer,
            user,
            rideId,
            error: "Review already submitted",
          });
        }
      }
    }
    reviewsList.push({
      rideId: rideId,
      reviewer: reviewer,
      rating: rating,
      comment: comment,
    });
    let driver_review = userData.Driver_review;
    let Driver_review_count = userData.Driver_review_count;
    Driver_review_count = Driver_review_count + 1;
    driver_review = (driver_review + rating) / Driver_review_count;
    let updatedUser = await userCollection.updateOne(
      { username: user },
      {
        $set: {
          reviews: reviewsList,
          Driver_review: driver_review,
          Driver_review_count: Driver_review_count,
        },
      }
    );
    if (updatedUser.modifiedCount === 0) {
      return res.status(400).render("review", {
        reviewer,
        user,
        rideId,
        error: e.message,
        title: "Error",
      });
    }
    return res.render("review", {
      reviewer,
      user,
      rideId,
      success: "Review submitted successfully!",
      title: "Review",
    });
  } catch (e) {
    return res.status(400).render("review", {
      reviewer,
      user,
      rideId,
      error: e.message,
      title: "Error",
    });
  }
});

router.get("/:rideId", async (req, res) => {
  try {
    const rideId = req.params.rideId;
    console.log("This is the ride id", rideId);
    const userCollection = await users();
    const userData = await userCollection.findOne({
      username: rideId,
    });

    if (!userData) {
      return res.status(404).render("error", {
        error: "Driver not found",
        title: "Error",
      });
    }
    if (!userData.reviews) {
      return res.status(404).render("driverReviews", {
        error: "Reviews not found",
        title: "No reviews yet",
      });
    }

    if (userData && userData.reviews) {
      const allReviews = userData.reviews.map((review) => {
        console.log("4. Processing review:", {
          rideId: review.rideId,
          reviewer: review.reviewer,
          rating: review.rating,
          comment: review.comment,
        });
        return {
          rideId: review.rideId,
          reviewer: review.reviewer,
          rating: review.rating,
          comment: review.comment,
        };
      });

      res.render("driverReviews", {
        title: `Reviews for Driver`,
        driver: userData.username,
        reviews: allReviews,
        hasReviews: allReviews.length > 0,
        error: null,
        rideId: rideId,
      });
    }
  } catch (e) {
    return res.status(500).render("error", {
      error: e.message,
      title: "Error",
    });
  }
});

export default router;
