import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const savedMovieSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    title: { type: String, required: true },
    poster_path: { type: String, default: "" },
    backdrop_path: { type: String, default: "" },
    release_date: { type: String, default: "" },
    vote_average: { type: Number, default: 0 },
    genre_ids: { type: [Number], default: [] },
    overview: { type: String, default: "" },
    _mediaType: { type: String, enum: ["movie", "tv"], default: "movie" },
  },
  { _id: false },
);

const watchlistMovieSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    title: { type: String, required: true },
    poster_path: { type: String, default: "" },
    backdrop_path: { type: String, default: "" },
    release_date: { type: String, default: "" },
    vote_average: { type: Number, default: 0 },
    genre_ids: { type: [Number], default: [] },
    overview: { type: String, default: "" },
    _mediaType: { type: String, enum: ["movie", "tv"], default: "movie" },
    status: {
      type: String,
      enum: ["want_to_watch", "watching", "watched"],
      default: "want_to_watch",
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    savedMovies: { type: [savedMovieSchema], default: [] },
    watchlist: { type: [watchlistMovieSchema], default: [] },
    refreshToken: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, default: null },
    emailVerifyExpires: { type: Date, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    aiFeedback: {
      type: [{
        movieId:    { type: Number, required: true },
        movieTitle: { type: String, default: "" },
        liked:      { type: Boolean, required: true }, // true = thumbs up, false = thumbs down
        createdAt:  { type: Date, default: Date.now },
      }],
      default: [],
    },
    tasteVector: {
      // Genre weights: genreId → score (higher = stronger preference)
      type: Map,
      of: Number,
      default: {},
    },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    digestOptOut: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Sparse index: lets collab-picks query use an index instead of collection scan
userSchema.index({ "watchlist.3": 1 }, { sparse: true });

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Is account currently locked?
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Increment failed login attempts; lock after 5 failures for 15 minutes
userSchema.methods.incLoginAttempts = async function () {
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 15 * 60 * 1000; // 15 min

  // If a previous lock has expired, reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const update = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
    update.$set = { lockUntil: new Date(Date.now() + LOCK_TIME) };
  }
  return this.updateOne(update);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
};

export default mongoose.model("User", userSchema);
