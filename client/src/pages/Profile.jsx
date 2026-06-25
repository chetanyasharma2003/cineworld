import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api, API_BASE_URL } from "../lib/api";
import { tmdbGet } from "../lib/tmdb";
import Navbar from "../components/Navbar";
import { SkeletonGrid } from "../components/Skeletons";
import toast from "react-hot-toast";

const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 18: "Drama", 14: "Fantasy", 27: "Horror",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller",
};

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-1 hover:border-white/20 transition-all">
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-black mt-1">{value}</p>
      <p className="text-sm font-semibold text-white">{label}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function Profile() {
  const { user, setUser, logoutUser } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);

  const [myList, setMyList] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [socialData, setSocialData] = useState({ following: [], followerCount: 0, followingCount: 0 });
  const [digestOptOut, setDigestOptOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reviewsVisible, setReviewsVisible] = useState(5);

  // Edit profile state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    fetchData();
  }, [user]);

  // Backfill missing movieTitle for old reviews by fetching from TMDB
  useEffect(() => {
    const missing = myReviews.filter(r => !r.movieTitle && r.movieId);
    if (!missing.length) return;
    (async () => {
      for (const review of missing) {
        try {
          const data = await tmdbGet(`/movie/${review.movieId}`);
          if (data.title) {
            setMyReviews(prev => prev.map(r =>
              r._id === review._id ? { ...r, movieTitle: data.title } : r
            ));
          }
        } catch {}
        await new Promise(res => setTimeout(res, 200)); // small gap between calls
      }
    })();
  }, [myReviews.length]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, reviewsRes, socialRes] = await Promise.all([
        api.get("/users/me/list"),
        api.get("/users/me/reviews"),
        api.get("/users/me/social"),
      ]);
      setMyList(listRes.data.movies || []);
      setMyReviews(reviewsRes.data.reviews || []);
      setSocialData(socialRes.data);
      setDigestOptOut(user.digestOptOut ?? false);
    } catch {
      try {
        const listRes = await api.get("/users/me/list");
        setMyList(listRes.data.movies || []);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  // Calculate favourite genres from saved movies
  const getFavGenres = () => {
    const genreCounts = {};
    myList.forEach(movie => {
      (movie.genre_ids || []).forEach(id => {
        genreCounts[id] = (genreCounts[id] || 0) + 1;
      });
    });
    return Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id]) => GENRE_MAP[id])
      .filter(Boolean);
  };

  const avgRating = myList.length
    ? (myList.reduce((sum, m) => sum + (m.vote_average || 0), 0) / myList.length).toFixed(1)
    : "—";

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg("");
    setSaveErr("");
    try {
      const payload = { name: editName.trim(), email: editEmail.trim() };
      if (newPassword) {
        if (!currentPassword) { setSaveErr("Enter current password to change it."); setSaving(false); return; }
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const res = await api.put("/users/me", payload);
      setUser(res.data.user);
      setSaveMsg("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setSaveErr(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      setMyReviews(prev => prev.filter(r => r._id !== reviewId));
    } catch {}
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB"); return; }
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await api.post("/users/me/avatar", form, { headers: { "Content-Type": "multipart/form-data" } });
      setUser(res.data.user);
      toast.success("Profile picture updated!");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const tabs = ["overview", "social", "reviews", "ai", "settings"];
  const [aiInsights, setAiInsights] = useState(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState("");
  const [aiInsightsFetched, setAiInsightsFetched] = useState(false);

  const fetchAiInsights = async () => {
    setAiInsightsLoading(true);
    setAiInsightsError("");
    try {
      const res = await api.get("/ai/insights");
      setAiInsights(res.data.insights);
      if (!res.data.insights) setAiInsightsError(res.data.reason || "Not enough data yet.");
    } catch (err) {
      const msg = err.response?.data?.error || "";
      setAiInsightsError(
        msg.includes("not configured")
          ? "AI features require GROQ_API_KEY on the server."
          : "Failed to load AI insights. Please try again."
      );
    } finally {
      setAiInsightsLoading(false);
      setAiInsightsFetched(true);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white">
      <Navbar />

      <div className="pt-24 px-6 md:px-12 pb-16 max-w-5xl mx-auto">

        {/* Profile Header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="relative group">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-20 h-20 rounded-2xl overflow-hidden cursor-pointer shadow-lg shadow-red-900/30 bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-4xl font-black"
            >
              {user.avatarUrl ? (
                <img
                  src={`${API_BASE_URL.replace("/api", "")}${user.avatarUrl}?v=${Date.now()}`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center justify-center"
            >
              {avatarUploading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black">{user.name}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
            <p className="text-gray-700 text-xs mt-1">
              Member since {new Date(user.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
            <p className="text-gray-600 text-xs mt-0.5 cursor-pointer hover:text-gray-400 transition-colors" onClick={() => avatarInputRef.current?.click()}>
              Click avatar to change photo
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-xl w-fit flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "ai" && !aiInsightsFetched) fetchAiInsights();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all flex items-center gap-1.5 ${
                activeTab === tab
                  ? tab === "ai" ? "bg-gradient-to-r from-purple-600 to-red-600 text-white" : "bg-red-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "ai" && <span className="text-xs">✦</span>}
              {tab === "ai" ? "AI Insights" : tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-8">
            <SkeletonGrid count={6} />
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon="🎬" label="Saved Movies" value={myList.length} sub="In my list" />
                  <StatCard icon="⭐" label="Reviews Written" value={myReviews.length} sub="Total reviews" />
                  <StatCard icon="👥" label="Following" value={socialData.followingCount} sub={`${socialData.followerCount} followers`} />
                  <StatCard icon="🎭" label="Genres Explored" value={getFavGenres().length || "—"} sub="Favourite genres" />
                </div>

                {/* Fav Genres */}
                {getFavGenres().length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Your Favourite Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {getFavGenres().map(g => (
                        <span key={g} className="px-3 py-1.5 bg-red-600/20 border border-red-500/30 text-red-400 rounded-full text-sm font-semibold">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent saves */}
                {myList.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Recently Saved</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {myList.slice(0, 8).map(movie => (
                        <div
                          key={movie.id}
                          onClick={() => navigate(movie._mediaType === "tv" ? `/tv/${movie.id}` : `/movie/${movie.id}`)}
                          className="min-w-[100px] cursor-pointer group"
                        >
                          <div className="w-24 h-36 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-red-500/50 transition-all">
                            <img
                              src={movie.poster_path
                                ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(movie.title)}&background=333&color=fff`}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs mt-1.5 text-center line-clamp-1 text-gray-400">{movie.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SOCIAL TAB */}
            {activeTab === "social" && (
              <div className="space-y-5">
                <div className="flex items-center gap-6 mb-2">
                  <div className="text-center">
                    <p className="text-2xl font-black">{socialData.followingCount}</p>
                    <p className="text-xs text-gray-500">Following</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-2xl font-black">{socialData.followerCount}</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </div>
                </div>

                {socialData.following.length === 0 ? (
                  <div className="flex flex-col items-center py-20 gap-3">
                    <span className="text-5xl">👥</span>
                    <p className="text-gray-400 text-sm">You're not following anyone yet</p>
                    <p className="text-gray-600 text-xs">Visit a user's profile to follow them</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {socialData.following.map(u => (
                      <div key={u._id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-lg font-black overflow-hidden">
                              {u.avatarUrl
                                ? <img src={`${API_BASE_URL.replace("/api", "")}${u.avatarUrl}`} alt={u.name} className="w-full h-full object-cover" />
                                : u.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.watchlistCount} in watchlist</p>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                await api.delete(`/users/${u._id}/follow`);
                                setSocialData(prev => ({
                                  ...prev,
                                  following: prev.following.filter(f => String(f._id) !== String(u._id)),
                                  followingCount: prev.followingCount - 1,
                                }));
                                toast.success(`Unfollowed ${u.name}`);
                              } catch { toast.error("Something went wrong"); }
                            }}
                            className="text-xs px-3 py-1.5 border border-white/20 text-gray-400 hover:border-red-500/40 hover:text-red-400 rounded-lg transition-all"
                          >
                            Unfollow
                          </button>
                        </div>
                        {u.recentWatchlist?.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            {u.recentWatchlist.map(m => (
                              <div
                                key={m.id}
                                onClick={() => navigate(m._mediaType === "tv" ? `/tv/${m.id}` : `/movie/${m.id}`)}
                                className="flex-shrink-0 cursor-pointer"
                                title={m.title}
                              >
                                <img
                                  src={m.poster_path
                                    ? `https://image.tmdb.org/t/p/w92${m.poster_path}`
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.title)}&background=333&color=fff&size=60`}
                                  alt={m.title}
                                  className="w-10 h-14 rounded-lg object-cover hover:opacity-80 transition-opacity"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === "reviews" && (
              <div className="space-y-3">
                {myReviews.length === 0 ? (
                  <div className="flex flex-col items-center py-20 gap-3">
                    <span className="text-5xl">✍️</span>
                    <p className="text-gray-400">No reviews written yet</p>
                    <button onClick={() => navigate("/")} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold transition-all">
                      Watch & Review
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500">Showing {Math.min(reviewsVisible, myReviews.length)} of {myReviews.length} reviews</p>
                    {myReviews.slice(0, reviewsVisible).map(review => (
                      <div key={review._id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p
                              onClick={() => navigate(`/movie/${review.movieId}`)}
                              className="text-xs text-red-400 font-semibold mb-1 cursor-pointer hover:underline"
                            >
                              🎬 {review.movieTitle || `Movie #${review.movieId}`}
                            </p>
                            <div className="flex gap-1 mb-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <span key={i} className={`text-xs ${i < (review.rating || 0) ? "text-yellow-400" : "text-gray-700"}`}>★</span>
                              ))}
                            </div>
                            <p className="text-sm text-gray-200 leading-relaxed">"{review.content}"</p>
                            <p className="text-xs text-gray-600 mt-2">
                              {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="text-xs text-gray-600 hover:text-red-400 transition-colors shrink-0 px-2 py-1 hover:bg-red-500/10 rounded-lg"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {reviewsVisible < myReviews.length && (
                      <button
                        onClick={() => setReviewsVisible(v => v + 5)}
                        className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm text-gray-300 transition-all"
                      >
                        Load More ({myReviews.length - reviewsVisible} remaining)
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="max-w-md space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-lg">Account Details</h3>

                  {saveMsg && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl px-4 py-3">{saveMsg}</div>}
                  {saveErr && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{saveErr}</div>}

                  <div>
                    <label className="text-xs text-gray-400 font-medium mb-1.5 block">Full Name</label>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium mb-1.5 block">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/60 transition-all"
                    />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-lg">Change Password</h3>
                  <div>
                    <label className="text-xs text-gray-400 font-medium mb-1.5 block">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/60 transition-all placeholder-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium mb-1.5 block">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/60 transition-all placeholder-gray-700"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : "Save Changes"}
                </button>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm">Weekly AI Digest</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Receive personalised movie picks every Monday</p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const res = await api.post("/users/me/digest-opt-out");
                          setDigestOptOut(res.data.digestOptOut);
                          toast.success(res.data.digestOptOut ? "Unsubscribed from weekly digest" : "Subscribed to weekly digest!");
                        } catch { toast.error("Could not update preference"); }
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${digestOptOut ? "bg-white/10" : "bg-red-600"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${digestOptOut ? "" : "translate-x-5"}`} />
                    </button>
                  </div>
                </div>

                <div className="bg-white/3 border border-red-500/20 rounded-2xl p-5">
                  <h3 className="font-bold text-red-400 mb-1">Sign Out</h3>
                  <p className="text-xs text-gray-500 mb-3">You'll need to sign in again to access your account.</p>
                  <button
                    onClick={() => { logoutUser(); navigate("/"); }}
                    className="px-5 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-semibold transition-all"
                  >
                    Sign Out
                  </button>
                </div>

                <div className="border border-red-900/40 rounded-2xl p-5">
                  <h3 className="font-bold text-red-500 mb-1">Danger Zone</h3>
                  <p className="text-xs text-gray-500 mb-3">Permanently delete your account, saved movies, watchlist, and all reviews. This cannot be undone.</p>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-5 py-2.5 bg-red-900/30 border border-red-700/40 text-red-400 hover:bg-red-900/50 rounded-xl text-sm font-semibold transition-all"
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-red-400 font-semibold">Are you absolutely sure?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            setDeleting(true);
                            try {
                              await api.delete("/users/me");
                              logoutUser();
                              navigate("/");
                              toast.success("Account deleted.");
                            } catch {
                              toast.error("Failed to delete account.");
                              setDeleting(false);
                              setShowDeleteConfirm(false);
                            }
                          }}
                          disabled={deleting}
                          className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-900 rounded-xl text-sm font-semibold transition-all"
                        >
                          {deleting ? "Deleting..." : "Yes, Delete Everything"}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-sm transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI INSIGHTS TAB */}
            {activeTab === "ai" && (
              <div className="space-y-5 max-w-2xl">
                {aiInsightsLoading && (
                  <div className="flex flex-col items-center py-16 gap-3 text-purple-400">
                    <span className="text-4xl animate-spin">✦</span>
                    <p className="text-sm">Claude is analysing your taste...</p>
                  </div>
                )}

                {aiInsightsError && !aiInsightsLoading && (
                  <div className="py-12 text-center space-y-3">
                    <p className="text-3xl">🎬</p>
                    <p className="text-gray-400 text-sm">{aiInsightsError}</p>
                    <button
                      onClick={fetchAiInsights}
                      className="px-5 py-2.5 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-xl text-sm font-semibold hover:bg-purple-600/30 transition-all"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {aiInsights && !aiInsightsLoading && (
                  <>
                    {/* Taste Profile Card */}
                    <div className="bg-gradient-to-br from-purple-900/20 to-red-900/20 border border-purple-500/20 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-purple-400">✦</span>
                        <p className="text-xs font-bold uppercase tracking-wider text-purple-400">Your Taste Profile</p>
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-3xl">🎭</div>
                        <div>
                          <p className="text-lg font-black">{aiInsights.watchingStyle}</p>
                          <p className="text-xs text-gray-500">Watching Style</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{aiInsights.tasteProfile}</p>
                    </div>

                    {/* Top Genres */}
                    {aiInsights.topGenres?.length > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Your Top Genres</h3>
                        <div className="flex flex-wrap gap-2">
                          {aiInsights.topGenres.map((g) => (
                            <span key={g} className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-full text-sm font-semibold">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mood Tags */}
                    {aiInsights.moodTags?.length > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">What Defines You</h3>
                        <div className="space-y-2">
                          {aiInsights.moodTags.map((tag, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                              <span className="text-purple-400 text-xs">✦</span>
                              {tag}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hidden Pattern */}
                    {aiInsights.hiddenPattern && (
                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span>💡</span>
                          <p className="text-xs font-bold uppercase tracking-wider text-yellow-500">Hidden Pattern</p>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">{aiInsights.hiddenPattern}</p>
                      </div>
                    )}

                    {/* Next Pick */}
                    {aiInsights.nextPick && (
                      <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span>🎯</span>
                          <p className="text-xs font-bold uppercase tracking-wider text-green-500">Watch Next</p>
                        </div>
                        <p className="text-base font-black text-white mb-1">{aiInsights.nextPick}</p>
                        <p className="text-xs text-gray-400 leading-relaxed">{aiInsights.nextPickReason}</p>
                        <button
                          onClick={() => navigate(`/search?q=${encodeURIComponent(aiInsights.nextPick)}`)}
                          className="mt-3 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-xl text-xs font-semibold transition-all"
                        >
                          Find it on CineWorld →
                        </button>
                      </div>
                    )}

                    <button
                      onClick={fetchAiInsights}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-400 hover:text-white transition-all"
                    >
                      ↻ Refresh Analysis
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}