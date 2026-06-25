import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "../components/Navbar";
import { api, API_BASE_URL } from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${id}/profile`);
      setProfile(res.data);
      setFollowerCount(res.data.followerCount);
      // isFollowedBy is returned directly by the API (no second request needed)
      setFollowing(res.data.isFollowedBy ?? false);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!user) { navigate("/login"); return; }
    setToggling(true);
    try {
      if (following) {
        await api.delete(`/users/${id}/follow`);
        setFollowing(false);
        setFollowerCount(c => c - 1);
        toast.success(`Unfollowed ${profile.name}`);
      } else {
        await api.post(`/users/${id}/follow`);
        setFollowing(true);
        setFollowerCount(c => c + 1);
        toast.success(`Following ${profile.name}!`);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen text-white">
        <Navbar />
        <div className="pt-32 flex justify-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen text-white">
        <Navbar />
        <div className="pt-32 text-center">
          <p className="text-4xl mb-4">👤</p>
          <p className="text-gray-400">User not found</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = user && String(user._id || user.id) === String(id);

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white">
      <Helmet>
        <title>{profile.name} — CineWorld</title>
      </Helmet>
      <Navbar />

      <div className="pt-24 px-6 md:px-12 pb-16 max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-4xl font-black overflow-hidden shadow-lg shadow-red-900/30">
            {profile.avatarUrl
              ? <img src={`${API_BASE_URL.replace("/api", "")}${profile.avatarUrl}`} alt={profile.name} className="w-full h-full object-cover" />
              : profile.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black">{profile.name}</h1>
            <p className="text-gray-500 text-xs mt-1">
              Member since {new Date(profile.joinedAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <span><span className="text-white font-bold">{followerCount}</span> followers</span>
              <span><span className="text-white font-bold">{profile.followingCount}</span> following</span>
              <span><span className="text-white font-bold">{profile.watchlistCount}</span> in watchlist</span>
            </div>
          </div>

          {!isOwnProfile && (
            <button
              onClick={toggleFollow}
              disabled={toggling}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                following
                  ? "bg-white/10 border border-white/20 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}
            >
              {toggling ? "..." : following ? "Following" : "Follow"}
            </button>
          )}

          {isOwnProfile && (
            <button
              onClick={() => navigate("/profile")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/10 border border-white/20 text-gray-300 hover:bg-white/15 transition-all"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Recent Watchlist */}
        {profile.recentWatchlist?.length > 0 ? (
          <div>
            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
              Recent Watchlist
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {profile.recentWatchlist.map(m => (
                <div
                  key={m.id}
                  onClick={() => navigate(m._mediaType === "tv" ? `/tv/${m.id}` : `/movie/${m.id}`)}
                  className="cursor-pointer group"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-red-500/50 transition-all">
                    <img
                      src={m.poster_path
                        ? `https://image.tmdb.org/t/p/w185${m.poster_path}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.title)}&background=333&color=fff`}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-xs mt-1.5 line-clamp-1 text-gray-500 group-hover:text-white transition-colors">{m.title}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">🎬</p>
            <p className="text-sm">No watchlist items yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
