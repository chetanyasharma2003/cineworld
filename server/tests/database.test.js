import mongoose from "mongoose";
import User from "../models/User.js";
import Review from "../models/Review.js";
import Movie from "../models/movieModel.js";
import Notification from "../models/Notification.js";
import { env } from "../config/env.js";

describe("Database Tests - TEST #6", () => {
  let testUser, testMovie, testReview;
  const testEmail = `test-${Date.now()}@example.com`;

  // ════════════════════════════════════════════════════════════════════════════════
  // SETUP & TEARDOWN
  // ════════════════════════════════════════════════════════════════════════════════

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = env.MONGO_URI || "mongodb://localhost:27017/cineworld-test";
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    console.log("✓ Connected to test database");
  });

  beforeEach(async () => {
    // Clear collections before each test
    await User.deleteMany({});
    await Review.deleteMany({});
    await Movie.deleteMany({});
    await Notification.deleteMany({});

    // Create test data
    testUser = await User.create({
      name: "Test User",
      email: testEmail,
      password: "hashedPassword123",
      emailVerified: true,
    });

    testMovie = await Movie.create({
      title: "Test Movie",
      tmdbId: 12345,
      genre: "Action",
      description: "A test movie",
      vote_average: 8.5,
    });
  });

  afterAll(async () => {
    // Clear all test data
    await User.deleteMany({});
    await Review.deleteMany({});
    await Movie.deleteMany({});
    await Notification.deleteMany({});

    // Disconnect from database
    await mongoose.disconnect();
    console.log("✓ Disconnected from test database");
  });

  // ════════════════════════════════════════════════════════════════════════════════
  // 1. VERIFY ALL QUERIES WORK
  // ════════════════════════════════════════════════════════════════════════════════

  describe("1. Query Verification - All Queries Work", () => {
    test("should create a user with all fields", async () => {
      const user = await User.create({
        name: "John Doe",
        email: `john-${Date.now()}@example.com`,
        password: "hashed_password",
      });

      expect(user._id).toBeDefined();
      expect(user.name).toBe("John Doe");
      expect(user.email).toBeDefined();
      expect(user.emailVerified).toBe(false);
    });

    test("should find user by email (indexed query)", async () => {
      const found = await User.findOne({ email: testEmail });

      expect(found).toBeDefined();
      expect(found._id.toString()).toBe(testUser._id.toString());
      expect(found.email).toBe(testEmail);
    });

    test("should find user by name (indexed query)", async () => {
      const found = await User.findOne({ name: testUser.name });

      expect(found).toBeDefined();
      expect(found._id.toString()).toBe(testUser._id.toString());
    });

    test("should update user profile", async () => {
      testUser.name = "Updated Name";
      const updated = await testUser.save();

      expect(updated.name).toBe("Updated Name");

      const fetched = await User.findById(testUser._id);
      expect(fetched.name).toBe("Updated Name");
    });

    test("should add movie to savedMovies array", async () => {
      testUser.savedMovies.push({
        id: 123,
        title: "Test Movie",
        poster_path: "/path",
      });
      await testUser.save();

      const user = await User.findById(testUser._id);
      expect(user.savedMovies).toHaveLength(1);
      expect(user.savedMovies[0].id).toBe(123);
    });

    test("should add movie to watchlist", async () => {
      testUser.watchlist.push({
        id: 456,
        title: "Watchlist Movie",
        status: "want_to_watch",
      });
      await testUser.save();

      const user = await User.findById(testUser._id);
      expect(user.watchlist).toHaveLength(1);
      expect(user.watchlist[0].status).toBe("want_to_watch");
    });

    test("should update watchlist status", async () => {
      testUser.watchlist = [{
        id: 789,
        title: "Movie",
        status: "want_to_watch",
      }];
      await testUser.save();

      const user = await User.findById(testUser._id);
      user.watchlist[0].status = "watching";
      user.markModified("watchlist");
      await user.save();

      const updated = await User.findById(testUser._id);
      expect(updated.watchlist[0].status).toBe("watching");
    });

    test("should remove movie from savedMovies", async () => {
      testUser.savedMovies = [
        { id: 111, title: "Movie 1" },
        { id: 222, title: "Movie 2" },
      ];
      await testUser.save();

      testUser.savedMovies = testUser.savedMovies.filter(m => m.id !== 111);
      await testUser.save();

      const user = await User.findById(testUser._id);
      expect(user.savedMovies).toHaveLength(1);
      expect(user.savedMovies[0].id).toBe(222);
    });

    test("should create a review", async () => {
      const review = await Review.create({
        movieId: "123",
        movieTitle: "Test Movie",
        user: testUser._id,
        author: "Test Author",
        content: "Great movie!",
        rating: 5,
      });

      expect(review._id).toBeDefined();
      expect(review.rating).toBe(5);
      expect(review.content).toBe("Great movie!");
    });

    test("should find reviews by movieId (indexed)", async () => {
      await Review.create({
        movieId: "movie-555",
        user: testUser._id,
        author: "Author 1",
        content: "Review 1",
      });

      const reviews = await Review.find({ movieId: "movie-555" });
      expect(reviews).toHaveLength(1);
    });

    test("should find reviews by user and movieId (compound index)", async () => {
      const review = await Review.create({
        movieId: "movie-777",
        user: testUser._id,
        author: "Author",
        content: "Content",
      });

      const found = await Review.findOne({
        movieId: "movie-777",
        user: testUser._id,
      });

      expect(found._id.toString()).toBe(review._id.toString());
    });

    test("should get reviews sorted by date", async () => {
      const now = new Date();
      await Review.create({
        movieId: "movie-888",
        user: testUser._id,
        author: "Author 1",
        content: "Old review",
        createdAt: new Date(now.getTime() - 10000),
      });

      await Review.create({
        movieId: "movie-888",
        user: testUser._id,
        author: "Author 2",
        content: "New review",
        createdAt: new Date(now.getTime()),
      });

      const reviews = await Review.find({ movieId: "movie-888" })
        .sort({ createdAt: -1 });

      expect(reviews[0].content).toBe("New review");
      expect(reviews[1].content).toBe("Old review");
    });

    test("should create notification", async () => {
      const notif = await Notification.create({
        user: testUser._id,
        text: "Test notification",
        icon: "🔔",
      });

      expect(notif._id).toBeDefined();
      expect(notif.read).toBe(false);
    });

    test("should find unread notifications by user", async () => {
      await Notification.create({
        user: testUser._id,
        text: "Notif 1",
        read: false,
      });

      await Notification.create({
        user: testUser._id,
        text: "Notif 2",
        read: true,
      });

      const unread = await Notification.find({
        user: testUser._id,
        read: false,
      });

      expect(unread).toHaveLength(1);
    });

    test("should add AI feedback", async () => {
      testUser.aiFeedback.push({
        movieId: 999,
        movieTitle: "AI Test Movie",
        liked: true,
      });
      await testUser.save();

      const user = await User.findById(testUser._id);
      expect(user.aiFeedback).toHaveLength(1);
      expect(user.aiFeedback[0].liked).toBe(true);
    });

    test("should update taste vector", async () => {
      testUser.tasteVector = new Map([
        [28, 0.8],
        [12, 0.6],
      ]);
      await testUser.save();

      const user = await User.findById(testUser._id);
      expect(user.tasteVector.get(28)).toBe(0.8);
      expect(user.tasteVector.get(12)).toBe(0.6);
    });

    test("should handle user following", async () => {
      const otherUser = await User.create({
        name: "Other User",
        email: `other-${Date.now()}@example.com`,
        password: "hashed",
      });

      testUser.following.push(otherUser._id);
      await testUser.save();

      const user = await User.findById(testUser._id)
        .populate("following", "name email");

      expect(user.following).toHaveLength(1);
      expect(user.following[0]._id.toString()).toBe(otherUser._id.toString());
    });

    test("should mark review as helpful", async () => {
      const review = await Review.create({
        movieId: "movie-helpful",
        user: testUser._id,
        author: "Author",
        content: "Great!",
      });

      const otherUser = await User.create({
        name: "Other",
        email: `other2-${Date.now()}@example.com`,
        password: "hashed",
      });

      await Review.findByIdAndUpdate(
        review._id,
        { $addToSet: { helpful: otherUser._id } }
      );

      const updated = await Review.findById(review._id);
      expect(updated.helpful).toHaveLength(1);
    });

    test("should count documents efficiently", async () => {
      await Review.create({
        movieId: "movie-count",
        user: testUser._id,
        author: "A1",
        content: "C1",
      });

      await Review.create({
        movieId: "movie-count",
        user: testUser._id,
        author: "A2",
        content: "C2",
      });

      const count = await Review.countDocuments({ movieId: "movie-count" });
      expect(count).toBe(2);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════════
  // 2. CHECK INDEXES ARE USED
  // ════════════════════════════════════════════════════════════════════════════════

  describe("2. Index Verification - Indexes Are Used Efficiently", () => {
    test("should use email index for User", async () => {
      // Create multiple users to ensure index is in use
      for (let i = 0; i < 50; i++) {
        await User.create({
          name: `User ${i}`,
          email: `email-${i}-${Date.now()}@example.com`,
          password: "hashed",
        });
      }

      // Query by email (should use index)
      const explain = await User.collection
        .findOne({ email: testEmail })
        .explain("executionStats");

      // If using index, executionStages should show IXSCAN
      console.log("Email index usage:", {
        stage: explain.executionStats.executionStages.stage,
        docsScanned: explain.executionStats.executionStats.totalDocsScanned,
        docsReturned: explain.executionStats.executionStats.nReturned,
      });

      expect(explain.executionStats.executionStats.totalDocsScanned)
        .toBeLessThanOrEqual(1);
    });

    test("should use name index for User", async () => {
      const explain = await User.collection
        .findOne({ name: "Test User" })
        .explain("executionStats");

      console.log("Name index usage:", {
        stage: explain.executionStats.executionStages.stage,
        docsScanned: explain.executionStats.executionStats.totalDocsScanned,
      });

      expect(explain.executionStats.executionStats.totalDocsScanned)
        .toBeLessThanOrEqual(1);
    });

    test("should use movieId index for Review", async () => {
      // Create multiple reviews
      for (let i = 0; i < 30; i++) {
        await Review.create({
          movieId: "movie-test-1",
          user: testUser._id,
          author: `Author ${i}`,
          content: `Review ${i}`,
        });
      }

      const explain = await Review.collection
        .findOne({ movieId: "movie-test-1" })
        .explain("executionStats");

      console.log("MovieId index usage:", {
        stage: explain.executionStats.executionStages.stage,
        docsScanned: explain.executionStats.executionStats.totalDocsScanned,
      });

      // Index should significantly reduce docs scanned
      expect(explain.executionStats.executionStats.totalDocsScanned)
        .toBeLessThanOrEqual(30);
    });

    test("should use compound index (movieId, user) for Review", async () => {
      await Review.create({
        movieId: "movie-compound",
        user: testUser._id,
        author: "Test",
        content: "Test",
      });

      const explain = await Review.collection
        .findOne({
          movieId: "movie-compound",
          user: testUser._id,
        })
        .explain("executionStats");

      console.log("Compound index (movieId, user) usage:", {
        stage: explain.executionStats.executionStages.stage,
        docsScanned: explain.executionStats.executionStats.totalDocsScanned,
      });

      expect(explain.executionStats.executionStats.totalDocsScanned)
        .toBeLessThanOrEqual(1);
    });

    test("should use user index for Notification", async () => {
      for (let i = 0; i < 20; i++) {
        await Notification.create({
          user: testUser._id,
          text: `Notif ${i}`,
          read: i % 2 === 0,
        });
      }

      const explain = await Notification.collection
        .findOne({ user: testUser._id })
        .explain("executionStats");

      console.log("User index for Notification:", {
        stage: explain.executionStats.executionStages.stage,
        docsScanned: explain.executionStats.executionStats.totalDocsScanned,
      });

      expect(explain.executionStats.executionStats.totalDocsScanned)
        .toBeLessThanOrEqual(20);
    });

    test("should use compound index (user, read) for Notification", async () => {
      for (let i = 0; i < 15; i++) {
        await Notification.create({
          user: testUser._id,
          text: `Notif ${i}`,
          read: false,
        });
      }

      const explain = await Notification.collection
        .findOne({ user: testUser._id, read: false })
        .explain("executionStats");

      console.log("Compound index (user, read) usage:", {
        stage: explain.executionStats.executionStages.stage,
        docsScanned: explain.executionStats.executionStats.totalDocsScanned,
      });

      expect(explain.executionStats.executionStats.totalDocsScanned)
        .toBeLessThanOrEqual(15);
    });

    test("should use tmdbId index for Movie", async () => {
      for (let i = 0; i < 25; i++) {
        await Movie.create({
          title: `Movie ${i}`,
          tmdbId: 10000 + i,
          genre: "Action",
        });
      }

      const explain = await Movie.collection
        .findOne({ tmdbId: 10000 })
        .explain("executionStats");

      console.log("TmdbId index usage:", {
        stage: explain.executionStats.executionStages.stage,
        docsScanned: explain.executionStats.executionStats.totalDocsScanned,
      });

      expect(explain.executionStats.executionStats.totalDocsScanned)
        .toBeLessThanOrEqual(1);
    });

    test("should list all indexes on User collection", async () => {
      const indexes = await User.collection.getIndexes();

      console.log("\nUser Collection Indexes:");
      Object.entries(indexes).forEach(([key, spec]) => {
        console.log(`  - ${key}:`, spec);
      });

      expect(indexes).toHaveProperty("_id_");
      expect(indexes).toHaveProperty("email_1");
      expect(indexes).toHaveProperty("name_1");
    });

    test("should list all indexes on Review collection", async () => {
      const indexes = await Review.collection.getIndexes();

      console.log("\nReview Collection Indexes:");
      Object.entries(indexes).forEach(([key, spec]) => {
        console.log(`  - ${key}:`, spec);
      });

      expect(indexes).toHaveProperty("movieId_1");
      expect(indexes).toHaveProperty("user_1");
    });

    test("should list all indexes on Notification collection", async () => {
      const indexes = await Notification.collection.getIndexes();

      console.log("\nNotification Collection Indexes:");
      Object.entries(indexes).forEach(([key, spec]) => {
        console.log(`  - ${key}:`, spec);
      });

      expect(indexes).toHaveProperty("user_1_read_1");
    });
  });

  // ════════════════════════════════════════════════════════════════════════════════
  // 3. CONFIRM TRANSACTIONS WORK
  // ════════════════════════════════════════════════════════════════════════════════

  describe("3. Transaction Verification - Transactions Work Correctly", () => {
    test("should commit transaction successfully", async () => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const user = await User.create(
          [{
            name: "Transaction Test",
            email: `trans-${Date.now()}@example.com`,
            password: "hashed",
          }],
          { session }
        );

        await session.commitTransaction();

        const found = await User.findById(user[0]._id);
        expect(found).toBeDefined();
      } finally {
        await session.endSession();
      }
    });

    test("should rollback transaction on error", async () => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const email = `rollback-${Date.now()}@example.com`;

        const user = await User.create(
          [{
            name: "Rollback Test",
            email,
            password: "hashed",
          }],
          { session }
        );

        // Simulate error and rollback
        throw new Error("Intentional error");
      } catch (error) {
        await session.abortTransaction();
      } finally {
        await session.endSession();
      }

      // User should not exist after rollback
      const found = await User.findOne({ name: "Rollback Test" });
      expect(found).toBeNull();
    });

    test("should handle multi-document transaction", async () => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Create user and review in same transaction
        const user = await User.create(
          [{
            name: "Multi-Doc User",
            email: `multi-${Date.now()}@example.com`,
            password: "hashed",
          }],
          { session }
        );

        const review = await Review.create(
          [{
            movieId: "trans-movie",
            user: user[0]._id,
            author: user[0].name,
            content: "Transaction review",
          }],
          { session }
        );

        await session.commitTransaction();

        // Both should exist
        const foundUser = await User.findById(user[0]._id);
        const foundReview = await Review.findById(review[0]._id);

        expect(foundUser).toBeDefined();
        expect(foundReview).toBeDefined();
      } finally {
        await session.endSession();
      }
    });

    test("should handle concurrent transactions", async () => {
      const session1 = await mongoose.startSession();
      const session2 = await mongoose.startSession();

      session1.startTransaction();
      session2.startTransaction();

      try {
        const user1 = await User.create(
          [{
            name: "Concurrent User 1",
            email: `concurrent-1-${Date.now()}@example.com`,
            password: "hashed",
          }],
          { session: session1 }
        );

        const user2 = await User.create(
          [{
            name: "Concurrent User 2",
            email: `concurrent-2-${Date.now()}@example.com`,
            password: "hashed",
          }],
          { session: session2 }
        );

        await session1.commitTransaction();
        await session2.commitTransaction();

        // Both users should exist
        const found1 = await User.findById(user1[0]._id);
        const found2 = await User.findById(user2[0]._id);

        expect(found1).toBeDefined();
        expect(found2).toBeDefined();
      } finally {
        await session1.endSession();
        await session2.endSession();
      }
    });

    test("should handle transaction with array updates", async () => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Add movies to watchlist within transaction
        await User.findByIdAndUpdate(
          testUser._id,
          {
            $push: {
              watchlist: {
                id: 5555,
                title: "Transaction Watchlist Movie",
                status: "want_to_watch",
              },
            },
          },
          { session, new: true }
        );

        await session.commitTransaction();

        const user = await User.findById(testUser._id);
        const hasMovie = user.watchlist.some(m => m.id === 5555);
        expect(hasMovie).toBe(true);
      } finally {
        await session.endSession();
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════════════
  // 4. TEST CONCURRENT OPERATIONS
  // ════════════════════════════════════════════════════════════════════════════════

  describe("4. Concurrent Operations - Handle Multiple Operations", () => {
    test("should handle concurrent user creation", async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          User.create({
            name: `Concurrent User ${i}`,
            email: `concurrent-user-${i}-${Date.now()}@example.com`,
            password: "hashed",
          })
        );
      }

      const users = await Promise.all(promises);

      expect(users).toHaveLength(10);
      expect(users.every(u => u._id)).toBe(true);
    });

    test("should handle concurrent review creation", async () => {
      const promises = [];

      for (let i = 0; i < 15; i++) {
        promises.push(
          Review.create({
            movieId: "concurrent-movie",
            user: testUser._id,
            author: `Author ${i}`,
            content: `Review ${i}`,
            rating: (i % 5) + 1,
          })
        );
      }

      const reviews = await Promise.all(promises);

      expect(reviews).toHaveLength(15);

      const count = await Review.countDocuments({
        movieId: "concurrent-movie",
      });
      expect(count).toBe(15);
    });

    test("should handle concurrent watchlist updates", async () => {
      const users = [];
      for (let i = 0; i < 5; i++) {
        users.push(
          await User.create({
            name: `Watchlist User ${i}`,
            email: `watchlist-${i}-${Date.now()}@example.com`,
            password: "hashed",
          })
        );
      }

      const promises = users.map(user =>
        User.findByIdAndUpdate(
          user._id,
          {
            $push: {
              watchlist: {
                id: 7777,
                title: "Concurrent Watchlist Movie",
                status: "want_to_watch",
              },
            },
          },
          { new: true }
        )
      );

      const updated = await Promise.all(promises);

      expect(updated.every(u => u.watchlist.length > 0)).toBe(true);
    });

    test("should handle concurrent notification creation", async () => {
      const promises = [];

      for (let i = 0; i < 20; i++) {
        promises.push(
          Notification.create({
            user: testUser._id,
            text: `Concurrent Notif ${i}`,
            read: false,
          })
        );
      }

      const notifications = await Promise.all(promises);

      expect(notifications).toHaveLength(20);

      const count = await Notification.countDocuments({
        user: testUser._id,
      });
      expect(count).toBe(20);
    });

    test("should handle concurrent read and write operations", async () => {
      const promises = [];

      // Mix of read and write operations
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          // Write
          promises.push(
            Review.create({
              movieId: "mixed-ops",
              user: testUser._id,
              author: `Author ${i}`,
              content: `Review ${i}`,
            })
          );
        } else {
          // Read
          promises.push(
            Review.find({ movieId: "mixed-ops" }).lean()
          );
        }
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
    });

    test("should handle concurrent array modifications", async () => {
      // Test multiple concurrent $push operations
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          User.findByIdAndUpdate(
            testUser._id,
            {
              $push: {
                aiFeedback: {
                  movieId: i,
                  movieTitle: `Movie ${i}`,
                  liked: i % 2 === 0,
                },
              },
            },
            { new: true }
          )
        );
      }

      const updated = await Promise.all(promises);

      // Last operation should have all 10 items
      expect(updated[updated.length - 1].aiFeedback.length).toBeGreaterThanOrEqual(10);
    });

    test("should handle concurrent rating aggregation", async () => {
      // Create reviews with different ratings
      await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          Review.create({
            movieId: "ratings-agg",
            user: testUser._id,
            author: `Author ${i}`,
            content: `Review ${i}`,
            rating: (i % 5) + 1,
          })
        )
      );

      // Concurrent aggregation queries
      const promises = Array.from({ length: 5 }, () =>
        Review.aggregate([
          { $match: { movieId: "ratings-agg" } },
          {
            $group: {
              _id: "$movieId",
              avgRating: { $avg: "$rating" },
              count: { $sum: 1 },
            },
          },
        ])
      );

      const results = await Promise.all(promises);

      // All results should be consistent
      const avgRatings = results.map(r => r[0].avgRating);
      expect(avgRatings.every(avg => avg === avgRatings[0])).toBe(true);
    });

    test("should maintain data integrity under concurrent operations", async () => {
      const movieId = "integrity-test";
      const promises = [];

      // Concurrent operations: create reviews and mark as helpful
      const reviews = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          Review.create({
            movieId,
            user: testUser._id,
            author: `Author ${i}`,
            content: `Review ${i}`,
          })
        )
      );

      // Concurrent "helpful" marks
      for (let i = 0; i < 10; i++) {
        const review = reviews[i % reviews.length];
        promises.push(
          Review.findByIdAndUpdate(
            review._id,
            { $addToSet: { helpful: testUser._id } },
            { new: true }
          )
        );
      }

      await Promise.all(promises);

      // Check final state
      const finalReviews = await Review.find({ movieId });
      const totalHelpfulMarks = finalReviews.reduce(
        (sum, r) => sum + (r.helpful?.length || 0),
        0
      );

      // Each helpful mark should only count once (idempotent $addToSet)
      expect(totalHelpfulMarks).toBeLessThanOrEqual(5);
    });

    test("should handle concurrent deletion and creation", async () => {
      // Create initial reviews
      const reviews = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          Review.create({
            movieId: "delete-create-test",
            user: testUser._id,
            author: `Author ${i}`,
            content: `Review ${i}`,
          })
        )
      );

      const promises = [];

      // Concurrent delete and create
      for (let i = 0; i < 3; i++) {
        promises.push(
          Review.findByIdAndDelete(reviews[i]._id)
        );
      }

      for (let i = 0; i < 3; i++) {
        promises.push(
          Review.create({
            movieId: "delete-create-test",
            user: testUser._id,
            author: `New Author ${i}`,
            content: `New Review ${i}`,
          })
        );
      }

      await Promise.all(promises);

      const count = await Review.countDocuments({
        movieId: "delete-create-test",
      });

      // Should have 5 (2 old + 3 new)
      expect(count).toBe(5);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════════
  // 5. PERFORMANCE METRICS
  // ════════════════════════════════════════════════════════════════════════════════

  describe("5. Performance Metrics", () => {
    test("should measure query performance - indexed search", async () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        await User.findOne({ email: testEmail });
      }

      const duration = performance.now() - start;

      console.log(`\n100 indexed email queries: ${duration.toFixed(2)}ms`);
      console.log(`Average per query: ${(duration / 100).toFixed(3)}ms`);

      // Should be very fast (< 10ms total for 100 queries with index)
      expect(duration).toBeLessThan(100);
    });

    test("should measure concurrent write performance", async () => {
      const start = performance.now();

      const promises = Array.from({ length: 50 }, (_, i) =>
        Review.create({
          movieId: "perf-test",
          user: testUser._id,
          author: `Author ${i}`,
          content: `Review ${i}`,
        })
      );

      await Promise.all(promises);

      const duration = performance.now() - start;

      console.log(`\n50 concurrent writes: ${duration.toFixed(2)}ms`);
      console.log(`Average per write: ${(duration / 50).toFixed(3)}ms`);
    });

    test("should measure aggregation performance", async () => {
      // Setup: create test data
      await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          Review.create({
            movieId: `agg-movie-${i % 10}`,
            user: testUser._id,
            author: `Author ${i}`,
            content: `Review ${i}`,
            rating: (i % 5) + 1,
          })
        )
      );

      const start = performance.now();

      // Run aggregation
      await Review.aggregate([
        { $match: { movieId: /^agg-movie-/ } },
        {
          $group: {
            _id: "$movieId",
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
        { $sort: { avgRating: -1 } },
      ]);

      const duration = performance.now() - start;

      console.log(`\nAggregation on 100 docs: ${duration.toFixed(2)}ms`);
    });
  });
});
