const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/task");
// ENV config
dotenv.config();

// App config
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// DB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Base route
app.get("/", (req, res) => {
  res.send("Task Manager API is running...");
});

// Use api
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

