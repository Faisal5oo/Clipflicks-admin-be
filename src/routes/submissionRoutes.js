const express = require("express");
const multer = require("multer");
const {
  submitVideo,
  getAllSubmissions,
  getVideoById,
  deleteSubmission,
  getRecentSubmissions,
  getTopEmployeeOverview,
  getStats
} = require("../controllers/submissionController");
const { Notification } = require("../models/Submission");

const router = express.Router();
router.post("/submit-video", submitVideo);
router.get("/all", getAllSubmissions);
router.get("/recent-submissions", getRecentSubmissions);
router.get("/overview", getTopEmployeeOverview);
router.get("/stats", getStats);
router.get("/:id", getVideoById);
router.delete("/delete/:id", deleteSubmission);

// router.get("/overview", getTopEmployeeBySubmissions);

router.get("/notification/all", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark a notification as read
router.put("/notification/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
