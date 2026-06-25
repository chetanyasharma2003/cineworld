import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";
import { tmdbGet } from "../lib/tmdb";

const MOOD_CHIPS = [
  { label: "Date Night 💕",        mood: "romantic heartwarming movies perfect for a date night" },
  { label: "Adrenaline Rush 💥",   mood: "high-octane action packed thrillers with non-stop excitement" },
  { label: "Need a Good Cry 😢",   mood: "emotional tearjerker dramas that will make me cry" },
  { label: "Chill Vibes 😌",       mood: "cozy relaxing feel-good movies to unwind" },
  { label: "Family Night 👨‍👩‍👧",    mood: "fun family friendly movies for all ages" },
  { label: "Mind-Bending 🌀",      mood: "mind-bending psychological sci-fi thriller with a twist" },
  { label: "Laugh Out Loud 😂",    mood: "hilarious comedy movies that will have me in tears laughing" },
  { label: "Classic Cinema 🎭",    mood: "timeless critically acclaimed masterpieces of cinema" },
  { label: "Late Night Horror 🔦", mood: "genuinely scary horror movies for late night watching" },
  { label: "Feel Good 🌟",         mood: "uplifting inspiring movies that leave me feeling great" },
  { label: "Epic Adventure 🗺️",   mood: "epic grand-scale adventure with stunning world-building" },
  { label: "Hidden Gem 💎",        mood: "underrated hidden gem films not many people have seen" },
];

async function searchTMDB(title, year) {
  const strategies = [
    title,
    title.split(":")[0].trim(),
    title.split(" ").slice(0, 4).join(" "),
  ];
  for (const q of [...new Set(strategies)]) {
    try {
      const params = { query: q, page: 1 };
      if (year) params.year = year;
      const data = await tmdbGet("/search/movie", params);
      const results = data.results || [];
      const exact = results.find(m => m.poster_path && m.title?.toLowerCase() === title.toLowerCase());
      if (exact) return exact;
      const withPoster = results.find(m => m.poster_path);
      if (withPoster) return withPoster;
    } catch { /* ignore */ }
  }
  return null;
}

