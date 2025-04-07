const { Submission, Employee, Notification } = require("../models/Submission");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
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

    // Check if empRef exists
    let employee;
    if (empRef) {
      // If empRef is provided, find the employee
      employee = await Employee.findById(empRef);
      if (!employee) {
        return res.status(400).json({ error: "Employee not found" });
      }
      console.log("Employee:", employee);
    } else {
      console.log(
        "No empRef provided, normal submission without employee link."
      );
    }

    // Save Base64 Signature as PNG
    const signaturePath = path.join(
      __dirname,
      "../../uploads",
      `signature_${Date.now()}.png`
    );

    // Extract Base64 Data
    const matches = signature.match(/^data:image\/png;base64,(.+)$/);
    if (!matches || matches.length !== 2) {
      throw new Error("Invalid Base64 signature format");
    }

    const imageBuffer = Buffer.from(matches[1], "base64");
    fs.writeFileSync(signaturePath, imageBuffer);

    console.log("Signature image saved at:", signaturePath);

    // Email to Admin
    const adminMailOptions = {
      from: "faizanamir103@gmail.com",
      to: "faizanamir103@gmail.com",
      subject: "New Video Submission",
      html: `
        <h3>New Video Submission</h3>
        <p><strong>Creator:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>Social Handle:</strong> ${socialHandle}</p>
        <p><strong>Video URL:</strong> <a href="${videoURL}" target="_blank">Click here</a></p>
        <p><strong>Download Video from this Link:</strong> <a href="${rawVideo}" target="_blank">Click here</a></p>
         <h3 style="color: #0056b3;">✅ Submission Agreement</h3>
        <p><strong>✔️ Verified 18+:</strong> ${agreed18 ? "Yes" : "No"}</p>
        <p><strong>✔️ Agreed to Terms & Privacy:</strong> ${
          agreedTerms ? "Yes" : "No"
        }</p>
        <p><strong>✔️ Exclusive Rights Not Given:</strong> ${
          exclusiveRights ? "Yes" : "No"
        }</p>
        <p><strong>Signature:</strong></p>
        <img src="cid:signatureImage" alt="Signature" style="width: 200px; height: auto;"/>
      `,
      attachments: [
        {
          filename: "signature.png",
          path: signaturePath,
          cid: "signatureImage", // CID to reference in email
        },
      ],
    };

    // Email to Employee (if empRef is provided)
    let employeeMailOptions = null;
    if (employee) {
      employeeMailOptions = {
        from: "faizanamir103@gmail.com",
        to: employee.email,
        subject: "New Video Submission Notification",
        html: `
          <h3>New Video Submitted</h3>
          <p>The creator <strong>${firstName} ${lastName}</strong> has submitted a new video.</p>
          <p>Please review it in the system.</p>
        `,
      };
    }

    // Send Emails
    await transporter.sendMail(adminMailOptions);
    if (employeeMailOptions) {
      await transporter.sendMail(employeeMailOptions);
    }

    // Save Notification (even if there's no empRef)
    const newNotification = new Notification({
      creatorName: `${firstName} ${lastName}`,
      employeeName: employee ? employee.name : "Without Employee Link",
      message: `New video submission by ${firstName} ${lastName}`,
    });

    await newNotification.save();

    res.status(200).json({ message: "Submission successful, emails sent" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getRecentSubmissions = async (req, res) => {
  try {
    const recentSubmissions = await Submission.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .select("firstName lastName createdAt _id");

    const formatted = recentSubmissions.map((sub) => ({
      creatorName: `${sub.firstName} ${sub.lastName}`,
      createdAt: sub.createdAt,
      id: sub._id,
    }));

    res.status(200).json({ recentSubmissions: formatted });
  } catch (error) {
    console.error("Error fetching recent submissions:", error);
    res.status(500).json({ error: "Failed to fetch recent submissions" });
  }
};

const getTopEmployeeOverview = async (req, res) => {
  try {
    // Step 1: Aggregate to find top 3 empRef by video count
    const topEmpRefs = await Submission.aggregate([
      {
        $group: {
          _id: "$empRef",
          totalVideos: { $sum: 1 },
        },
      },
      { $sort: { totalVideos: -1 } },
      { $limit: 3 },
    ]);

    // Step 2: Get employee details using empRef (_id from aggregation)
    const detailedEmployees = await Promise.all(
      topEmpRefs.map(async (emp) => {
        const employee = await Employee.findById(emp._id);

        if (!employee) return null;

        return {
          empRef: emp._id,
          name: employee.name,
          email: employee.email,
          formLink: employee.formLink,
          totalVideos: emp.totalVideos,
        };
      })
    );

    // Step 3: Filter out any nulls (if some employee ref doesn’t exist)
    const filtered = detailedEmployees.filter((emp) => emp !== null);

    res.status(200).json(filtered);
  } catch (error) {
    console.error("Error in getTopThreeEmployeesOverview:", error);
    res.status(500).json({ message: "Internal server error" });
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

const getStats = async (req, res) => {
  try {
    const totalVideos = await Submission.countDocuments();
    const totalEmployees = await Employee.countDocuments();

    res.status(200).json({
      totalVideos,
      totalEmployees
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
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
      signature: submission.signature,
      createdAt: submission.createdAt,
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
// Get 5 Most Recent Submissions
// const getRecentSubmissions = async (req, res) => {
//   try {
//     // Fetch the most recent 3 submissions, sorted by createdAt field in descending order
//     const submissions = await Submission.find()
//       .sort({ createdAt: -1 })  // Sort by date: latest first
//       .limit(3)  // Limit the results to 3
//       .select('videoURL firstName lastName createdAt'); // Select only the necessary fields

//     // Map the result to a more readable format
//     const recentSubmissions = submissions.map((submission) => ({
//       videoURL: submission.videoURL,
//       creatorName: `${submission.firstName} ${submission.lastName}`,
//       submittedAt: submission.createdAt,
//     }));

//     // Return the formatted recent submissions
//     res.status(200).json(recentSubmissions);
//   } catch (error) {
//     console.error("Error fetching recent submissions:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// const getTopEmployeeBySubmissions = async (req, res) => {
//   try {
//     console.log("🔍 Starting aggregation to find top empRef...");

//     // Step 1: Group submissions by empRef and count
//     const result = await Submission.aggregate([
//       {
//         $group: {
//           _id: "$empRef",
//           count: { $sum: 1 }
//         }
//       },
//       { $sort: { count: -1 } },
//       { $limit: 1 }
//     ]);

//     console.log("✅ Aggregation result:", result);

//     if (result.length === 0) {
//       console.log("⚠️ No submissions found in database.");
//       return res.status(404).json({ message: "No submissions found" });
//     }

//     const topEmpRef = result[0]._id;
//     const objectId = mongoose.Types.ObjectId(topEmpRef);
//     const count = result[0].count;

//     console.log(`🔗 Top empRef: ${objectId}, Submission Count: ${count}`);
//     console.log("🔍 Fetching employee using empRef as _id...");

//     // Step 2: Find the employee by empRef (_id)
//     const employee = await Employee.findById(objectId);
//     console.log("✅ Employee fetched:", employee);

//     if (!employee) {
//       console.log("❌ Employee not found for empRef:", topEmpRef);
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     console.log("✅ Employee found:", employee);

//     // Step 3: Return the response
//     return res.status(200).json({
//       empRef: topEmpRef,
//       name: employee.name,
//       submissionCount: count
//     });

//   } catch (error) {
//     console.error("❌ Error fetching top employee:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

module.exports = {
  submitVideo,
  getAllSubmissions,
  getVideoById,
  deleteSubmission,
  getRecentSubmissions,
  getTopEmployeeOverview,
  getStats
};
