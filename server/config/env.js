import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV:      process.env.NODE_ENV || "development",
  PORT:          process.env.PORT || 8000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  SERVER_ORIGIN: process.env.SERVER_ORIGIN || "http://localhost:8000",
  MONGO_URI:     process.env.MONGO_URI,
  JWT_SECRET:    process.env.JWT_SECRET,
  TMDB_TOKEN:    process.env.TMDB_TOKEN,
  // Optional — features gracefully disabled when absent
  GROQ_API_KEY:         process.env.GROQ_API_KEY,
  REDIS_URL:            process.env.REDIS_URL,
  SENTRY_DSN:           process.env.SENTRY_DSN,
  GOOGLE_CLIENT_ID:     process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

export const validateEnv = () => {
  const required = ["MONGO_URI", "JWT_SECRET", "TMDB_TOKEN"];
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};
