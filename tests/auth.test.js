const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const User = require("../models/user");
const Session = require("../models/session");
const connectDB = require("../config/db");
require("dotenv").config();
describe("Auth API", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
  });

  test("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "123456",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe("test@example.com");
  });

  test("should not register with existing email", async () => {
    await request(app).post("/api/auth/register").send({
      username: "user1",
      email: "duplicate@example.com",
      password: "123456",
    });

    const res = await request(app).post("/api/auth/register").send({
      username: "user2",
      email: "duplicate@example.com",
      password: "abcdef",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/email.*already/i);
  });

  test("should login with correct credentials", async () => {
    await request(app).post("/api/auth/register").send({
      username: "loginuser",
      email: "login@example.com",
      password: "123456",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "123456",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
  });

  test("should not login with incorrect password", async () => {
    await request(app).post("/api/auth/register").send({
      username: "wrongpass",
      email: "wrongpass@example.com",
      password: "123456",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "wrongpass@example.com",
      password: "wrongpass",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  test("should create a session on login", async () => {
    await request(app).post("/api/auth/register").send({
      username: "sessionuser",
      email: "session@example.com",
      password: "123456",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "session@example.com",
      password: "123456",
    });

    const session = await Session.findOne({
      refreshToken: res.body.refreshToken,
    });
    expect(session).not.toBeNull();
    expect(session.isValid).toBe(true);
  });

  test("should refresh access token with valid refresh token", async () => {
    await request(app).post("/api/auth/register").send({
      username: "refreshuser",
      email: "refresh@example.com",
      password: "123456",
    });

    const login = await request(app).post("/api/auth/login").send({
      email: "refresh@example.com",
      password: "123456",
    });

    // کمی صبر برای ذخیره شدن سشن در دیتابیس
    await new Promise((r) => setTimeout(r, 100));

    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: login.body.refreshToken,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });

  test("should not refresh access token with invalid token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: "invalid.token.here",
    });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Invalid or expired refresh token");
  });

  test("should logout and invalidate session", async () => {
    await request(app).post("/api/auth/register").send({
      username: "logoutuser",
      email: "logout@example.com",
      password: "123456",
    });

    const login = await request(app).post("/api/auth/login").send({
      email: "logout@example.com",
      password: "123456",
    });

    const res = await request(app).post("/api/auth/logout").send({
      refreshToken: login.body.refreshToken,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged out successfully");

    const session = await Session.findOne({
      refreshToken: login.body.refreshToken,
    });
    expect(session.isValid).toBe(false);
  });
});
