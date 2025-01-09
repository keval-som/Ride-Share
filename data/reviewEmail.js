import { rideHistory } from "../config/mongoCollection.js";
import { sendRideReviewEmail } from "../Routes/utils/mailer.js";

export const reviewEmail = async (insertedIdsList) => {
  let rideHistoryCollection = await rideHistory();
  let rideHistoryList = await rideHistoryCollection
    .find({ _id: { $in: insertedIdsList } })
    .toArray();
  for (let ride of rideHistoryList) {
    let ridersList = ride.riders;
    if (!ridersList) {
      continue;
    } else {
      await sendRideReviewEmail(ride);
    }
  }
};
