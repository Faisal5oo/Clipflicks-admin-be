const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendNotificationEmail = async (email, firstName, lastName, videoURL, employeeRef) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: [process.env.ADMIN_EMAIL, email],
    subject: "New Video Submission Received",
    text: `A new video has been submitted by ${firstName} ${lastName}.\nVideo Link: ${videoURL}\nReferred by: ${employeeRef || "Admin"}`,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendNotificationEmail };