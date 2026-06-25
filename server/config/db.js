import mongoose from "mongoose";
import { env } from "./env.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      maxPoolSize:              50,   // concurrent DB connections (default: 5)
      minPoolSize:               5,   // keep at least 5 warm
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS:         45_000,
      connectTimeoutMS:        10_000,
      heartbeatFrequencyMS:    10_000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("DB Error:", error.message);
    throw error;
  }
};

export default connectDB;
