const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { createTask, getUserTasks } = require("../controllers/taskController");

router.post("/", auth, createTask);
router.get("/", auth, getUserTasks);

module.exports = router;