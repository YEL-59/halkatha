const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Ensure database is connected before handling any requests
let isConnected;

const connectDB = async () => {
  if (isConnected) return;

  if (!process.env.MONGO_URI) {
    console.error(
      "CRITICAL ERROR: MONGO_URI is missing from Environment Variables!",
    );
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    console.log(process.env.MONGO_URI);
    isConnected = db.connections[0].readyState;
    console.log("MongoDB Serverless Connection Established");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
  }
};

// Global middleware to await DB connection on every Vercel request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const dashRoutes = require("./routes/dashboard");

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/dashboard", dashRoutes);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
