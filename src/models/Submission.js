const mongoose = require("mongoose");

// Submission Schema
const SubmissionSchema = new mongoose.Schema(
  {
    empRef: String,
    videoURL: String,
    firstName: String,
    lastName: String,
    socialHandle: String,
    country: String,
    email: String,
    rawVideo : String,
    recordedVideo: Boolean,
    notUploadedElsewhere: Boolean,
    agreed18: Boolean,
    agreedTerms: Boolean,
    exclusiveRights: Boolean,
    signature: String,
  },
  { timestamps: true } 
);

// Admin Schema
const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: "admin" },
  },
  { timestamps: true }
);

// Employee Schema
const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    formLink: { type: String },
  },
  { timestamps: true }
);

const notificationSchema = new mongoose.Schema(
  {
    creatorName: { type: String, required: true }, // Name of the creator (firstName + lastName)
    employeeName: String,
    message: { type: String, required: true }, // Notification message
    isRead: { type: Boolean, default: false }, // To mark notification as read/unread
  },
  { timestamps: true }
);



// Export all models
const Submission = mongoose.model("Submission", SubmissionSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Employee = mongoose.model("Employee", employeeSchema);
const Notification = mongoose.model("Notification", notificationSchema);

module.exports = { Submission, Admin, Employee , Notification};
