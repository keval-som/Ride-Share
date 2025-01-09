import { users } from "../config/mongoCollection.js";
import validator from "../helper.js";
import {ObjectId} from "mongodb";

async function addUser(user) {
  let firstname = user.firstname;
  let lastname = user.lastname;
  let phone = user.phone;
  let username = user.username;
  let email = user.email;
  let password = user.password;
  if (!firstname || !lastname || !phone || !username || !email || !password) {
    return res
      .status(400)
      .render("error", { message: "All the fields must be present" });
  }

  try {
    firstname = validator.checkString(firstname, "First Name");
  } catch (e) {
    throw new Error(e.message);
  }
  try {
    lastname = validator.checkString(lastname, "Last Name");
  } catch (e) {
    throw new Error(e.message);
  }

  try {
    phone = validator.isValidPhoneNumber(phone, "Phone Number");
  } catch (e) {
    throw new Error(e.message);
  }

  try {
    username = validator.checkString(username, "UserName");
  } catch (e) {
    throw new Error(e.message);
  }

  try {
    password = validator.checkString(password, "Password");
  } catch (e) {
    throw new Error(e.message);
  }
  try {
    email = validator.isValidEmail(email, "email");
  } catch (e) {
    throw new Error(e.message);
  }

  const userCollection = await users();
  const addedUser = await userCollection.insertOne(user);
  if (!addedUser.insertedId)
    throw new Error("Could not add the user to the database");
  return addedUser;
}

export async function findByUsername(username) {
  if (!username) throw new Error("No username was provided");

  const userCollection = await users();
  const user = userCollection.findOne({ username });

  return user;
}

async function findByEmail(email) {
  if (!email) throw new Error("No email was provided");

  const userCollection = await users();
  const user = userCollection.findOne({ email });

  return user;
}

const findById = async (id) => {
  if (!id)
    throw "Error: no ID provided";
  if (!ObjectId.isValid(id))
    throw "Error: not a valid object ID";

  const userCollection = await users();
  const user = userCollection.findOne({
    _id: ObjectId.createFromHexString(id)
  });
  if (!user)
    throw "Error: no such user with that ID";
  return user;
};

const usersData = {
  addUser,
  findByUsername,
  findByEmail,
  findById
};

export default usersData;
