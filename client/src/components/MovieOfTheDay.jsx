import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { tmdbGet } from "../lib/tmdb";

// Pick a deterministic movie per day using date as seed
function getDailyIndex(total) {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return seed % total;
}

export default function MovieOfTheDay() {
  const [movie, setMovie] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cacheKey = "motd_" + new Date().toDateString();
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setMovie(JSON.parse(cached)); return; }

    const fetch_ = async () => {
      try {
        const data = await tmdbGet("/discover/movie", { sort_by: "vote_average.desc", "vote_count.gte": 5000, page: 1 });
        const results = (data.results || []).filter(m => m.backdrop_path && m.poster_path);
        if (!results.length) return;
        const pick = results[getDailyIndex(results.length)];
        sessionStorage.setItem(cacheKey, JSON.stringify(pick));
        setMovie(pick);
      } catch {}
    };
    fetch_();
  }, []);

  if (!movie) return null;

  const year = movie.release_date?.split("-")[0];
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="mx-4 md:mx-8 my-4 rounded-2xl overflow-hidden relative group cursor-pointer"
      onClick={() => navigate(`/movie/${movie.id}`)}>

      {/* Background */}
      <img
        src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
        alt={movie.title}
        className="w-full h-48 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center px-6 md:px-10">
        <div className="max-w-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-yellow-500 text-black tracking-wider uppercase">
              🎬 Movie of the Day
            </span>
            <span className="text-xs text-gray-400">{today}</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black leading-tight mb-1">{movie.title}</h2>
          <div className="flex items-center gap-3 text-sm text-gray-300 mb-3">
            <span className="text-yellow-400 font-bold">★ {movie.vote_average?.toFixed(1)}</span>
            <span className="text-gray-600">•</span>
            <span>{year}</span>
          </div>
          <p className="text-gray-300 text-xs md:text-sm line-clamp-2 leading-relaxed">
            {movie.overview}
          </p>
        </div>
      </div>

      {/* Play button */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 opacity-0 group-hover:opacity-100 transition-all group-hover:scale-110">
        <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}
