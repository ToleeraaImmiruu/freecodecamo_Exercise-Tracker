const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {});

// Define Mongoose Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

// Define Models
const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

// Routes

// ➤ Create a new user
app.post("/api/users", async (req, res) => {
  try {
    if (!req.body.username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const newUser = new User({ username: req.body.username });
    await newUser.save();

    res.json({
      username: newUser.username,
      _id: newUser._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating user" });
  }
});

// ➤ Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "_id username");
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching users" });
  }
});

// ➤ Add an exercise for a user
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { description, duration, date } = req.body;

    // Ensure duration is a valid number
    const parsedDuration = Number(duration);
    if (isNaN(parsedDuration)) {
      return res.status(400).json({ error: "Duration must be a number" });
    }

    const exercise = new Exercise({
      userId: user._id,
      description,
      duration: parsedDuration,
      date: date ? new Date(date) : new Date(),
    });

    await exercise.save();

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error adding exercise" });
  }
});

// ➤ Get exercise logs of a user
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    let query = { userId: user._id };

    if (req.query.from || req.query.to) {
      query.date = {};
      if (req.query.from) query.date.$gte = new Date(req.query.from);
      if (req.query.to) query.date.$lte = new Date(req.query.to);
    }

    let logs = await Exercise.find(query).select("description duration date");

    logs = logs.map(log => ({
      description: log.description,
      duration: Number(log.duration), // Ensure duration is a number
      date: log.date.toDateString(),
    }));

    if (req.query.limit) {
      logs = logs.slice(0, parseInt(req.query.limit));
    }

    res.json({
      username: user.username,
      count: logs.length,
      _id: user._id,
      log: logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching logs" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
