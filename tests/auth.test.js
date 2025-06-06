
const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const User = require("../models/user");

describe("Auth API", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  test("Register user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "123456",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("User registered successfully ✅");
  });

  test("Login user", async () => {
    await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "123456",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "123456",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
  });
});

test("Admin can access all users route", async () => {
  // Register admin user
  await request(app).post("/api/auth/register").send({
    username: "adminuser",
    email: "admin@example.com",
    password: "123456",
    role: "admin"
  });

  // Manually set role to admin (in case default was "user")
  await User.findOneAndUpdate({ email: "admin@example.com" }, { role: "admin" });

  // Login admin user
  const loginRes = await request(app).post("/api/auth/login").send({
    email: "admin@example.com",
    password: "123456"
  });

  const token = loginRes.body.accessToken;

  // Access admin route
  const res = await request(app)
    .get("/api/admin/users")
    .set("Authorization", `Bearer ${token}`);

  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test("Normal user cannot access admin-only route", async () => {
  // Register normal user
  await request(app).post("/api/auth/register").send({
    username: "normaluser",
    email: "normal@example.com",
    password: "123456"
  });

  // Login normal user
  const loginRes = await request(app).post("/api/auth/login").send({
    email: "normal@example.com",
    password: "123456"
  });

  const token = loginRes.body.accessToken;

  // Attempt to access admin route
  const res = await request(app)
    .get("/api/admin/users")
    .set("Authorization", `Bearer ${token}`);

  expect(res.statusCode).toBe(403);
  expect(res.body.message).toBe("Forbidden: Insufficient role");
});

test("Admin can get total user count", async () => {
  const loginRes = await request(app).post("/api/auth/login").send({
    email: "admin@example.com",
    password: "123456"
  });
  const token = loginRes.body.accessToken;

  const res = await request(app)
    .get("/api/admin/users/count")
    .set("Authorization", `Bearer ${token}`);

  expect(res.statusCode).toBe(200);
  expect(typeof res.body.count).toBe("number");
});

test("Admin can change user role", async () => {
  const regRes = await request(app).post("/api/auth/register").send({
    username: "testuser",
    email: "testuser@example.com",
    password: "123456"
  });
  const userId = (await User.findOne({ email: "testuser@example.com" }))._id;

  const loginRes = await request(app).post("/api/auth/login").send({
    email: "admin@example.com",
    password: "123456"
  });
  const token = loginRes.body.accessToken;

  const res = await request(app)
    .patch(`/api/admin/users/${userId}/role`)
    .set("Authorization", `Bearer ${token}`)
    .send({ role: "admin" });

  expect(res.statusCode).toBe(200);
  expect(res.body.user.role).toBe("admin");
});

test("Admin can delete a specific user", async () => {
  await request(app).post("/api/auth/register").send({
    username: "deleteuser",
    email: "delete@example.com",
    password: "123456"
  });
  const user = await User.findOne({ email: "delete@example.com" });

  const loginRes = await request(app).post("/api/auth/login").send({
    email: "admin@example.com",
    password: "123456"
  });
  const token = loginRes.body.accessToken;

  const res = await request(app)
    .delete(`/api/admin/users/${user._id}`)
    .set("Authorization", `Bearer ${token}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.message).toBe("User deleted successfully");
});