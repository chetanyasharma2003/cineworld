import ActivityFeed from "../models/ActivityFeed.js";
import WatchParty from "../models/WatchParty.js";
import SharedList from "../models/SharedList.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

// Activity Feed
export const getActivityFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const activities = await ActivityFeed.find({ userId: req.user._id })
      .populate("actor", "name avatarUrl")
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ActivityFeed.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      activities,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (err) {
    logger.error("Get activity feed failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch activity feed" });
  }
};

export const markActivityAsRead = async (req, res) => {
  try {
    const { activityId } = req.params;
    await ActivityFeed.findByIdAndUpdate(activityId, { read: true });
    res.json({ success: true });
  } catch (err) {
    logger.error("Mark activity read failed", { error: err.message });
    res.status(500).json({ message: "Failed to mark activity" });
  }
};

// Watch Parties
export const createWatchParty = async (req, res) => {
  try {
    const { title, movieId, movieTitle, scheduledFor, description, platform, meetingUrl } = req.body;

    const party = new WatchParty({
      title,
      movieId,
      movieTitle,
      organizer: req.user._id,
      scheduledFor: new Date(scheduledFor),
      description,
      platform,
      meetingUrl,
    });

    await party.save();
    logger.info("Watch party created", { partyId: party._id, organizer: req.user._id });
    res.status(201).json({ success: true, party });
  } catch (err) {
    logger.error("Create watch party failed", { error: err.message });
    res.status(500).json({ message: "Failed to create watch party" });
  }
};

export const getWatchParties = async (req, res) => {
  try {
    const { status = "scheduled", page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const parties = await WatchParty.find({ status })
      .populate("organizer", "name avatarUrl")
      .populate("members.userId", "name avatarUrl")
      .sort({ scheduledFor: 1 })
      .skip(skip)
      .limit(limit);

    const total = await WatchParty.countDocuments({ status });

    res.json({
      success: true,
      parties,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (err) {
    logger.error("Get watch parties failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch watch parties" });
  }
};

export const joinWatchParty = async (req, res) => {
  try {
    const { partyId } = req.params;
    const party = await WatchParty.findById(partyId);

    if (!party) return res.status(404).json({ message: "Party not found" });
    if (party.members.length >= party.maxMembers) {
      return res.status(400).json({ message: "Party is full" });
    }

    const alreadyJoined = party.members.some((m) => m.userId.toString() === req.user._id.toString());
    if (alreadyJoined) return res.status(400).json({ message: "Already joined" });

    party.members.push({ userId: req.user._id, status: "joined" });
    await party.save();

    logger.info("User joined watch party", { partyId, userId: req.user._id });
    res.json({ success: true, party });
  } catch (err) {
    logger.error("Join watch party failed", { error: err.message });
    res.status(500).json({ message: "Failed to join party" });
  }
};

// Shared Lists
export const createSharedList = async (req, res) => {
  try {
    const { name, description, isPublic, movies } = req.body;

    const list = new SharedList({
      name,
      description,
      owner: req.user._id,
      isPublic,
      movies: movies || [],
    });

    await list.save();
    logger.info("Shared list created", { listId: list._id, owner: req.user._id });
    res.status(201).json({ success: true, list });
  } catch (err) {
    logger.error("Create shared list failed", { error: err.message });
    res.status(500).json({ message: "Failed to create list" });
  }
};

export const getSharedList = async (req, res) => {
  try {
    const { token } = req.params;
    const list = await SharedList.findOne({ shareToken: token }).populate("owner", "name avatarUrl");

    if (!list) return res.status(404).json({ message: "List not found" });

    list.views++;
    await list.save();

    res.json({ success: true, list });
  } catch (err) {
    logger.error("Get shared list failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch list" });
  }
};

export const shareList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { userIds, permission = "view" } = req.body;

    const list = await SharedList.findById(listId);
    if (!list) return res.status(404).json({ message: "List not found" });
    if (list.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    for (const userId of userIds) {
      const alreadyShared = list.sharedWith.some((s) => s.userId.toString() === userId);
      if (!alreadyShared) {
        list.sharedWith.push({ userId, permission });
      }
    }

    await list.save();
    logger.info("List shared", { listId, sharedWith: userIds.length });
    res.json({ success: true, list });
  } catch (err) {
    logger.error("Share list failed", { error: err.message });
    res.status(500).json({ message: "Failed to share list" });
  }
};

export const addMovieToSharedList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { movieId, title, posterPath } = req.body;

    const list = await SharedList.findById(listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    const hasPermission =
      list.owner.toString() === req.user._id.toString() ||
      list.sharedWith.some((s) => s.userId.toString() === req.user._id.toString() && s.permission === "edit");

    if (!hasPermission) return res.status(403).json({ message: "Not authorized" });

    list.movies.push({ movieId, title, posterPath, addedBy: req.user._id });
    await list.save();

    res.json({ success: true, list });
  } catch (err) {
    logger.error("Add movie to list failed", { error: err.message });
    res.status(500).json({ message: "Failed to add movie" });
  }
};
