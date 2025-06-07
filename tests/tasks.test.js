const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const Task = require("../models/task");
const User = require("../models/user");
const connectDB = require("../config/db");

describe("Tasks API", () => {
  let token;
  let userId;
  let otherUserToken;

  beforeAll(async () => {
    await connectDB();

    // ثبت‌نام کاربر اصلی
    await request(app).post("/api/auth/register").send({
      username: "taskuser",
      email: "taskuser@example.com",
      password: "123456",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "taskuser@example.com",
      password: "123456",
    });

    token = res.body.accessToken;
    const user = await User.findOne({ email: "taskuser@example.com" });
    userId = user._id.toString();

    // ثبت‌نام کاربر دیگر
    await request(app).post("/api/auth/register").send({
      username: "otheruser",
      email: "other@example.com",
      password: "123456",
    });

    const res2 = await request(app).post("/api/auth/login").send({
      email: "other@example.com",
      password: "123456",
    });

    otherUserToken = res2.body.accessToken;
  });

  afterEach(async () => {
    await Task.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("should create a task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test Task" });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Test Task");
    expect(res.body.user).toBe(userId);
  });

  test("should get user tasks", async () => {
    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "User Task" });

    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test("should update user task", async () => {
    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Old Task" });

    const res = await request(app)
      .put(`/api/tasks/${createRes.body._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Task" });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("Updated Task");
  });

  test("should delete user task", async () => {
    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Task to Delete" });

    const res = await request(app)
      .delete(`/api/tasks/${createRes.body._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test("should not access task without token", async () => {
    const res = await request(app).get("/api/tasks");

    expect(res.statusCode).toBe(401);
  });

  test("should not update other user's task", async () => {
    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Owner Task" });

    const res = await request(app)
      .put(`/api/tasks/${createRes.body._id}`)
      .set("Authorization", `Bearer ${otherUserToken}`)
      .send({ title: "Hacked" });

    expect(res.statusCode).toBe(403);
  });

  test("should not delete other user's task", async () => {
    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Owner Task" });

    const res = await request(app)
      .delete(`/api/tasks/${createRes.body._id}`)
      .set("Authorization", `Bearer ${otherUserToken}`);

    expect(res.statusCode).toBe(403);
  });
});
