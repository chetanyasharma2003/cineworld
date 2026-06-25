import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { tmdbGet } from "../lib/tmdb";

async function searchTMDB(title, year) {
  const strategies = [
    title,
    title.includes(":") ? title.split(":")[0].trim() : null,
    title.split(" ").slice(0, 4).join(" "),
  ].filter(Boolean);

  for (const q of strategies) {
    try {
      const data = await tmdbGet(`/search/movie?query=${encodeURIComponent(q)}&page=1`);
      const results = (data.results || []).filter(m => m.poster_path);
      if (!results.length) continue;
      if (year) {
        const match = results.find(m => m.release_date?.startsWith(String(year)));
        if (match) return match;
      }
      return results[0];
    } catch {}
  }
  return null;
}

export default function AISimilarMovies({ movie }) {
  const [recs, setRecs] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const reqRef = useRef(0);

  if (!movie?.title) return null;

  const load = async () => {
    setLoading(true);
    setRecs([]);
    setCards([]);
    const reqId = ++reqRef.current;

    try {
      const res = await api.post("/ai/similar", { movie });
      const list = res.data.recommendations || [];
      if (reqId !== reqRef.current) return;
      setRecs(list);
      setDone(true);

      // Progressive TMDB resolution
      list.forEach(async (rec, idx) => {
        const tmdbMovie = await searchTMDB(rec.searchTitle || rec.title, rec.year);
        if (reqId !== reqRef.current) return;
        if (tmdbMovie) {
          setCards(prev => {
            const next = [...prev];
            next[idx] = { ...tmdbMovie, _aiReason: rec.reason };
            return next;
          });
        }
      });
    } catch {
      setDone(true);
    } finally {
      if (reqId === reqRef.current) setLoading(false);
    }
  };

  const visibleCards = cards.filter(Boolean);

  if (!done && !loading) {
    return (
      <button
        onClick={load}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
        style={{
          background: "linear-gradient(135deg, rgba(229,9,20,0.15), rgba(139,92,246,0.15))",
          border: "1px solid rgba(229,9,20,0.3)",
          color: "#f87171",
        }}
      >
        <span>✦</span> Find Similar But Different Movies
      </button>
    );
  }

  if (loading && visibleCards.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-red-400 animate-spin">✦</span>
          <p className="text-sm text-red-400 font-semibold">Finding hidden gems...</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="min-w-[130px] h-[200px] rounded-xl bg-white/5 animate-pulse shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!visibleCards.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-red-400">✦</span>
        <h3 className="text-base font-bold">Similar But Different</h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: "rgba(229,9,20,0.15)", border: "1px solid rgba(229,9,20,0.3)", color: "#f87171" }}
        >
          AI Curated
        </span>
        {loading && <span className="text-xs text-gray-500 animate-pulse ml-auto">Loading more...</span>}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
        {visibleCards.map((m, i) => (
          <div
            key={m.id || i}
            className="min-w-[130px] max-w-[130px] shrink-0 group cursor-pointer"
            onClick={() => navigate(`/movie/${m.id}`)}
            style={{ animation: `fadeUp 0.4s ease ${i * 0.07}s both` }}
          >
            <div className="rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-red-500/50 transition-all group-hover:scale-105 duration-200">
              <img
                src={`https://image.tmdb.org/t/p/w300${m.poster_path}`}
                alt={m.title}
                className="w-full aspect-[2/3] object-cover"
              />
            </div>
            <p className="text-xs font-semibold mt-1.5 line-clamp-1 text-gray-200">{m.title}</p>
            {m._aiReason && (
              <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 leading-tight">{m._aiReason}</p>
            )}
          </div>
        ))}
      </div>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
