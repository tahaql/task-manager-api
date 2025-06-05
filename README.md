# 📝 Task Manager API

A simple RESTful API for managing tasks, built with Node.js, Express, and MongoDB.

## 🚀 Features
- Create, read, update, and delete tasks (CRUD)
- Mark tasks as complete/incomplete
- Timestamp for creation and updates
- RESTful API design

## 🛠 Tech Stack
- Node.js
- Express.js
- MongoDB & Mongoose

## 🔐 Authentication

- User registration and login with JWT authentication
- Secure routes using JWT middleware
- Refresh token mechanism for token renewal
- Logout endpoint to invalidate refresh tokens

## 📚 API Documentation

- API documented using Swagger (OpenAPI 3.0)
- Access documentation at `/api-docs` endpoint after running the server

## 🧪 Testing

- Tested with Postman collection including authentication and task management routes
- Supports access and refresh token usage in requests

## 📦 Additional Dependencies

- bcrypt for password hashing
- jsonwebtoken for JWT handling
- express-validator for input validation
- swagger-jsdoc and swagger-ui-express for API documentation
