import { ridePost } from "../config/mongoCollection.js";
import { ObjectId } from "mongodb";

async function bookRide(rideId, passengerId) {
  const ridePostCollection = await ridePost();

  // Find the ride
  const ride = await ridePostCollection.findOne({ _id: new ObjectId(rideId) });
  if (!ride) throw new Error("Ride not found!");

  // Check if the ride is available
  if (!ride.isAvailable) {
    throw new Error("Ride is no longer available.");
  }

  // Check if there are available seats
  if (ride.seats <= 0) {
    throw new Error("No seats available for this ride.");
  }

  // Add passenger to the ride
  const updatedRide = await ridePostCollection.updateOne(
    { _id: new ObjectId(rideId) },
    {
      $push: { passengers: new ObjectId(passengerId) },
      $inc: { seats: -1 },
      $set: { isAvailable: ride.seats - 1 <= 0 ? false : true },
    }
  );

  if (!updatedRide.matchedCount || !updatedRide.modifiedCount) {
    throw new Error("Unable to book the ride.");
  }

  return true;
}

export default { bookRide };
