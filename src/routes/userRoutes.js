const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", userController.registerAdmin);
router.post("/login", userController.loginAdmin);
router.post("/create", userController.createEmployee);
router.get("/all", userController.getAllEmployees);
router.get("/:id", userController.getEmployeeById);
router.delete("/delete/:id", userController.deleteEmployee);
router.put("/edit/:id", userController.updateEmployee);

module.exports = router;