function MovieCard({ movie, reason, navigate }) {
  return (
    <div
      onClick={() => navigate(`/movie/${movie.id}`)}
      className="group cursor-pointer rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl hover:shadow-purple-900/40"
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="relative">
        <img
          src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
          alt={movie.title}
          className="w-full aspect-[2/3] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-900/60">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {movie.vote_average > 0 && (
          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-yellow-400 font-bold">
            ★ {movie.vote_average?.toFixed(1)}
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-gray-300">
          {movie.release_date?.split("-")[0]}
        </div>
      </div>
      <div className="p-3">
        <p className="font-bold text-sm line-clamp-1 mb-1 group-hover:text-purple-300 transition-colors">{movie.title}</p>
        <div className="flex items-start gap-1.5">
          <span className="text-purple-400 text-xs mt-0.5 shrink-0">✦</span>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{reason}</p>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="skeleton aspect-[2/3] w-full" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}

export default function AIMood() {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState("");
  const [customMood, setCustomMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const [totalExpected, setTotalExpected] = useState(0);
  const [usedMood, setUsedMood] = useState("");
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const handleGetPicks = async (moodText) => {
    const mood = (moodText || customMood).trim();
    if (!mood || loading) return;

    const myRequestId = ++requestIdRef.current;
    setLoading(true);
    setMovies([]);
    setTotalExpected(0);
    setError("");
    setUsedMood(mood);

    try {
      const res = await api.post("/ai/mood", { mood });
      const recs = res.data.recommendations || [];
      if (!recs.length) { setError("No recommendations returned. Try a different mood."); setLoading(false); return; }

      setTotalExpected(recs.length);

      let resolved = 0;
      await Promise.all(
        recs.map(async (rec, i) => {
          const tmdbMovie = await searchTMDB(rec.searchTitle || rec.title, rec.year);
          if (myRequestId !== requestIdRef.current) return;
          if (tmdbMovie) {
            resolved++;
            setMovies(prev => [...prev, { ...tmdbMovie, aiReason: rec.reason, _idx: i }]);
          }
        })
      );
      // Align totalExpected with actual found count so skeletons clear
      if (myRequestId === requestIdRef.current) setTotalExpected(resolved);
    } catch (err) {
      if (myRequestId !== requestIdRef.current) return;
      const status = err.response?.status;
      const msg = err.response?.data?.error || "";
      if (status === 429) {
        setError("Slow down! Too many requests. Wait a few seconds and try again.");
      } else if (msg.includes("not configured")) {
        setError("Add GROQ_API_KEY to server/.env to enable AI features.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      if (myRequestId === requestIdRef.current) setLoading(false);
    }
  };

  const lastClickRef = useRef(0);
  const handleChipClick = (chip) => {
    const now = Date.now();
    if (now - lastClickRef.current < 2000) return; // 2s cooldown between chip clicks
    lastClickRef.current = now;
    setSelectedMood(chip.mood);
    setCustomMood("");
    handleGetPicks(chip.mood);
  };

  const sortedMovies = [...movies].sort((a, b) => (a._idx ?? 0) - (b._idx ?? 0));
  const stillLoading = loading || (totalExpected > 0 && movies.length < totalExpected);

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "#050508" }}>

      {/* ── Animated Background ───────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Large slow-moving orbs */}
        <div
          className="absolute rounded-full opacity-20"
          style={{
            width: "700px", height: "700px",
            top: "-200px", left: "-200px",
            background: "radial-gradient(circle, #7c3aed, transparent 70%)",
            animation: "orbFloat1 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full opacity-15"
          style={{
            width: "600px", height: "600px",
            top: "10%", right: "-150px",
            background: "radial-gradient(circle, #dc2626, transparent 70%)",
            animation: "orbFloat2 22s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full opacity-10"
          style={{
            width: "500px", height: "500px",
            bottom: "5%", left: "30%",
            background: "radial-gradient(circle, #9333ea, transparent 70%)",
            animation: "orbFloat3 26s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full opacity-10"
          style={{
            width: "400px", height: "400px",
            bottom: "20%", right: "10%",
            background: "radial-gradient(circle, #be185d, transparent 70%)",
            animation: "orbFloat1 20s ease-in-out infinite reverse",
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />
      </div>

      {/* CSS keyframes injected inline */}
      <style>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(60px, 40px) scale(1.08); }
          66% { transform: translate(-30px, 60px) scale(0.95); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, 30px) scale(1.05); }
          66% { transform: translate(40px, -50px) scale(1.1); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.06); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-appear {
          animation: fadeSlideUp 0.4s ease forwards;
        }
      `}</style>

      <Navbar />

      <div className="relative z-10 pt-24 px-6 md:px-12 pb-20 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5 border"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(220,38,38,0.2))",
              borderColor: "rgba(124,58,237,0.4)",
              color: "#c084fc",
            }}>
            <span className="animate-pulse">✦</span> Powered by Groq AI
          </div>

          {/* Title with gradient glow */}
          <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight">
            What's your{" "}
            <span
              className="relative inline-block"
              style={{
                background: "linear-gradient(135deg, #a855f7, #ec4899, #ef4444)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 30px rgba(168,85,247,0.5))",
              }}
            >
              vibe
            </span>{" "}
            tonight?
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Pick a mood or describe what you want —{" "}
            <span className="text-gray-400">AI picks the perfect movies instantly.</span>
          </p>
        </div>

        {/* Mood Chips */}
        <div className="flex flex-wrap gap-2.5 justify-center mb-8">
          {MOOD_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleChipClick(chip)}
              disabled={loading}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed"
              style={selectedMood === chip.mood ? {
                background: "linear-gradient(135deg, #7c3aed, #dc2626)",
                borderColor: "rgba(124,58,237,0.6)",
                color: "white",
                boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                transform: "scale(1.06)",
              } : {
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.1)",
                color: "#d1d5db",
              }}
              onMouseEnter={e => {
                if (selectedMood !== chip.mood) {
                  e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)";
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.background = "rgba(124,58,237,0.1)";
                }
              }}
              onMouseLeave={e => {
                if (selectedMood !== chip.mood) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "#d1d5db";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex gap-2 p-1.5 rounded-2xl border"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.1)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            }}>
            <input
              type="text"
              placeholder='Describe exactly what you want... e.g. "movies like The Hangover"'
              value={customMood}
              onChange={e => { setCustomMood(e.target.value); setSelectedMood(""); }}
              onKeyDown={e => e.key === "Enter" && handleGetPicks()}
              className="flex-1 px-4 py-3 bg-transparent text-sm outline-none placeholder-gray-600 text-white"
            />
            <button
              onClick={() => handleGetPicks()}
              disabled={loading || !customMood.trim()}
              className="px-6 py-3 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #dc2626)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                color: "white",
              }}
            >
              {loading
                ? <span className="animate-spin inline-block">✦</span>
                : <span className="flex items-center gap-1.5">Get Picks <span>✦</span></span>
              }
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-md mx-auto mb-8 px-4 py-3 rounded-xl text-sm text-center border"
            style={{ background: "rgba(220,38,38,0.1)", borderColor: "rgba(220,38,38,0.2)", color: "#f87171" }}>
            {error}
          </div>
        )}

        {/* Results */}
        {(sortedMovies.length > 0 || stillLoading) && (
          <div>
            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)" }} />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold"
                style={{ background: "rgba(124,58,237,0.1)", borderColor: "rgba(124,58,237,0.25)", color: "#c084fc" }}>
                {stillLoading && <span className="animate-spin">✦</span>}
                {stillLoading
                  ? `Discovering ${sortedMovies.length} of ${totalExpected || "?"} picks...`
                  : `✦ ${sortedMovies.length} picks for "${usedMood.slice(0, 35)}${usedMood.length > 35 ? "..." : ""}"`}
              </div>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(220,38,38,0.3), transparent)" }} />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sortedMovies.map((movie, i) => (
                <div key={movie.id} className="card-appear" style={{ animationDelay: `${i * 50}ms` }}>
                  <MovieCard movie={movie} reason={movie.aiReason} navigate={navigate} index={i} />
                </div>
              ))}
              {stillLoading && Array.from({ length: Math.max(0, (totalExpected || 5) - sortedMovies.length) }).map((_, i) => (
                <SkeletonCard key={`sk-${i}`} />
              ))}
            </div>

            {/* Refresh */}
            {!stillLoading && sortedMovies.length > 0 && (
              <div className="text-center mt-10">
                <button
                  onClick={() => handleGetPicks(usedMood)}
                  className="px-6 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-all border border-white/10 hover:border-white/20 hover:bg-white/5"
                >
                  ↻ Regenerate picks
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedMovies.length === 0 && totalExpected === 0 && !error && (
          <div className="text-center py-20">
            {/* Glowing film icon */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-40"
                style={{ background: "radial-gradient(circle, #7c3aed, #dc2626)" }} />
              <div className="relative w-20 h-20 mx-auto rounded-2xl flex items-center justify-center border text-4xl"
                style={{ background: "rgba(124,58,237,0.15)", borderColor: "rgba(124,58,237,0.3)" }}>
                🎬
              </div>
            </div>
            <p className="font-bold text-gray-400 mb-1 text-lg">Choose your vibe above</p>
            <p className="text-xs text-gray-600">AI will instantly find 8-10 perfect movies for your mood</p>
          </div>
        )}
      </div>
    </div>
  );
}
