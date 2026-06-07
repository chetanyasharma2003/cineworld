import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

// ✅ Token ab .env se aa raha hai — hardcoded nahi
const TMDB_TOKEN = import.meta.env.VITE_TMDB_TOKEN;

const api = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
});

function Navbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // ✅ AuthContext se user lo — localStorage se nahi
  const { user, logoutUser } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close search on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setQuery(""); setResults([]); setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!query.trim()) { setResults([]); return; }
      try {
        const res = await api.get(`/search/movie?query=${encodeURIComponent(query)}`);
        setResults(res.data.results.filter(m => m.poster_path).slice(0, 7));
      } catch (err) { console.log(err); }
    }, 350);
    return () => clearTimeout(delay);
  }, [query]);

  const handleLogout = () => {
    logoutUser(); // ✅ AuthContext ka logoutUser
    setShowUserMenu(false);
    navigate("/");
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? "bg-[#0a0a0a]/95 backdrop-blur-md shadow-2xl" : "bg-gradient-to-b from-black/80 to-transparent"
    }`}>
      <div className="flex items-center justify-between px-6 md:px-10 py-4">

        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <div className="relative w-9 h-9 shrink-0">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center font-black text-white text-lg group-hover:bg-red-500 transition-all group-hover:scale-110 select-none">
              C
            </div>
          </div>
          <span className="text-xl font-black tracking-tight select-none whitespace-nowrap">
            Cine<span className="text-red-500">World</span>
          </span>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
          <span onClick={() => navigate("/")} className="hover:text-white cursor-pointer transition-colors font-medium">Home</span>

          {/* Movies Dropdown */}
          <div className="relative" onMouseEnter={() => setShowGenreMenu(true)} onMouseLeave={() => setShowGenreMenu(false)}>
            <span className="hover:text-white cursor-pointer transition-colors font-medium flex items-center gap-1">
              Movies <span className="text-xs">▾</span>
            </span>
            {showGenreMenu && (
              <div className="absolute top-6 left-0 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 grid grid-cols-2 p-2 gap-0.5">
                {[
                  ["action","💥 Action"], ["comedy","😂 Comedy"],
                  ["horror","👻 Horror"], ["thriller","😱 Thriller"],
                  ["romance","❤️ Romance"], ["sci-fi","🚀 Sci-Fi"],
                  ["animation","🎪 Animation"], ["drama","🎭 Drama"],
                  ["fantasy","🧙 Fantasy"], ["bollywood","🎵 Bollywood"],
                ].map(([slug, label]) => (
                  <button
                    key={slug}
                    onClick={() => { navigate(`/genre/${slug}`); setShowGenreMenu(false); }}
                    className="text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-all"
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => { navigate("/search"); setShowGenreMenu(false); }}
                  className="col-span-2 text-center px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-all border-t border-white/5 mt-1"
                >
                  🔍 Browse All Movies
                </button>
              </div>
            )}
          </div>

          <span onClick={() => navigate("/search")} className="hover:text-white cursor-pointer transition-colors font-medium">Search</span>
          <span onClick={() => navigate("/mylist")} className="hover:text-white cursor-pointer transition-colors font-medium">My List</span>
        </div>

        {/* Right: Search + User */}
        <div className="flex items-center gap-3">

          {/* Search */}
          <div ref={searchRef} className="relative">
            <div className={`flex items-center gap-2 transition-all duration-300 rounded-full overflow-hidden ${
              searchOpen ? "bg-black/80 backdrop-blur-sm border border-white/20 pl-4 pr-2" : ""
            }`}>
              {searchOpen && (
                <input
                  autoFocus
                  type="text"
                  placeholder="Search movies, shows..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm w-56 text-white placeholder-gray-500 py-2"
                />
              )}
              <button
                onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) { setQuery(""); setResults([]); } }}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-all text-gray-300 hover:text-white"
              >
                {searchOpen ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Search Dropdown */}
            {results.length > 0 && (
              <div className="absolute top-12 right-0 w-80 bg-[#141414] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <p className="text-xs text-gray-500 px-4 py-2 border-b border-white/5">
                  {results.length} results for "{query}"
                </p>
                {results.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => { setQuery(""); setResults([]); setSearchOpen(false); navigate(`/movie/${movie.id}`); }}
                    className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-all group"
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                      className="w-10 h-14 rounded-md object-cover shrink-0"
                      alt={movie.title}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-red-400 transition-colors">{movie.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{movie.release_date?.split("-")[0]} • ⭐ {movie.vote_average?.toFixed(1)}</p>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{movie.overview}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notification bell */}
          <button className="w-9 h-9 hidden md:flex items-center justify-center rounded-full hover:bg-white/10 transition-all text-gray-300 hover:text-white relative">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User Avatar / Login */}
          {user ? (
            <div className="relative">
              <div
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-110 transition-all select-none"
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-12 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { navigate("/profile"); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all flex items-center gap-2"
                    >
                      👤 Profile
                    </button>
                    <button
                      onClick={() => { navigate("/mylist"); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all flex items-center gap-2"
                    >
                      🎬 My List
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-red-400 transition-all flex items-center gap-2 border-t border-white/5"
                    >
                      ↩ Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-semibold px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;