import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { imageUrl } from "../lib/api";

function Banner({ movies = [] }) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  const movie = movies[current];

  // Auto rotate every 7s
  useEffect(() => {
    if (movies.length === 0) return;
    const timer = setInterval(() => {
      setLoaded(false);
      setTimeout(() => setCurrent((prev) => (prev + 1) % Math.min(movies.length, 5)), 200);
    }, 7000);
    return () => clearInterval(timer);
  }, [movies]);

  useEffect(() => { setLoaded(false); }, [current]);

  if (!movie) return null;

  const year = movie.release_date?.split("-")[0];
  const rating = movie.vote_average?.toFixed(1);
  const handleWatch = () => navigate(`/movie/${movie.id}`);

  return (
    <div className="relative w-full h-screen overflow-hidden">

      {/* Background Image */}
      <img
        key={movie.id}
        src={imageUrl(movie.backdrop_path, "original")}
        alt={movie.title}
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="px-8 md:px-16 max-w-2xl pt-16">

          {/* Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold px-2.5 py-1 bg-red-600 rounded text-white tracking-wider uppercase">
              Featured
            </span>
            <span className="text-xs text-gray-400 font-medium">#{current + 1} in CineWorld Today</span>
          </div>

          {/* Title */}
          <h1 className={`text-5xl md:text-7xl font-black tracking-tight leading-none text-shadow-lg transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {movie.title}
          </h1>

          {/* Meta */}
          <div className={`flex items-center gap-3 mt-4 transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <span className="text-yellow-400 font-bold">★ {rating}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-300 text-sm">{year}</span>
            {movie.genre_ids?.slice(0, 2).map(id => (
              <span key={id} className="text-xs px-2 py-0.5 rounded border border-white/20 text-gray-300">{genreMap[id]}</span>
            ))}
          </div>

          {/* Overview */}
          <p className={`text-gray-300 text-sm md:text-base leading-relaxed mt-4 line-clamp-3 text-shadow transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {movie.overview}
          </p>

          {/* Buttons */}
          <div className={`flex gap-3 mt-6 transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <button
              onClick={handleWatch}
              className="flex items-center gap-2.5 px-7 py-3.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </button>
            <button
              onClick={handleWatch}
              className="flex items-center gap-2.5 px-7 py-3.5 glass text-white font-semibold text-sm rounded-lg hover:bg-white/15 transition-all hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-24 left-8 md:left-16 flex gap-2">
        {movies.slice(0, 5).map((_, i) => (
          <button
            key={i}
            onClick={() => { setLoaded(false); setCurrent(i); }}
            className={`h-1 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-red-500" : "w-4 bg-white/30 hover:bg-white/50"}`}
          />
        ))}
      </div>

      {/* Bottom fade into content */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </div>
  );
}

// TMDB genre IDs
const genreMap = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller",
  10752: "War", 37: "Western"
};

export default Banner;
