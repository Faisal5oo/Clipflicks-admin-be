const { Admin, Employee } = require("../models/Submission");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.registerAdmin = async (req, res) => {
    try {
      const { email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = new Admin({ email, password: hashedPassword });
      await admin.save();
      res.status(201).json({ message: "Admin registered" });
    } catch (error) {
      console.log("error",error)
      res.status(500).json({ error: "Error registering admin" });
    }
  };


  exports.loginAdmin = async (req, res) => {
    try {
      const { email, password } = req.body;
      const admin = await Admin.findOne({ email });
      if (!admin) return res.status(401).json({ error: "Invalid credentials" });
  
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
  
      const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.json({ token });
    } catch (error) {
      console.log("login error",error)
      res.status(500).json({ error: "Error logging in" });
    }
  };

  exports.createEmployee = async (req, res) => {
    try {
      const { name, email } = req.body;
      const employee = new Employee({ name, email });
      await employee.save();
  
      const formLink = `http://localhost:3000/submit-video/${employee._id}`;

      employee.formLink = formLink;
      await employee.save();
  
      res.status(201).json({ message: "Employee created successfully", formLink });
    } catch (error) {
      console.log("Error creating employee:", error);
      res.status(500).json({ error: "Error creating employee" });
    }
  };

  exports.getAllEmployees = async (req, res) => {
    try {
      const employees = await Employee.find();
      res.status(200).json(employees);
    } catch (error) {
      console.log("Error fetching employees:", error);
      res.status(500).json({ error: "Error fetching employees" });
    }
  };
  
  // ✅ Get Single Employee by ID
  exports.getEmployeeById = async (req, res) => {
    try {
      const employee = await Employee.findById(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.status(200).json(employee);
    } catch (error) {
      console.log("Error fetching employee:", error);
      res.status(500).json({ error: "Error fetching employee" });
    }
  };
  
  // ✅ Update Employee
  exports.updateEmployee = async (req, res) => {
    try {
      const { name, email } = req.body;
      const employee = await Employee.findByIdAndUpdate(
        req.params.id,
        { name, email },
        { new: true, runValidators: true }
      );
  
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
  
      res.status(200).json({ message: "Employee updated successfully", employee });
    } catch (error) {
      console.log("Error updating employee:", error);
      res.status(500).json({ error: "Error updating employee" });
    }
  };
  
  // ✅ Delete Employee
  exports.deleteEmployee = async (req, res) => {
    try {
      const employee = await Employee.findByIdAndDelete(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.status(200).json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.log("Error deleting employee:", error);
      res.status(500).json({ error: "Error deleting employee" });
    }
  };
  