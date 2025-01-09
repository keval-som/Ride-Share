import { ridePost, users } from "../config/mongoCollection.js";
import validator from "../helper.js";
//import moment from "moment";
import {ObjectId} from "mongodb";
//import {findByUsername} from "./users.js";

async function addDrivingLicense(license, licenseImg, res, req) {
  try {
    license = validator.checkString(license, "license");
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
  let driverDetails = {
    license,
    licenseImg: licenseImg.id,
  };
  try {
    const userCollection = await users();
    const updateInfo = await userCollection.updateOne(
      { username: req.session.user.username },
      { $set: { driverDetails, isVerified: true } }
    );
    if (updateInfo.modifiedCount === 0) {
      return res.status(500).json({ message: "Could not add driving license" });
    }
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
  req.session.user.isVerified = true;
  return res.redirect("/ridePost");
}

const getRide = async (id) => {
  if (!id)
    throw "Error: no ID provided";
  if (typeof id !== "string")
    throw "Error: ID is not a string";
  id = id.trim();
  if (id.length === 0)
    throw "Error: ID is empty or only spaces";
  if (!ObjectId.isValid(id))
    throw "Error: not a valid object ID";

  const collection = await ridePost();
  const ride = await collection.findOne({
    _id: ObjectId.createFromHexString(id)
  });
  if (!ride)
    throw "Error: no such ride with that ID";
  return ride;
};

const rideData = {
  addDrivingLicense,
  getRide
};

export default rideData;
