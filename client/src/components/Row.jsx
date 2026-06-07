import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { imageUrl } from "../lib/api";

function Row({ title, movies, large = false }) {
  const navigate = useNavigate();
  const rowRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [showLeft, setShowLeft] = useState(false);

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    const amount = dir === "left" ? -el.offsetWidth * 0.75 : el.offsetWidth * 0.75;
    el.scrollBy({ left: amount, behavior: "smooth" });
    setTimeout(() => setShowLeft(el.scrollLeft > 10), 400);
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="group/row my-2 px-4 md:px-8">

      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        <button
          onClick={() => scroll("right")}
          className="text-xs text-red-400 hover:text-red-300 font-semibold opacity-0 group-hover/row:opacity-100 transition-all flex items-center gap-1"
        >
          See all <span>→</span>
        </button>
      </div>

      {/* Scroll Container */}
      <div className="relative">

        {/* Left Arrow */}
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-20 w-10 flex items-center justify-center bg-gradient-to-r from-[#0a0a0a] to-transparent opacity-0 group-hover/row:opacity-100 transition-all hover:from-black"
          >
            <span className="text-white text-xl font-bold">‹</span>
          </button>
        )}

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-20 w-10 flex items-center justify-center bg-gradient-to-l from-[#0a0a0a] to-transparent opacity-0 group-hover/row:opacity-100 transition-all hover:from-black"
        >
          <span className="text-white text-xl font-bold">›</span>
        </button>

        {/* Movies Strip */}
        <div
          ref={rowRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {movies.map((movie, index) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              large={large}
              index={index}
              isHovered={hoveredId === movie.id}
              onHover={setHoveredId}
              onClick={() => navigate(`/movie/${movie.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MovieCard({ movie, large, index, isHovered, onHover, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgSrc = large
    ? imageUrl(movie.backdrop_path || movie.poster_path, "w780")
    : imageUrl(movie.poster_path, "w300");

  const width = large ? "min-w-[280px] md:min-w-[320px]" : "min-w-[130px] md:min-w-[155px]";
  const height = large ? "h-[160px] md:h-[185px]" : "h-[195px] md:h-[235px]";

  return (
    <div
      className={`relative ${width} ${height} rounded-lg overflow-hidden cursor-pointer shrink-0 transition-all duration-300 ${isHovered ? "scale-110 z-10 shadow-2xl shadow-black/80" : "scale-100"}`}
      style={{ scrollSnapAlign: "start" }}
      onMouseEnter={() => onHover(movie.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
    >
      {/* Skeleton */}
      {!imgLoaded && <div className="absolute inset-0 skeleton rounded-lg" />}

      {/* Poster */}
      <img
        src={imgSrc}
        alt={movie.title}
        onLoad={() => setImgLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
      />

      {/* Hover Overlay */}
      <div className={`absolute inset-0 transition-all duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all">
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p className="text-xs font-semibold leading-tight line-clamp-1">{movie.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-yellow-400 text-xs">★ {movie.vote_average?.toFixed(1)}</span>
            <span className="text-gray-500 text-xs">•</span>
            <span className="text-gray-400 text-xs">{movie.release_date?.split("-")[0]}</span>
          </div>
        </div>
      </div>

      {/* Rank number for top 10 */}
      {index < 10 && (
        <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-red-600 rounded text-xs font-black flex items-center justify-center">
          {index + 1}
        </div>
      )}
    </div>
  );
}

export default Row;
