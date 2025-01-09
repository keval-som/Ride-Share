import authRoutes from "./auth.js";
import rideRoutes from "./verify.js";
import ridePost from "./ridePost.js";
import rideSearch from "./rideSearch.js";
import chatRoutes from "./chat.js";
import postedRides from "./postedRides.js";
import riderChats from "./riderChats.js";
import { static as staticDir } from "express";
import rideRequestRoutes from "./rideRequest.js";
import requestedRidesRoutes from "./requestedRides.js";
import upcomingRides from "./upcomingRides.js";
import verify from "./verify.js";
import rideHistory from "./rideHistory.js";
import review from "./review.js";

const constructorMethods = (app, io) => {
  app.use("/", authRoutes);
  // console.log("Registering /ridePost route");
  app.use("/ridePost", ridePost);
  app.use("/rideSearch", rideSearch);
  app.use("/chat", chatRoutes);
  app.use("/riderChats", riderChats);
  app.use("/rideRequest", rideRequestRoutes);
  app.use("/requestedRides", requestedRidesRoutes);
  app.use("/postedRides", postedRides);
  app.use("/upcomingRides", upcomingRides);
  app.use("/verify", verify);
  app.use("/rideHistory", rideHistory);
  app.use("/review", review);

  app.use("/public", staticDir("public"));

  app.use("*", (req, res) => {
    res.redirect("/");
  });
};

export default constructorMethods;
