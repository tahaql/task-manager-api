const Task = require("../models/task");

// CREATE
exports.createTask = async (req, res) => {
  try {
    const { title } = req.body;
    const task = new Task({
      user: req.user.id,
      title,
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET USER TASKS
exports.getUserTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};