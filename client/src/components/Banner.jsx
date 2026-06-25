import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { imageUrl } from "../lib/api";
import CertBadge from "./CertBadge";

function Banner({ movies = [] }) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded]   = useState(false);
  const navigate              = useNavigate();

  const movie = movies[current];

  useEffect(() => {
    if (!movies.length) return;
    const timer = setInterval(() => {
      setLoaded(false);
      setTimeout(() => setCurrent(prev => (prev + 1) % Math.min(movies.length, 5)), 300);
    }, 8000);
    return () => clearInterval(timer);
  }, [movies]);

  useEffect(() => { setLoaded(false); }, [current]);

  if (!movie) return null;

  const year   = movie.release_date?.split("-")[0];
  const rating = movie.vote_average?.toFixed(1);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "92vh", minHeight: "600px" }}>

      {/* Backdrop */}
      <img
        key={movie.id}
        src={imageUrl(movie.backdrop_path, "original")}
        alt={movie.title}
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1200 ${loaded ? "opacity-60 scale-100" : "opacity-0 scale-105"}`}
        style={{ transitionDuration: "1200ms" }}
      />

      {/* Multi-layer gradients — navy blend */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(6,12,24,0.97) 0%, rgba(6,12,24,0.75) 45%, rgba(6,12,24,0.25) 100%)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(6,12,24,1) 0%, rgba(6,12,24,0.4) 40%, transparent 70%)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(6,12,24,0.5) 0%, transparent 20%)" }} />

      {/* Subtle teal glow top-left */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(14,165,233,0.12), transparent 70%)" }} />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="px-8 md:px-16 max-w-2xl pt-20">

          {/* Top badge */}
          <div className={`flex items-center gap-3 mb-5 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: "rgba(14,165,233,0.15)",
                border: "1px solid rgba(14,165,233,0.4)",
                color: "#38bdf8",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse" />
              Featured
            </div>
            <span className="text-xs text-slate-500">#{current + 1} Trending Now</span>
          </div>

          {/* Title */}
          <h1
            className={`font-black tracking-tight leading-none mb-4 transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: "#f1f5f9", textShadow: "0 4px 30px rgba(6,12,24,0.8)" }}
          >
            {movie.title}
          </h1>

          {/* Meta */}
          <div className={`flex items-center gap-3 mb-4 flex-wrap transition-all duration-700 delay-150 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            {rating && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold"
                style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", color: "#f59e0b" }}>
                ★ {rating}
              </div>
            )}
            <span className="text-slate-400 text-sm font-medium">{year}</span>
            {movie.genre_ids?.slice(0, 2).map(id => (
              <span key={id}
                className="text-xs px-2.5 py-1 rounded-lg font-medium"
                style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)", color: "#7dd3fc" }}>
                {genreMap[id]}
              </span>
            ))}
            {movie.certification && <CertBadge cert={movie.certification} size="lg" />}
          </div>

          {/* Overview */}
          <p className={`text-slate-400 text-sm md:text-base leading-relaxed mb-7 line-clamp-3 max-w-xl transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            {movie.overview}
          </p>

          {/* Buttons */}
          <div className={`flex items-center gap-3 transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            <button
              onClick={() => navigate(`/movie/${movie.id}`)}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                boxShadow: "0 0 24px rgba(14,165,233,0.4)",
              }}
            >
              <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24" style={{ width: "18px", height: "18px" }}>
                <path d="M8 5v14l11-7z"/>
              </svg>
              Watch Now
            </button>
            <button
              onClick={() => navigate(`/movie/${movie.id}`)}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm text-slate-200 transition-all hover:text-white hover:scale-105 active:scale-95"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-24 left-8 md:left-16 flex items-center gap-2">
        {movies.slice(0, 5).map((_, i) => (
          <button
            key={i}
            onClick={() => { setLoaded(false); setCurrent(i); }}
            className="rounded-full transition-all duration-400"
            style={i === current
              ? { width: "28px", height: "4px", background: "#0ea5e9", boxShadow: "0 0 8px rgba(14,165,233,0.8)" }
              : { width: "14px", height: "4px", background: "rgba(255,255,255,0.25)" }
            }
          />
        ))}
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: "linear-gradient(to top, #060c18, transparent)" }}
      />
    </div>
  );
}

const genreMap = {
  28:"Action", 12:"Adventure", 16:"Animation", 35:"Comedy",
  80:"Crime", 99:"Documentary", 18:"Drama", 10751:"Family",
  14:"Fantasy", 36:"History", 27:"Horror", 10402:"Music",
  9648:"Mystery", 10749:"Romance", 878:"Sci-Fi", 53:"Thriller",
  10752:"War", 37:"Western",
};

export default Banner;
