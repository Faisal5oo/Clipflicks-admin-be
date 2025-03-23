const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")[0];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  // try {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //   req.admin = decoded;
  //   next();
  // } catch (error) {
  //   console.log("verification of token",error)
  //   res.status(401).json({ error: "Invalid Token" });
  // }
};

module.exports = authMiddleware;
