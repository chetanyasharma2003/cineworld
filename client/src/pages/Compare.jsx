import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";
import DynamicBg from "../components/DynamicBg";

import { tmdbGet } from "../lib/tmdb";
const tmdb = (url) => tmdbGet(url);

function useMovieSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await tmdb(`/search/movie?query=${encodeURIComponent(q)}&page=1`);
      setResults((data.results || []).filter(m => m.poster_path).slice(0, 6));
    } catch { /* ignore */ }
    finally { setSearching(false); }
  }, []);

  return { query, setQuery, results, setResults, searching, search };
}

async function fetchFullMovie(id) {
  const [detail, credits] = await Promise.all([
    tmdb(`/movie/${id}?append_to_response=release_dates`),
    tmdb(`/movie/${id}/credits`),
  ]);
  const director = credits.crew?.find(c => c.job === "Director");
  const cast = credits.cast?.slice(0, 5).map(c => c.name).join(", ");
  return { ...detail, director: director?.name, cast };
}

function SearchBox({ label, selected, onSelect }) {
  const { query, setQuery, results, setResults, searching, search } = useMovieSearch();

  const pick = (movie) => {
    onSelect(movie);
    setQuery("");
    setResults([]);
  };

  if (selected) {
    return (
      <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 group">
        <img
          src={`https://image.tmdb.org/t/p/w500${selected.poster_path}`}
          alt={selected.title}
          className="w-full h-72 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="font-black text-lg leading-tight">{selected.title}</p>
          <p className="text-gray-400 text-sm">{selected.release_date?.split("-")[0]}</p>
        </div>
        <button
          onClick={() => onSelect(null)}
          className="absolute top-3 right-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all text-sm"
        >✕</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="rounded-2xl border-2 border-dashed border-white/20 p-6 flex flex-col gap-3 hover:border-red-500/40 transition-all">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
        <input
          type="text"
          placeholder="Search a movie..."
          value={query}
          onChange={e => search(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/50 placeholder-gray-600"
        />
        {searching && <p className="text-xs text-gray-500">Searching...</p>}
        {results.length > 0 && (
          <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
            {results.map(m => (
              <button key={m.id} onClick={() => pick(m)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-all text-left">
                <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                  className="w-8 h-12 rounded object-cover shrink-0" alt={m.title} />
                <div>
                  <p className="text-sm font-semibold line-clamp-1">{m.title}</p>
                  <p className="text-xs text-gray-500">{m.release_date?.split("-")[0]} · ★ {m.vote_average?.toFixed(1)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const STATS = [
  { key: "vote_average",  label: "TMDB Rating",    fmt: v => `★ ${v?.toFixed(1)}`,        better: "higher" },
  { key: "vote_count",    label: "Total Votes",     fmt: v => v?.toLocaleString(),          better: "higher" },
  { key: "popularity",    label: "Popularity",      fmt: v => v?.toFixed(0),                better: "higher" },
  { key: "budget",        label: "Budget",          fmt: v => v ? `$${(v/1e6).toFixed(1)}M` : "N/A", better: "higher" },
  { key: "revenue",       label: "Box Office",      fmt: v => v ? `$${(v/1e6).toFixed(1)}M` : "N/A", better: "higher" },
  { key: "runtime",       label: "Runtime",         fmt: v => v ? `${v} min` : "N/A",      better: "none" },
  { key: "release_date",  label: "Release Year",    fmt: v => v?.split("-")[0],             better: "none" },
  { key: "director",      label: "Director",        fmt: v => v || "—",                     better: "none" },
  { key: "cast",          label: "Top Cast",        fmt: v => v || "—",                     better: "none" },
  { key: "original_language", label: "Language",   fmt: v => v?.toUpperCase() || "—",      better: "none" },
];

function StatRow({ label, v1, v2, fmt, better }) {
  const n1 = parseFloat(v1), n2 = parseFloat(v2);
  const win1 = better === "higher" && !isNaN(n1) && !isNaN(n2) && n1 > n2;
  const win2 = better === "higher" && !isNaN(n1) && !isNaN(n2) && n2 > n1;

  return (
    <div className="grid grid-cols-3 items-center gap-2 py-3 border-b border-white/5">
      <div className={`text-sm font-medium text-right pr-2 ${win1 ? "text-green-400" : "text-gray-200"}`}>
        {fmt(v1)} {win1 && "✓"}
      </div>
      <div className="text-xs text-gray-500 text-center font-semibold uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-medium text-left pl-2 ${win2 ? "text-green-400" : "text-gray-200"}`}>
        {win2 && "✓ "}{fmt(v2)}
      </div>
    </div>
  );
}

export default function Compare() {
  const navigate = useNavigate();
  const [movieA, setMovieA] = useState(null);
  const [movieB, setMovieB] = useState(null);
  const [fullA,  setFullA]  = useState(null);
  const [fullB,  setFullB]  = useState(null);

  const [aiVerdict, setAiVerdict] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleSelectA = async (m) => {
    setMovieA(m); setFullA(null); setAiVerdict(null);
    if (m) { try { const d = await fetchFullMovie(m.id); setFullA(d); } catch { setMovieA(null); } }
  };
  const handleSelectB = async (m) => {
    setMovieB(m); setFullB(null); setAiVerdict(null);
    if (m) { try { const d = await fetchFullMovie(m.id); setFullB(d); } catch { setMovieB(null); } }
  };

  const handleAIVerdict = async () => {
    if (!fullA || !fullB) return;
    setAiLoading(true);
    setAiError("");
    setAiVerdict(null);
    try {
      const res = await api.post("/ai/compare", { movieA: fullA, movieB: fullB });
      setAiVerdict(res.data.verdict);
    } catch (err) {
      const msg = err.response?.data?.error || "";
      setAiError(msg.includes("not configured") ? "AI features require GROQ_API_KEY on the server." : "AI analysis failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const canCompare = fullA && fullB;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white relative overflow-hidden">
      <DynamicBg variant="red" intensity="subtle" />
      <Navbar />
      <div className="relative z-10 pt-24 px-6 md:px-12 pb-16 max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black mb-1">⚔️ Movie Comparison</h1>
          <p className="text-gray-500 text-sm">Pick two movies and compare them head-to-head</p>
        </div>

        {/* Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <SearchBox label="Movie A" selected={movieA} onSelect={handleSelectA} />
          <SearchBox label="Movie B" selected={movieB} onSelect={handleSelectB} />
        </div>

        {/* VS divider */}
        {(movieA || movieB) && (
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-2xl font-black text-red-500">VS</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        )}

        {/* Comparison Table */}
        {canCompare && (
          <div className="bg-white/3 rounded-2xl ring-1 ring-white/10 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 gap-2 p-4 bg-white/5 border-b border-white/10">
              <button onClick={() => navigate(`/movie/${fullA.id}`)}
                className="text-center hover:text-red-400 transition-colors">
                <p className="font-black text-sm line-clamp-2">{fullA.title}</p>
                <p className="text-xs text-gray-500">{fullA.release_date?.split("-")[0]}</p>
              </button>
              <div className="text-center text-xs text-gray-600 font-bold uppercase tracking-wider self-center">Stats</div>
              <button onClick={() => navigate(`/movie/${fullB.id}`)}
                className="text-center hover:text-red-400 transition-colors">
                <p className="font-black text-sm line-clamp-2">{fullB.title}</p>
                <p className="text-xs text-gray-500">{fullB.release_date?.split("-")[0]}</p>
              </button>
            </div>

            {/* Rows */}
            <div className="px-4">
              {STATS.map(s => (
                <StatRow
                  key={s.key}
                  label={s.label}
                  v1={fullA[s.key]}
                  v2={fullB[s.key]}
                  fmt={s.fmt}
                  better={s.better}
                />
              ))}
            </div>

            {/* Genre comparison */}
            <div className="grid grid-cols-3 gap-2 px-4 py-3 border-t border-white/5">
              <div className="flex flex-wrap gap-1 justify-end">
                {fullA.genres?.map(g => (
                  <span key={g.id} className="text-xs px-2 py-0.5 rounded-full bg-red-600/20 text-red-400">{g.name}</span>
                ))}
              </div>
              <div className="text-xs text-gray-500 text-center font-semibold uppercase tracking-wider self-center">Genres</div>
              <div className="flex flex-wrap gap-1">
                {fullB.genres?.map(g => (
                  <span key={g.id} className="text-xs px-2 py-0.5 rounded-full bg-red-600/20 text-red-400">{g.name}</span>
                ))}
              </div>
            </div>

            {/* Overview */}
            <div className="grid grid-cols-2 gap-4 p-4 border-t border-white/5">
              <div>
                <p className="text-xs text-gray-600 mb-1 uppercase tracking-wider">Overview</p>
                <p className="text-xs text-gray-400 line-clamp-4 leading-relaxed">{fullA.overview}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1 uppercase tracking-wider">Overview</p>
                <p className="text-xs text-gray-400 line-clamp-4 leading-relaxed">{fullB.overview}</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Verdict */}
        {canCompare && (
          <div className="mt-6">
            {!aiVerdict && !aiLoading && (
              <button
                onClick={handleAIVerdict}
                className="w-full py-3 bg-gradient-to-r from-purple-600/20 to-red-600/20 hover:from-purple-600/30 hover:to-red-600/30 border border-purple-500/30 rounded-2xl text-sm font-semibold text-purple-300 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <span>✦</span> Get AI Analysis
              </button>
            )}
            {aiLoading && (
              <div className="w-full py-4 flex items-center justify-center gap-2 text-purple-400 text-sm">
                <span className="animate-spin">✦</span> Claude is analysing both films...
              </div>
            )}
            {aiError && (
              <p className="text-center text-red-400 text-xs py-3">{aiError}</p>
            )}
            {aiVerdict && (
              <div className="bg-gradient-to-br from-purple-900/20 to-red-900/20 border border-purple-500/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-purple-400">✦</span>
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-400">AI Verdict</p>
                </div>

                {/* Winner Banner */}
                {aiVerdict.winner !== "tie" ? (
                  <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <p className="text-sm font-bold text-green-400">
                        {aiVerdict.winner === "A" ? fullA.title : fullB.title} wins
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{aiVerdict.winnerReason}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <span className="text-2xl">🤝</span>
                    <p className="text-sm font-bold text-yellow-400">It's a tie!</p>
                  </div>
                )}

                {/* Verdict text */}
                <p className="text-sm text-gray-300 leading-relaxed">{aiVerdict.verdict}</p>

                {/* Best For */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="px-3 py-2.5 bg-white/5 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Best for</p>
                    <p className="text-xs font-semibold text-white line-clamp-2">{aiVerdict.bestForA}</p>
                    <p className="text-xs text-red-400 mt-1 font-medium line-clamp-1">{fullA.title}</p>
                  </div>
                  <div className="px-3 py-2.5 bg-white/5 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Best for</p>
                    <p className="text-xs font-semibold text-white line-clamp-2">{aiVerdict.bestForB}</p>
                    <p className="text-xs text-red-400 mt-1 font-medium line-clamp-1">{fullB.title}</p>
                  </div>
                </div>

                {aiVerdict.funFact && (
                  <p className="text-xs text-gray-500 italic border-t border-white/5 pt-3">
                    💡 {aiVerdict.funFact}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {!movieA && !movieB && (
          <div className="text-center py-20 text-gray-600">
            <p className="text-5xl mb-4">🎬</p>
            <p className="font-semibold">Search for two movies above to compare them</p>
          </div>
        )}
      </div>
    </div>
  );
}
