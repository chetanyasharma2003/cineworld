import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";
import Row from "../components/Row";

function MyList() {
  const [myList, setMyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        if (user) {
          // ✅ Logged in → server se fetch karo
          const res = await api.get("/users/me/list");
          setMyList(res.data.movies || []);
        } else {
          // Guest → localStorage se
          const saved = JSON.parse(localStorage.getItem("myList") || "[]");
          setMyList(saved);
        }
      } catch (err) {
        console.error("Failed to fetch list:", err);
        // Fallback to localStorage
        const saved = JSON.parse(localStorage.getItem("myList") || "[]");
        setMyList(saved);
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [user]);

  const removeFromList = async (movieId) => {
    try {
      if (user) {
        // ✅ Server se remove karo
        await api.delete(`/users/me/list/${movieId}`);
      } else {
        // Guest → localStorage se remove
        const updated = myList.filter((m) => m.id !== movieId);
        localStorage.setItem("myList", JSON.stringify(updated));
      }
      setMyList((prev) => prev.filter((m) => m.id !== movieId));
    } catch (err) {
      console.error("Failed to remove:", err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading your list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white pt-24 px-6 md:px-12 pb-16">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-black">My List</h1>
          <p className="text-gray-500 text-sm mt-1">
            {myList.length > 0
              ? `${myList.length} movie${myList.length > 1 ? "s" : ""} saved`
              : "No movies saved yet"}
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full text-xs text-gray-400 border border-white/10">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            Synced to account
          </div>
        )}
      </div>

      {myList.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="text-7xl mb-2">🎬</div>
          <h2 className="text-2xl font-bold text-gray-300">Your list is empty</h2>
          <p className="text-gray-500 text-sm text-center max-w-sm">
            Browse movies and click <span className="text-white font-semibold">"+ My List"</span> to save them here
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold text-sm transition-all hover:scale-105 active:scale-95"
          >
            Browse Movies
          </button>
        </div>
      ) : (
        /* Movie Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {myList.map((movie) => (
            <div key={movie.id} className="group relative">
              {/* Movie Card */}
              <div
                onClick={() => navigate(`/movie/${movie.id}`)}
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
                onClick={(e) => { e.stopPropagation(); removeFromList(movie.id); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-red-600 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                title="Remove from list"
              >
                ✕
              </button>

              {/* Hover play overlay */}
              <div
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-xl flex items-center justify-center cursor-pointer"
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
      )}
    </div>
  );
}

export default MyList;