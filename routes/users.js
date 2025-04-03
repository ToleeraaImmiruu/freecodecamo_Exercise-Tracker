const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Exercise = require('../models/Exercise');

// POST: Create a new user
router.post('/', async (req, res) => {
  try {
    const newUser = new User({ username: req.body.username });
    await newUser.save();
    res.json({ username: newUser.username, _id: newUser._id });
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

// GET: Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// POST: Add an exercise
router.post('/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { description, duration, date } = req.body;
    const exercise = new Exercise({
      userId: user._id,
      description,
      duration: parseInt(duration),
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
    res.status(500).json({ error: 'Error adding exercise' });
  }
});

// GET: Get exercise log of a user
router.get('/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let query = { userId: user._id };
    if (req.query.from || req.query.to) {
      query.date = {};
      if (req.query.from) query.date.$gte = new Date(req.query.from);
      if (req.query.to) query.date.$lte = new Date(req.query.to);
    }

    let logs = await Exercise.find(query).select('description duration date');
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
    res.status(500).json({ error: 'Error fetching logs' });
  }
});

module.exports = router;
