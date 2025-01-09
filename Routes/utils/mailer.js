import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { users } from "../../config/mongoCollection.js";
dotenv.config();

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * @param {string} to
 * @param {string} subject
 * @param {string} htmlContent
 */
export const sendEmail = async (to, subject, htmlContent) => {
  const mailOptions = {
    from: `"Mail" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    throw new Error("Email could not be sent");
  }
};

/**
 * @param {Object} rideDetails
 * @param {Object} driverDetails
 * @param {Object} riderDetails
 */
export const sendRideConfirmationEmails = async (
  rideDetails,
  driverDetails,
  riderDetails
) => {
  const riderEmailContent = `
    <h2>Ride Confirmation</h2>
    <p>Your ride has been confirmed with the following details:</p>
    <ul>
      <li><strong>Driver:</strong> ${driverDetails.firstname} ${driverDetails.lastname}</li>
      <li><strong>Email:</strong> ${driverDetails.email}</li>
      <li><strong>Phone:</strong> ${driverDetails.phone}</li>
      <li><strong>Date:</strong> ${rideDetails.date}</li>
      <li><strong>Time:</strong> ${rideDetails.time}</li>
      <li><strong>Origin:</strong> ${rideDetails.origin}</li>
      <li><strong>Destination:</strong> ${rideDetails.destination}</li>
    </ul>
    <p>Enjoy your ride!</p>
  `;

  const driverEmailContent = `
    <h2>Ride Confirmation</h2>
    <p>Your ride has been confirmed with the following details:</p>
    <ul>
      <li><strong>Rider:</strong> ${riderDetails.firstname} ${riderDetails.lastname}</li>
      <li><strong>Email:</strong> ${riderDetails.email}</li>
      <li><strong>Phone:</strong> ${riderDetails.phone}</li>
      <li><strong>Date:</strong> ${rideDetails.date}</li>
      <li><strong>Time:</strong> ${rideDetails.time}</li>
      <li><strong>Origin:</strong> ${rideDetails.origin}</li>
      <li><strong>Destination:</strong> ${rideDetails.destination}</li>
    </ul>
    <p>Drive safely!</p>
  `;

  // Send emails
  await sendEmail(riderDetails.email, "Ride Confirmation", riderEmailContent);
  await sendEmail(driverDetails.email, "Ride Confirmation", driverEmailContent);
};

/**

 * @param {Object} rideDetails 
 * @param {Object} driverDetails
 * @param {Object} riderDetails 
 */
export const sendRideReminderEmails = async (
  rideDetails,
  driverDetails,
  riderDetails
) => {
  const riderReminderContent = `
    <h2>Upcoming Ride Reminder</h2>
    <p>Your ride is scheduled to start soon:</p>
    <ul>
      <li><strong>Driver:</strong> ${driverDetails.firstname} ${driverDetails.lastname}</li>
      <li><strong>Email:</strong> ${driverDetails.email}</li>
      <li><strong>Phone:</strong> ${driverDetails.phone}</li>
      <li><strong>Date:</strong> ${rideDetails.date}</li>
      <li><strong>Time:</strong> ${rideDetails.time}</li>
      <li><strong>Origin:</strong> ${rideDetails.origin}</li>
      <li><strong>Destination:</strong> ${rideDetails.destination}</li>
    </ul>
    <p>Enjoy your ride!</p>
  `;

  const driverReminderContent = `
    <h2>Upcoming Ride Reminder</h2>
    <p>Your ride is scheduled to start soon:</p>
    <ul>
      <li><strong>Rider:</strong> ${riderDetails.firstname} ${riderDetails.lastname}</li>
      <li><strong>Email:</strong> ${riderDetails.email}</li>
      <li><strong>Phone:</strong> ${riderDetails.phone}</li>
      <li><strong>Date:</strong> ${rideDetails.date}</li>
      <li><strong>Time:</strong> ${rideDetails.time}</li>
      <li><strong>Origin:</strong> ${rideDetails.origin}</li>
      <li><strong>Destination:</strong> ${rideDetails.destination}</li>
    </ul>
    <p>Drive safely!</p>
  `;

  await sendEmail(
    riderDetails.email,
    "Upcoming Ride Reminder",
    riderReminderContent
  );
  await sendEmail(
    driverDetails.email,
    "Upcoming Ride Reminder",
    driverReminderContent
  );
};

/**
 * @param {Object} rideDetails
 */

export const sendRideReviewEmail = async (rideDetails) => {
  for (let reviewee of rideDetails.riders) {
    const reviewFormUrl = `http://localhost:3000/review/?reviewer=${reviewee}&user=${rideDetails.driver}&rideId=${rideDetails._id}`;
    const emailContent = ` 
    <h2>Ride Review</h2>
    <p>We hope you had a great ride! Please take a moment to provide your feedback by filling out the review form:</p>
    <p><a href="${reviewFormUrl}">Ride Review Form : ${reviewFormUrl}</a></p>
    <p>Thank you for your feedback!</p>`;
    let user = await users();
    let userDetails = await user.findOne({ username: reviewee });
    await sendEmail(userDetails.email, "Ride Review", emailContent);
  }
};
