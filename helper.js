import express from "express";
import moment from "moment";
import xss from "xss";
import { ObjectId } from "mongodb";

function isValidEmail(email, varName) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) throw `Error: ${varName} cannot be empty`;
  if (typeof email !== "string")
    throw `Error: ${varName} needs to be of valid type`;

  email = email.trim();
  if (email.length === 0)
    throw `Error: ${varName} cannot be an empty string or string with just spaces`;

  if (!emailRegex.test(email)) {
    throw `Error: ${email} is not a valid ${varName}`;
  }
  return email;
}

function isValidPhoneNumber(phone, varName) {
  const phoneRegex = /^(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}$/;
  if (!phone) throw `Error: ${varName} cannot be empty`;
  if (typeof phone !== "string")
    throw `Error: ${varName} needs to be of valid type`;

  phone = phone.trim();
  if (phone.length === 0)
    throw `Error: ${varName} cannot be an empty string or string with just spaces`;

  // Throw an error if phone does not match the regex
  if (!phoneRegex.test(phone)) {
    throw `Error: ${phone} is not a valid ${varName}`;
  }
  return phone;
}

function checkString(strVal, varName) {
  if (!strVal) throw `Error: You must supply a ${varName}!`;
  if (typeof strVal !== "string") throw `Error: ${varName} must be a string!`;
  strVal = strVal.trim();
  if (strVal.length === 0)
    throw `Error: ${varName} cannot be an empty string or string with just spaces`;
  // if (!isNaN(strVal)){
  //   throw `Error: ${strVal} is not a valid value for ${varName} as it only contains digits`;
  // }
  strVal = xss(strVal);
  return strVal;
}

function isNumber(number) {
  return number >= 0 && typeof number === "number";
}

function isStringArray(strArr) {
  if (!Array.isArray(strArr)) {
    return false;
  }
  strArr.forEach((Element) => {
    if (typeof Element !== "string") {
      return false;
    }
  });
  return true;
}

function isValidId(id) {
  if (!id) throw new Error("You must provide an id to search for");
  if (typeof id !== "string") throw new Error("Id must be a string");
  if (id.trim().length === 0)
    throw new Error("Id cannot be an empty string or just spaces");
  id = id.trim();
  if (!ObjectId.isValid(id)) throw new Error("invalid object ID");
  return id;
}

function checkDate(date) {
  if (!date) throw new Error("You must provide a date");
  if (typeof date !== "string") throw new Error("Date must be a string");
  if (date.trim().length === 0)
    throw new Error("Date cannot be an empty string or just spaces");
  date = date.trim();
  if (!moment(date, "YYYY-MM-DD", true).isValid())
    throw new Error("Invalid date format");
  return date;
}

function checkTime(time) {
  if (!time) throw new Error("You must provide a time");
  if (typeof time !== "string") throw new Error("Time must be a string");
  if (time.trim().length === 0)
    throw new Error("Time cannot be an empty string or just spaces");
  time = time.trim();
  if (!moment(time, "HH:mm", true).isValid())
    throw new Error("Invalid time format");
  return time;
}

function checkNumber(number) {
  number = parseInt(number);
  if (typeof number !== "number") throw new Error("Number must be a number");
  if (number < 0) throw new Error("Number must be a positive number");
  return number;
}

const validator = {
  isValidEmail,
  isValidPhoneNumber,
  checkString,
  isStringArray,
  isNumber,
  isValidId,
  checkDate,
  checkTime,
  checkNumber,
};
export default validator;
