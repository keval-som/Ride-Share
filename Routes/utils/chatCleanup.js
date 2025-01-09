import {
  chatSessions,
  ridePost,
  rideHistory,
  rideRequests,
} from "../../config/mongoCollection.js";
import { ObjectId } from "mongodb";
import { reviewEmail } from "../../data/reviewEmail.js";

export const chatCleanup = async () => {
  try {
    const currentDate = new Date();

    const chatSessionCollection = await chatSessions();
    const ridePostCollection = await ridePost();
    const rideHistoryCollection = await rideHistory();
    const rideRequestsCollection = await rideRequests();

    const ridesToArchive = await ridePostCollection
      .find({
        date: { $lt: currentDate.toISOString().split("T")[0] },
      })
      .toArray();

    if (ridesToArchive.length > 0) {
      const archivedRides = ridesToArchive.map((ride) => ({
        origin: ride.origin,
        destination: ride.destination,
        date: ride.date,
        time: ride.time,
        amount: ride.amount,
        seats: ride.seats,
        status: "Finished",
        driver: ride.driverId,
        riders: ride.riders,
        createdAt: ride.createdAt,
        archivedAt: currentDate,
      }));

      const result = await rideHistoryCollection.insertMany(archivedRides);
      const insertedIds = result.insertedIds;
      const insertedIdsList = Object.values(insertedIds).map((id) => id);
      const revResp = await reviewEmail(insertedIdsList);

      const rideIdsToCleanup = ridesToArchive.map((ride) =>
        ride._id.toString()
      );

      await chatSessionCollection.deleteMany({
        rideId: { $in: rideIdsToCleanup },
      });

      await rideRequestsCollection.deleteMany({
        rideId: { $in: rideIdsToCleanup },
      });

      const rideIdsToCleanupObj = rideIdsToCleanup.map(
        (id) => new ObjectId(id)
      );
      const resp = await ridePostCollection.deleteMany({
        _id: { $in: rideIdsToCleanupObj },
      });
      console.log(
        `Archived ${ridesToArchive.length} rides to rideHistory and cleaned up associated chat sessions.`
      );
    } else {
      console.log("No rides to archive or clean up.");
    }

    const allChatSessions = await chatSessionCollection.find({}).toArray();
    for (const session of allChatSessions) {
      const rideExists = await ridePostCollection.findOne({
        _id: new ObjectId(session.rideId),
      });
      if (!rideExists) {
        await chatSessionCollection.deleteOne({ _id: session._id });
        console.log(
          `Deleted orphaned chat session with rideId: ${session.rideId}`
        );
      }
    }

    const allRideRequests = await rideRequestsCollection.find({}).toArray();
    for (const request of allRideRequests) {
      const rideExists = await ridePostCollection.findOne({
        _id: new ObjectId(request.rideId),
      });
      if (!rideExists) {
        await rideRequestsCollection.deleteOne({ _id: request._id });
        console.log(
          `Deleted orphaned ride request with rideId: ${request.rideId}`
        );
      }
    }

    console.log("Chat and ride request cleanup completed.");
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
};
