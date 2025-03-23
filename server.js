const PORT = process.env.PORT || 5000;
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const submissionRoutes = require("./src/routes/submissionRoutes");
const userRoutes = require("./src/routes/userRoutes");
const app = express();

dotenv.config();

app.use(express.json()); // Add this to parse JSON bodies
app.use(express.urlencoded({ extended: true })); 
app.use(cors({ origin: "*" }));

app.use("/api/", submissionRoutes);
app.use("/api/users", userRoutes);



connectDB();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));