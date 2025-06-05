const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const Task = require("../models/task");
const User = require("../models/user");

describe("Tasks API", () => {
  let token;
  let userId;
  let taskId;

  beforeAll(async () => {
    await mongoose.connect(
      process.env.MONGO_URI_TEST || process.env.MONGO_URI,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    // ثبت‌نام و لاگین کاربر و گرفتن توکن
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
    userId = res.body.user.id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Task.deleteMany({});
  });

  test("Create task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test Task" });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Test Task");
    expect(res.body.user).toBe(userId);
    taskId = res.body._id;
  });

  test("Get tasks", async () => {
    // ابتدا یک تسک ایجاد کن
    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test Task" });

    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test("Update task", async () => {
    // ابتدا یک تسک ایجاد کن
    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Initial Task" });

    taskId = createRes.body._id;

    // ویرایش تسک
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Task", completed: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("Updated Task");
    expect(res.body.completed).toBe(true);
  });

  test("Delete task", async () => {
    // ابتدا یک تسک ایجاد کن
    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Task to Delete" });

    taskId = createRes.body._id;

    // حذف تسک
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Task deleted successfully");
  });
});
