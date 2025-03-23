const { Submission, Employee, Notification } = require("../models/Submission");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "faizanamir103@gmail.com",
    pass: "gehr jwig stkl unmd",
  },
});

// Submit Video (Already implemented)
const submitVideo = async (req, res) => {
  try {
    const {
      empRef,
      videoURL,
      firstName,
      lastName,
      socialHandle,
      country,
      email,
      recordedVideo,
      rawVideo,
      notUploadedElsewhere,
      agreed18,
      agreedTerms,
      exclusiveRights,
      signature,
    } = req.body;

    console.log("Request Body:", req.body);

    const submission = new Submission({
      empRef,
      videoURL,
      firstName,
      lastName,
      socialHandle,
      country,
      email,
      rawVideo,
      recordedVideo,
      notUploadedElsewhere,
      agreed18,
      agreedTerms,
      exclusiveRights,
      signature,
    });
    await submission.save();
    const employee = await Employee.findById(empRef);
    if (!employee) {
      return res.status(400).json({ error: "Employee not found" });
    }

    // Email to Admin
    const adminMailOptions = {
      from: "faizanamir103@gmail.com",
      to: "faizanamir103@gmail.com", // Admin's email
      subject: "New Video Submission",
      html: `
        <h3>New Video Submission</h3>
        <p><strong>Creator:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>Social Handle:</strong> ${socialHandle}</p>
        <p><strong>Video URL:</strong> <a href="${videoURL}" target="_blank">Click here</a></p>
      `,
    };

    // Email to Employee
    const employeeMailOptions = {
      from: "faizanamir103@gmail.com",
      to: employee.email, // Employee's email
      subject: "New Video Submission Notification",
      html: `
        <h3>New Video Submitted</h3>
        <p>The creator <strong>${firstName} ${lastName}</strong> has submitted a new video.</p>
        <p>Please review it in the system.</p>
      `,
    };

    // Send Emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(employeeMailOptions);

    const newNotification = new Notification({
      creatorName: `${firstName} ${lastName}`,
      empRef: employee ? employee.name : "Unknown Employee",
      message: `New video submission by ${firstName} ${lastName}`,
    });

    await newNotification.save();

    res.status(200).json({ message: "Submission successful, emails sent" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get All Submissions (Fetching Employee Name from Employee Collection)
const getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find();

    // Fetch Employee Names using empRef
    const submissionsWithEmployee = await Promise.all(
      submissions.map(async (submission) => {
        const employee = await Employee.findById(submission.empRef).select(
          "name"
        );
        return {
          id: submission._id,
          employeeName: employee ? employee.name : "Unknown",
          videoURL: submission.videoURL,
          creatorName: `${submission.firstName} ${submission.lastName}`,
          email: submission.email,
        };
      })
    );

    res.status(200).json(submissionsWithEmployee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get Submission by ID (Show All Details)
const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find submission by ID and populate employee details
    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    const employee = await Employee.findById(submission.empRef);
    // Extract relevant data
    const videoDetails = {
      id: submission._id,
      title: submission.title || "Untitled Video",
      videoURL: submission.videoURL,
      creatorName: `${submission.firstName} ${submission.lastName}`,
      email: submission.email,
      socialHandle: submission.socialHandle,
      country: submission.country,
      rawVideo: submission.rawVideo,
      recordedVideo: submission.recordedVideo,
      notUploadedElsewhere: submission.notUploadedElsewhere,
      agreed18: submission.agreed18,
      employee: submission.empRef
        ? {
            name: employee.name,
            email: employee.email,
          }
        : null,
    };

    res.status(200).json(videoDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete Submission by ID
const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSubmission = await Submission.findByIdAndDelete(id);
    if (!deletedSubmission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    res.status(200).json({ message: "Submission deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  submitVideo,
  getAllSubmissions,
  getVideoById,
  deleteSubmission,
};
