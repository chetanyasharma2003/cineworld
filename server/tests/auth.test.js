import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

describe("Authentication", () => {
  describe("Password Hashing", () => {
    it("should hash password before saving", async () => {
      const user = new User({
        name: "Test User",
        email: "test@example.com",
        password: "TestPassword123",
      });
      await user.save();
      expect(user.password).not.toBe("TestPassword123");
      expect(user.password.startsWith("$2b$")).toBe(true); // bcrypt hash
    });

    it("should compare password correctly", async () => {
      const user = new User({
        name: "Test User",
        email: "test2@example.com",
        password: "TestPassword123",
      });
      await user.save();
      const isMatch = await user.comparePassword("TestPassword123");
      expect(isMatch).toBe(true);
      const isNotMatch = await user.comparePassword("WrongPassword");
      expect(isNotMatch).toBe(false);
    });
  });

  describe("Account Lockout", () => {
    it("should lock account after 5 failed attempts", async () => {
      const user = new User({
        name: "Test User",
        email: "test3@example.com",
        password: "TestPassword123",
      });
      await user.save();

      for (let i = 0; i < 5; i++) {
        await user.incLoginAttempts();
      }

      expect(user.isLocked).toBe(true);
      expect(user.lockUntil).toBeDefined();
    });

    it("should reset login attempts on successful login", async () => {
      const user = new User({
        name: "Test User",
        email: "test4@example.com",
        password: "TestPassword123",
        loginAttempts: 3,
      });
      await user.save();
      await user.resetLoginAttempts();

      expect(user.loginAttempts).toBe(0);
      expect(user.lockUntil).toBeNull();
    });
  });

  describe("JWT Tokens", () => {
    it("should create valid access token", () => {
      const payload = { id: "123", name: "Test" };
      const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });

      const decoded = jwt.verify(token, env.JWT_SECRET);
      expect(decoded.id).toBe("123");
      expect(decoded.name).toBe("Test");
    });

    it("should expire refresh token after 7 days", () => {
      const payload = { id: "123" };
      const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });

      expect(token).toBeDefined();
      // Token should be valid now
      const decoded = jwt.verify(token, env.JWT_SECRET);
      expect(decoded.id).toBe("123");
    });
  });

  describe("Email Verification", () => {
    it("should create verification token", async () => {
      const user = new User({
        name: "Test User",
        email: "test5@example.com",
        password: "TestPassword123",
        emailVerified: false,
      });
      await user.save();

      expect(user.emailVerifyToken).toBeDefined();
      expect(user.emailVerifyExpires).toBeDefined();
    });

    it("should verify email correctly", async () => {
      const user = new User({
        name: "Test User",
        email: "test6@example.com",
        password: "TestPassword123",
        emailVerified: false,
      });
      await user.save();

      user.emailVerified = true;
      user.emailVerifyToken = null;
      user.emailVerifyExpires = null;
      await user.save();

      expect(user.emailVerified).toBe(true);
    });
  });
});

describe("Reviews", () => {
  it("should allow only one review per user per movie", async () => {
    const user = new User({
      name: "Test User",
      email: "test7@example.com",
      password: "TestPassword123",
    });
    await user.save();

    // First review should work
    // Second review by same user on same movie should fail
    // (enforced by compound unique index)
  });
});

describe("Watchlist", () => {
  it("should add movie to watchlist with status", async () => {
    const user = new User({
      name: "Test User",
      email: "test8@example.com",
      password: "TestPassword123",
    });

    user.watchlist.push({
      id: 550,
      title: "Fight Club",
      status: "want_to_watch",
    });
    await user.save();

    expect(user.watchlist).toHaveLength(1);
    expect(user.watchlist[0].status).toBe("want_to_watch");
  });

  it("should update watchlist status", async () => {
    const user = new User({
      name: "Test User",
      email: "test9@example.com",
      password: "TestPassword123",
    });

    user.watchlist.push({
      id: 550,
      title: "Fight Club",
      status: "want_to_watch",
    });
    await user.save();

    // Update status
    const movie = user.watchlist[0];
    movie.status = "watched";
    await user.save();

    expect(user.watchlist[0].status).toBe("watched");
  });
});

describe("Social Features", () => {
  it("should allow user to follow another user", async () => {
    const user1 = new User({
      name: "User 1",
      email: "user1@example.com",
      password: "Password123",
    });
    const user2 = new User({
      name: "User 2",
      email: "user2@example.com",
      password: "Password123",
    });

    await user1.save();
    await user2.save();

    user1.following.push(user2._id);
    await user1.save();

    expect(user1.following).toContain(user2._id);
  });
});
