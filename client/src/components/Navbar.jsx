import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext";
import { api, API_BASE_URL } from "../lib/api";

const GENRES = [
  ["action","Action"], ["comedy","Comedy"],
  ["horror","Horror"], ["thriller","Thriller"],
  ["romance","Romance"], ["sci-fi","Sci-Fi"],
  ["animation","Animation"], ["drama","Drama"],
  ["fantasy","Fantasy"], ["bollywood","Bollywood"],
];

export default function Navbar() {
  const [query, setQuery]               = useState("");
  const [results, setResults]           = useState([]);
  const [scrolled, setScrolled]         = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const [showTVMenu, setShowTVMenu]     = useState(false);
  const [showNotifs, setShowNotifs]     = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [searchHistory, setSearchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cw_search_history") || "[]"); } catch { return []; }
  });
  const { user, logoutUser }  = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate              = useNavigate();
  const searchRef             = useRef(null);
  const genreTimerRef         = useRef(null);
  const tvTimerRef            = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setQuery(""); setResults([]); setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const saveToHistory = (term) => {
    if (!term.trim()) return;
    setSearchHistory(prev => {
      const updated = [term, ...prev.filter(t => t !== term)].slice(0, 8);
      localStorage.setItem("cw_search_history", JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("cw_search_history");
  };

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!query.trim()) { setResults([]); return; }
      try {
        const { tmdbGet } = await import("../lib/tmdb");
        const [movRes, pepRes] = await Promise.all([
          tmdbGet("/search/movie", { query }),
          tmdbGet("/search/person", { query }),
        ]);
        const movies = (movRes.results || []).filter(m => m.poster_path).slice(0, 4).map(m => ({ ...m, _type: "movie" }));
        const people = (pepRes.results || []).filter(p => p.profile_path).slice(0, 3).map(p => ({ ...p, _type: "person" }));
        setResults([...people, ...movies]);
      } catch { /* ignore */ }
    }, 350);
    return () => clearTimeout(delay);
  }, [query]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    if (!user) { setNotifications([]); setUnreadCount(0); return; }
    fetchNotifications();

    let es;
    // Exchange Bearer JWT for a short-lived one-time nonce, then open SSE with it
    (async () => {
      try {
        const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
        const nonceRes = await api.post("/notifications/sse-token");
        const { nonce } = nonceRes.data;
        es = new EventSource(`${baseUrl}/notifications/stream?nonce=${encodeURIComponent(nonce)}`);
        es.onmessage = (e) => {
          try {
            const notif = JSON.parse(e.data);
            setNotifications(prev => [notif, ...prev].slice(0, 20));
            setUnreadCount(c => c + 1);
          } catch { /* ignore */ }
        };
        es.onerror = () => es.close();
      } catch {
        // Notifications not critical — silently skip if token exchange fails
      }
    })();

    return () => es?.close();
  }, [user, fetchNotifications]);

  const handleOpenNotifs = async () => {
    if (!user) { navigate("/login"); return; }
    setShowNotifs(v => !v);
    setShowUserMenu(false);
    if (!showNotifs && unreadCount > 0) {
      try {
        await api.post("/notifications/mark-read");
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch { /* ignore */ }
    }
  };

  const handleClearNotifs = async () => {
    try { await api.delete("/notifications"); setNotifications([]); setUnreadCount(0); } catch { /* ignore */ }
  };

  const handleGenreEnter = () => { clearTimeout(genreTimerRef.current); clearTimeout(tvTimerRef.current); setShowGenreMenu(true); setShowTVMenu(false); };
  const handleGenreLeave = () => { genreTimerRef.current = setTimeout(() => setShowGenreMenu(false), 200); };
  const handleTVEnter = () => { clearTimeout(tvTimerRef.current); clearTimeout(genreTimerRef.current); setShowTVMenu(true); setShowGenreMenu(false); };
  const handleTVLeave = () => { tvTimerRef.current = setTimeout(() => setShowTVMenu(false), 200); };
  const handleLogout = () => { logoutUser(); setShowUserMenu(false); navigate("/"); };

  /* ── Nav link style ── */
  const navLink = "relative text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer group";
  const underline = "absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[#0ea5e9] group-hover:w-full transition-all duration-300";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-[#0ea5e9]/10 shadow-[0_8px_32px_rgba(6,12,24,0.8)]"
          : ""
      }`}
      style={{
        background: scrolled
          ? "rgba(6,12,24,0.93)"
          : "linear-gradient(to bottom, rgba(6,12,24,0.85), transparent)",
        backdropFilter: scrolled ? "blur(20px) saturate(1.5)" : "none",
      }}
    >
      <div className="flex items-center justify-between px-6 md:px-10 py-3.5">

        {/* ── Logo ── */}
        <div onClick={() => navigate("/")} className="flex items-center gap-2.5 cursor-pointer group shrink-0 select-none">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base transition-all group-hover:scale-110"
            style={{
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              boxShadow: "0 0 16px rgba(14,165,233,0.4)",
            }}
          >
            ◈
          </div>
          <span className="text-lg font-black tracking-tight whitespace-nowrap">
            Cine<span style={{ color: "#0ea5e9" }}>World</span>
          </span>
        </div>

        {/* ── Desktop Nav ── */}
        <div className="hidden md:flex items-center gap-7">

          <span onClick={() => navigate("/")} className={navLink}>
            Home <span className={underline} />
          </span>

          {/* Movies dropdown */}
          <div className="relative" onMouseEnter={handleGenreEnter} onMouseLeave={handleGenreLeave}>
            <span className={`${navLink} flex items-center gap-1`}>
              Movies
              <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
              </svg>
              <span className={underline} />
            </span>
            {showGenreMenu && (
              <div
                className="absolute top-full left-0 pt-3 w-56 z-50"
                onMouseEnter={handleGenreEnter} onMouseLeave={handleGenreLeave}
              >
                <div
                  className="rounded-2xl overflow-hidden p-2 grid grid-cols-2 gap-0.5"
                  style={{
                    background: "rgba(8,14,28,0.97)",
                    border: "1px solid rgba(14,165,233,0.2)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(14,165,233,0.05)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {GENRES.map(([slug, label]) => (
                    <button key={slug}
                      onClick={() => { navigate(`/genre/${slug}`); setShowGenreMenu(false); }}
                      className="text-left px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-[#0ea5e9]/10 rounded-xl transition-all">
                      {label}
                    </button>
                  ))}
                  <button
                    onClick={() => { navigate("/search"); setShowGenreMenu(false); }}
                    className="col-span-2 mt-1 px-3 py-2 text-xs text-[#0ea5e9] hover:bg-[#0ea5e9]/10 rounded-xl transition-all border-t border-white/5 font-semibold text-center">
                    Browse All →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TV Shows dropdown */}
          <div className="relative" onMouseEnter={handleTVEnter} onMouseLeave={handleTVLeave}>
            <span
              onClick={() => navigate("/tv")}
              className={`${navLink} flex items-center gap-1`}
            >
              TV Shows
              <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
              </svg>
              <span className={underline} />
            </span>
            {showTVMenu && (
              <div className="absolute top-full left-0 pt-3 w-52 z-50" onMouseEnter={handleTVEnter} onMouseLeave={handleTVLeave}>
                <div
                  className="rounded-2xl p-2 flex flex-col gap-0.5"
                  style={{
                    background: "rgba(8,14,28,0.97)",
                    border: "1px solid rgba(14,165,233,0.2)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {[["Popular Shows","/tv"],["Drama","/tv"],["Comedy","/tv"],["Action","/tv"],["Crime","/tv"],["Sci-Fi","/tv"]].map(([label, path]) => (
                    <button key={label}
                      onClick={() => { navigate(path); setShowTVMenu(false); }}
                      className="text-left px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-[#0ea5e9]/10 rounded-xl transition-all">
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span onClick={() => navigate("/actors")} className={navLink}>Actors <span className={underline} /></span>
          <span onClick={() => navigate("/calendar")} className={navLink}>Calendar <span className={underline} /></span>
          <span onClick={() => navigate("/watchlist")} className={navLink}>Watchlist <span className={underline} /></span>
          <span onClick={() => navigate("/compare")} className={navLink}>Compare <span className={underline} /></span>

          {/* AI Picks pill */}
          <span
            onClick={() => navigate("/ai")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(139,92,246,0.15))",
              border: "1px solid rgba(14,165,233,0.35)",
              color: "#7dd3fc",
              boxShadow: "0 0 12px rgba(14,165,233,0.15)",
            }}
          >
            ✦ AI Picks
          </span>
        </div>

        {/* ── Right side ── */}
        <div className="flex items-center gap-2">

          {/* Search */}
          <div ref={searchRef} className="relative">
            <div className={`flex items-center gap-2 transition-all duration-300 rounded-full ${
              searchOpen
                ? "pl-4 pr-2 py-1"
                : ""
            }`}
              style={searchOpen ? {
                background: "rgba(8,14,28,0.95)",
                border: "1px solid rgba(14,165,233,0.3)",
                backdropFilter: "blur(20px)",
              } : {}}
            >
              {searchOpen && (
                <input autoFocus type="text" placeholder="Search movies, actors..."
                  value={query} onChange={e => setQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm w-52 text-white placeholder-slate-600 py-1.5"
                />
              )}
              <button
                onClick={() => { if (searchOpen) { setSearchOpen(false); setQuery(""); setResults([]); } else { setSearchOpen(true); } }}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-all text-slate-400 hover:text-white hover:bg-white/8"
              >
                {searchOpen
                  ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>
                }
              </button>
            </div>

            {/* Search history */}
            {searchOpen && !query.trim() && searchHistory.length > 0 && (
              <div
                className="absolute top-12 right-0 w-80 rounded-2xl overflow-hidden z-50"
                style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(14,165,233,0.15)", backdropFilter: "blur(20px)", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}
              >
                <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-semibold">Recent</p>
                  <button onClick={clearHistory} className="text-xs text-slate-600 hover:text-[#0ea5e9] transition-colors">Clear</button>
                </div>
                {searchHistory.map((term, i) => (
                  <div key={i} onClick={() => setQuery(term)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#0ea5e9]/5 cursor-pointer transition-all group border-b border-white/5 last:border-0">
                    <svg className="w-3.5 h-3.5 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span className="text-sm text-slate-400 group-hover:text-white transition-colors truncate">{term}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Search results */}
            {results.length > 0 && (
              <div
                className="absolute top-12 right-0 w-80 rounded-2xl overflow-hidden z-50"
                style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(14,165,233,0.15)", backdropFilter: "blur(20px)", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}
              >
                {results.filter(r => r._type === "person").length > 0 && (
                  <div>
                    <p className="text-xs text-[#0ea5e9] font-semibold px-4 py-2 border-b border-white/5" style={{ background: "rgba(14,165,233,0.05)" }}>Actors</p>
                    {results.filter(r => r._type === "person").map(item => (
                      <div key={`p-${item.id}`}
                        onClick={() => { saveToHistory(query); setQuery(""); setResults([]); setSearchOpen(false); navigate(`/actor/${item.id}`); }}
                        className="flex items-center gap-3 p-3 hover:bg-[#0ea5e9]/5 cursor-pointer transition-all group border-b border-white/5">
                        <img src={`https://image.tmdb.org/t/p/w185${item.profile_path}`} className="w-10 h-14 rounded-lg object-cover shrink-0" alt={item.name} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate group-hover:text-[#0ea5e9] transition-colors">{item.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.known_for_department || "Actor"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {results.filter(r => r._type === "movie").length > 0 && (
                  <div>
                    <p className="text-xs text-[#f59e0b] font-semibold px-4 py-2 border-b border-white/5" style={{ background: "rgba(245,158,11,0.05)" }}>Movies</p>
                    {results.filter(r => r._type === "movie").map(item => (
                      <div key={`m-${item.id}`}
                        onClick={() => { saveToHistory(query); setQuery(""); setResults([]); setSearchOpen(false); navigate(`/movie/${item.id}`); }}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-all group border-b border-white/5 last:border-0">
                        <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} className="w-10 h-14 rounded-lg object-cover shrink-0" alt={item.title} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate group-hover:text-[#f59e0b] transition-colors">{item.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.release_date?.split("-")[0]} · ⭐ {item.vote_average?.toFixed(1)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => { saveToHistory(query); setSearchOpen(false); setQuery(""); setResults([]); navigate(`/search?q=${encodeURIComponent(query)}`); }}
                  className="w-full text-center px-4 py-2.5 text-xs text-[#0ea5e9] hover:bg-[#0ea5e9]/10 transition-all border-t border-white/5 font-semibold"
                >
                  See all results for "{query}" →
                </button>
              </div>
            )}

            {searchOpen && !query.trim() && searchHistory.length === 0 && (
              <div className="absolute top-12 right-0 w-72 rounded-2xl overflow-hidden z-50"
                style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(14,165,233,0.15)", backdropFilter: "blur(20px)" }}>
                <button onClick={() => { setSearchOpen(false); navigate("/search"); }}
                  className="w-full text-center px-4 py-3 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all rounded-2xl">
                  Browse & filter all movies →
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button onClick={toggleTheme}
            className="w-9 h-9 hidden md:flex items-center justify-center rounded-full hover:bg-white/8 transition-all text-slate-400 hover:text-white"
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}>
            {theme === "dark"
              ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z"/></svg>
              : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            }
          </button>

          {/* Notifications */}
          <div className="relative">
            <button onClick={handleOpenNotifs}
              className="w-9 h-9 hidden md:flex items-center justify-center rounded-full hover:bg-white/8 transition-all text-slate-400 hover:text-white relative">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse" style={{ background: "#0ea5e9" }} />
              )}
            </button>
            {showNotifs && user && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                <div
                  className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden z-50 max-h-[400px] flex flex-col"
                  style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(14,165,233,0.15)", backdropFilter: "blur(20px)", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}
                >
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
                    <p className="text-sm font-semibold">Notifications</p>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && <span className="text-xs text-[#0ea5e9] bg-[#0ea5e9]/10 px-2 py-0.5 rounded-full">{unreadCount} new</span>}
                      {notifications.length > 0 && <button onClick={handleClearNotifs} className="text-xs text-slate-500 hover:text-[#0ea5e9] transition-colors">Clear</button>}
                    </div>
                  </div>
                  <div className="overflow-y-auto">
                    {notifications.length === 0
                      ? <div className="px-4 py-8 text-center text-slate-500 text-sm">No notifications</div>
                      : notifications.map(n => (
                        <div key={n._id}
                          onClick={() => { if (n.link) { navigate(n.link); setShowNotifs(false); } }}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-all border-b border-white/5 last:border-0 cursor-pointer ${!n.read ? "bg-white/[0.02]" : ""}`}>
                          <span className="text-xl shrink-0">{n.icon || "🔔"}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed ${n.read ? "text-slate-400" : "text-slate-200"}`}>{n.text}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
                          </div>
                          {!n.read && <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: "#0ea5e9" }} />}
                        </div>
                      ))
                    }
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/8 transition-all text-slate-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen
              ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            }
          </button>

          {/* User Avatar */}
          {user ? (
            <div className="relative">
              <div
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
                className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-110 transition-all select-none text-white"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)", boxShadow: "0 0 14px rgba(14,165,233,0.4)" }}
              >
                {user.avatarUrl ? (
                  <img
                    src={`${API_BASE_URL.replace("/api", "")}${user.avatarUrl}?v=${user._id}`}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  user.name?.charAt(0).toUpperCase()
                )}
              </div>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div
                    className="absolute right-0 top-12 w-52 rounded-2xl overflow-hidden z-50"
                    style={{ background: "rgba(8,14,28,0.97)", border: "1px solid rgba(14,165,233,0.15)", backdropFilter: "blur(20px)", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}
                  >
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button onClick={() => { navigate("/profile"); setShowUserMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#0ea5e9]/8 hover:text-white transition-all flex items-center gap-2.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      Profile
                    </button>
                    <button onClick={() => { navigate("/watchlist"); setShowUserMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#0ea5e9]/8 hover:text-white transition-all flex items-center gap-2.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                      Watchlist
                    </button>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center gap-2.5 border-t border-white/5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 text-white"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", boxShadow: "0 0 14px rgba(14,165,233,0.3)" }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{ background: "rgba(6,12,24,0.98)", borderColor: "rgba(14,165,233,0.15)", backdropFilter: "blur(20px)" }}
        >
          <div className="px-6 py-4 space-y-0.5">
            {[
              { label: "Home", path: "/" },
              { label: "TV Shows", path: "/tv" },
              { label: "Discover", path: "/search" },
              { label: "Actors", path: "/actors" },
              { label: "Calendar", path: "/calendar" },
              { label: "Action", path: "/genre/action" },
              { label: "Comedy", path: "/genre/comedy" },
              { label: "Horror", path: "/genre/horror" },
              { label: "Sci-Fi", path: "/genre/sci-fi" },
              { label: "Bollywood", path: "/genre/bollywood" },
              { label: "Watchlist", path: "/watchlist" },
            ].map(item => (
              <button key={item.path}
                onClick={() => { navigate(item.path); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white rounded-xl transition-all hover:bg-[#0ea5e9]/8">
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { navigate("/ai"); setMenuOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all"
              style={{ color: "#7dd3fc", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)" }}
            >
              ✦ AI Picks
            </button>
            {!user ? (
              <button onClick={() => { navigate("/login"); setMenuOpen(false); }}
                className="w-full mt-2 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}>
                Sign In
              </button>
            ) : (
              <div className="pt-2 border-t border-white/5 space-y-0.5">
                <button onClick={() => { navigate("/profile"); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">Profile</button>
                <button onClick={() => { logoutUser(); setMenuOpen(false); navigate("/"); }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
