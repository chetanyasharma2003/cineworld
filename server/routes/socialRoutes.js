import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getActivityFeed,
  markActivityAsRead,
  createWatchParty,
  getWatchParties,
  joinWatchParty,
  createSharedList,
  getSharedList,
  shareList,
  addMovieToSharedList,
} from "../controllers/socialController.js";

const router = express.Router();

// Activity Feed
router.get("/activity", protect, getActivityFeed);
router.post("/activity/:activityId/read", protect, markActivityAsRead);

// Watch Parties
router.post("/watch-parties", protect, createWatchParty);
router.get("/watch-parties", getWatchParties);
router.post("/watch-parties/:partyId/join", protect, joinWatchParty);

// Shared Lists
router.post("/lists", protect, createSharedList);
router.get("/lists/:token", getSharedList);
router.post("/lists/:listId/share", protect, shareList);
router.post("/lists/:listId/movies", protect, addMovieToSharedList);

export default router;
