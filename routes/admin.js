const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");
const User = require("../models/user");

/**
 * @swagger
 * /api/admin/all:
 *   delete:
 *     summary: Delete all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All users deleted
 *       403:
 *         description: Forbidden
 */
router.delete("/all", authMiddleware, checkRole("admin"), async (req, res) => {
  await User.deleteMany({});
  res.json({ message: "All users deleted" });
});

/**
 * @swagger
 * /api/admin/users/count:
 *   get:
 *     summary: Get total number of users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total user count
 *       403:
 *         description: Forbidden
 */
router.get("/users/count", authMiddleware, checkRole("admin"), async (req, res) => {
  const count = await User.countDocuments();
  res.status(200).json({ count });
});

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Update a user's role (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: User role updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.patch("/users/:id/role", authMiddleware, checkRole("admin"), async (req, res) => {
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.status(200).json({ message: "User role updated", user });
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user by ID (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete("/users/:id", authMiddleware, checkRole("admin"), async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.status(200).json({ message: "User deleted successfully" });
});

module.exports = router;
