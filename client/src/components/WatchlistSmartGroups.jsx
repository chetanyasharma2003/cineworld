import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function WatchlistSmartGroups({ movies }) {
  const [groups, setGroups] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);
  const navigate = useNavigate();

  if (!movies?.length || movies.length < 4) return null;

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.post("/ai/watchlist-group");
      setGroups(res.data.groups || null);
      if (res.data.groups?.length) setActiveGroup(0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setDone(true);
    }
  };

  if (!done && !loading) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center justify-between gap-4"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(229,9,20,0.06))",
          border: "1px solid rgba(139,92,246,0.2)",
        }}
      >
        <div>
          <p className="text-sm font-bold text-white">✦ Smart Mood Groups</p>
          <p className="text-xs text-gray-500 mt-0.5">Let AI organise your watchlist into curated vibes</p>
        </div>
        <button
          onClick={load}
          className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(229,9,20,0.3))",
            border: "1px solid rgba(139,92,246,0.4)",
            color: "#c4b5fd",
          }}
        >
          Organise
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center gap-3"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(229,9,20,0.06))",
          border: "1px solid rgba(139,92,246,0.2)",
        }}
      >
        <span className="text-purple-400 animate-spin text-lg">✦</span>
        <div>
          <p className="text-sm font-semibold text-white">AI is curating your vibes...</p>
          <p className="text-xs text-gray-500 mt-0.5">Grouping {movies.length} movies into mood categories</p>
        </div>
      </div>
    );
  }

  if (!groups?.length) return null;

  const movieMap = {};
  movies.forEach(m => { movieMap[m.id] = m; });

  const current = groups[activeGroup];
  const groupMovies = (current?.movieIds || []).map(id => movieMap[id]).filter(Boolean);

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(229,9,20,0.06))",
        border: "1px solid rgba(139,92,246,0.2)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-purple-400">✦</span>
        <p className="text-xs font-bold uppercase tracking-wider text-purple-400">Smart Mood Groups</p>
      </div>

      {/* Group tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {groups.map((g, i) => (
          <button
            key={i}
            onClick={() => setActiveGroup(i)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={i === activeGroup ? {
              background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(229,9,20,0.3))",
              border: "1px solid rgba(139,92,246,0.5)",
              color: "#e9d5ff",
            } : {
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#9ca3af",
            }}
          >
            <span>{g.emoji}</span> {g.name}
          </button>
        ))}
      </div>

      {/* Description */}
      {current?.description && (
        <p className="text-xs text-gray-500 italic">{current.description}</p>
      )}

      {/* Movie row */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {groupMovies.length > 0 ? groupMovies.map(m => (
          <div
            key={m.id}
            onClick={() => navigate(`/movie/${m.id}`)}
            className="shrink-0 cursor-pointer group"
          >
            <div className="w-16 rounded-lg overflow-hidden ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all group-hover:scale-105">
              <img
                src={
                  m.poster_path
                    ? `https://image.tmdb.org/t/p/w92${m.poster_path}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.title)}&background=333&color=fff&size=92`
                }
                alt={m.title}
                className="w-full aspect-[2/3] object-cover"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1 w-16 truncate text-center">{m.title}</p>
          </div>
        )) : (
          <p className="text-xs text-gray-600">No movies in this group</p>
        )}
      </div>
    </div>
  );
}
