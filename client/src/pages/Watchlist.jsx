import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";
import { SkeletonGrid } from "../components/Skeletons";
import DynamicBg from "../components/DynamicBg";
import WatchlistSmartGroups from "../components/WatchlistSmartGroups";
import WatchlistChat from "../components/WatchlistChat";

const TABS = [
  { key: "want_to_watch", label: "Want to Watch" },
  { key: "watching",      label: "Watching" },
  { key: "watched",       label: "Watched" },
];

const SORT_OPTIONS = [
  { value: "added",   label: "Date Added" },
  { value: "title",   label: "Title A–Z" },
  { value: "rating",  label: "Highest Rated" },
  { value: "year",    label: "Newest First" },
];

const STATUS_LABELS = {
  want_to_watch: "Want to Watch",
  watching:      "Watching",
  watched:       "Watched",
};

function Watchlist() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("want_to_watch");
  const [sortBy, setSortBy] = useState("added");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get("/users/me/watchlist");
        setMovies(res.data.movies || []);
      } catch (err) {
        console.error("Failed to fetch watchlist:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const changeStatus = async (movieId, newStatus) => {
    try {
      const res = await api.put(`/users/me/watchlist/${movieId}`, { status: newStatus });
      setMovies(res.data.movies || []);
      toast.success(`Moved to "${STATUS_LABELS[newStatus]}"`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const removeMovie = async (movieId) => {
    try {
      const res = await api.delete(`/users/me/watchlist/${movieId}`);
      setMovies(res.data.movies || []);
      toast("Removed from Watchlist", { icon: "🗑️" });
    } catch {
      toast.error("Failed to remove");
    }
  };

  const sortMovies = (list) => {
    const sorted = [...list];
    if (sortBy === "title")  sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "rating") sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    if (sortBy === "year")   sorted.sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""));
    return sorted;
  };
  const allTabMovies = sortMovies(movies.filter((m) => m.status === activeTab));
  const totalPages = Math.ceil(allTabMovies.length / PAGE_SIZE);
  const tabMovies = allTabMovies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen text-white pt-24 px-6 md:px-12 pb-16">
        <div className="skeleton h-10 w-36 rounded mb-2" />
        <div className="skeleton h-4 w-28 rounded mb-8" />
        <div className="flex gap-2 mb-8">
          {[1,2,3].map(i => <div key={i} className="skeleton h-9 w-32 rounded-t-lg" />)}
        </div>
        <SkeletonGrid />
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white pt-24 px-6 md:px-12 pb-16 relative overflow-hidden">
      <Helmet>
        <title>My Watchlist — CineWorld</title>
        <meta name="description" content="Track movies you want to watch, are currently watching, or have already seen." />
      </Helmet>
      <DynamicBg variant="purple" intensity="subtle" />

      {/* Header */}
      <div className="relative z-10 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-black">Watchlist</h1>
          <p className="text-gray-500 text-sm mt-1">
            {movies.length > 0
              ? `${movies.length} movie${movies.length > 1 ? "s" : ""} tracked`
              : "No movies tracked yet"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-red-500/50 cursor-pointer hover:bg-white/8 transition-all"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value} className="bg-[#1a1a1a]">{o.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full text-xs text-gray-400 border border-white/10">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            Synced to account
          </div>
        </div>
      </div>

      {/* AI Tools Row */}
      {movies.length >= 4 && (
        <div className="relative z-10 mb-6 space-y-3">
          <WatchlistSmartGroups movies={movies} />
          <WatchlistChat />
        </div>
      )}

      {/* Tabs */}
      <div className="relative z-10 flex gap-2 mb-8 border-b border-white/10 pb-0">
        {TABS.map((tab) => {
          const count = movies.filter((m) => m.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "text-white border-red-500 bg-white/5"
                  : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key ? "bg-red-600 text-white" : "bg-white/10 text-gray-400"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="relative z-10">
      {tabMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="text-7xl mb-2">
            {activeTab === "want_to_watch" ? "🎯" : activeTab === "watching" ? "▶️" : "✅"}
          </div>
          <h2 className="text-2xl font-bold text-gray-300">
            No movies {activeTab === "want_to_watch" ? "to watch" : activeTab === "watching" ? "in progress" : "watched"} yet
          </h2>
          <p className="text-gray-500 text-sm text-center max-w-sm">
            Open a movie and click <span className="text-white font-semibold">"+ Watchlist"</span> to track it here
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold text-sm transition-all hover:scale-105 active:scale-95"
          >
            Browse Movies
          </button>
        </div>
      ) : (
        <>
        {allTabMovies.length > PAGE_SIZE && (
          <p className="text-xs text-gray-500 mb-4">{allTabMovies.length} movies · Page {page} of {totalPages}</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tabMovies.map((movie) => (
            <div key={movie.id} className="group relative">
              {/* Card */}
              <div
                onClick={() => navigate(movie._mediaType === "tv" ? `/tv/${movie.id}` : `/movie/${movie.id}`)}
                className="cursor-pointer rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-red-500/50 transition-all hover:scale-105 duration-200"
              >
                <img
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(movie.title)}&background=333&color=fff&size=300`
                  }
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover"
                />
                <div className="p-2.5 bg-white/5">
                  <p className="text-xs font-semibold line-clamp-1">{movie.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-yellow-400">★ {movie.vote_average?.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">{movie.release_date?.split("-")[0]}</span>
                  </div>
                </div>
              </div>

              {/* Remove button */}
              <button
                onClick={(e) => { e.stopPropagation(); removeMovie(movie.id); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-red-600 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                title="Remove from watchlist"
              >
                ✕
              </button>

              {/* Status change buttons */}
              <div className="absolute bottom-[52px] left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 px-2 z-10">
                {TABS.filter((t) => t.key !== movie.status).map((t) => (
                  <button
                    key={t.key}
                    onClick={(e) => { e.stopPropagation(); changeStatus(movie.id, t.key); }}
                    className="flex-1 py-1 bg-black/80 backdrop-blur-sm border border-white/20 rounded text-[10px] font-medium text-gray-300 hover:bg-red-600/80 hover:text-white hover:border-transparent transition-all truncate px-1"
                    title={`Move to "${STATUS_LABELS[t.key]}"`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Hover play overlay */}
              <div
                onClick={() => navigate(movie._mediaType === "tv" ? `/tv/${movie.id}` : `/movie/${movie.id}`)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-xl flex items-end justify-center cursor-pointer pb-[88px]"
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                  <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${page === p ? "bg-red-600 text-white" : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"}`}
              >{p}</button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >Next →</button>
          </div>
        )}
        </>
      )}
      </div>
    </div>
  );
}

export default Watchlist;
