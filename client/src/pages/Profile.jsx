import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";

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

  const [myList, setMyList] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, reviewsRes] = await Promise.all([
        api.get("/users/me/list"),
        api.get("/users/me/reviews"),
      ]);
      setMyList(listRes.data.movies || []);
      setMyReviews(reviewsRes.data.reviews || []);
    } catch {
      // reviews endpoint may not exist yet — graceful fallback
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

  const tabs = ["overview", "my list", "reviews", "settings"];

  if (!user) return null;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white">
      <Navbar />

      <div className="pt-24 px-6 md:px-12 pb-16 max-w-5xl mx-auto">

        {/* Profile Header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center text-4xl font-black shadow-lg shadow-red-900/30">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black">{user.name}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
            <p className="text-gray-700 text-xs mt-1">
              Member since {new Date(user.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab
                  ? "bg-red-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
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
                  <StatCard icon="📊" label="Avg Rating" value={avgRating} sub="Of saved movies" />
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
                          onClick={() => navigate(`/movie/${movie.id}`)}
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

            {/* MY LIST TAB */}
            {activeTab === "my list" && (
              <div>
                {myList.length === 0 ? (
                  <div className="flex flex-col items-center py-20 gap-3">
                    <span className="text-5xl">🎬</span>
                    <p className="text-gray-400">No movies saved yet</p>
                    <button onClick={() => navigate("/")} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold transition-all">
                      Browse Movies
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {myList.map(movie => (
                      <div
                        key={movie.id}
                        onClick={() => navigate(`/movie/${movie.id}`)}
                        className="cursor-pointer group rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-red-500/50 transition-all hover:scale-105"
                      >
                        <img
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(movie.title)}&background=333&color=fff`}
                          alt={movie.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                        <div className="p-1.5 bg-white/5">
                          <p className="text-xs line-clamp-1">{movie.title}</p>
                          <p className="text-xs text-yellow-400">★ {movie.vote_average?.toFixed(1)}</p>
                        </div>
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
                  myReviews.map(review => (
                    <div key={review._id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-red-400 font-semibold mb-1">Movie ID: {review.movieId}</p>
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
                  ))
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}