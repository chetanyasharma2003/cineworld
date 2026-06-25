import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { imageUrl } from "../lib/api";

function Row({ title, movies, large = false }) {
  const navigate  = useNavigate();
  const rowRef    = useRef(null);
  const [showLeft, setShowLeft] = useState(false);

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -el.offsetWidth * 0.75 : el.offsetWidth * 0.75, behavior: "smooth" });
    setTimeout(() => setShowLeft(el.scrollLeft > 10), 400);
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="group/row my-4 px-4 md:px-8">

      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Teal accent bar */}
          <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom, #0ea5e9, #0284c7)" }} />
          <h2 className="text-sm md:text-base font-bold text-white tracking-tight">{title}</h2>
        </div>
        <button
          onClick={() => scroll("right")}
          className="text-xs font-semibold opacity-0 group-hover/row:opacity-100 transition-all flex items-center gap-1"
          style={{ color: "#0ea5e9" }}
        >
          See all →
        </button>
      </div>

      {/* Scroll Container */}
      <div className="relative">
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-20 w-12 flex items-center justify-center rounded-l-xl opacity-0 group-hover/row:opacity-100 transition-all"
            style={{ background: "linear-gradient(to right, rgba(6,12,24,0.95), transparent)" }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "rgba(14,165,233,0.2)", border: "1px solid rgba(14,165,233,0.3)" }}>
              ‹
            </div>
          </button>
        )}

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-20 w-12 flex items-center justify-center rounded-r-xl opacity-0 group-hover/row:opacity-100 transition-all"
          style={{ background: "linear-gradient(to left, rgba(6,12,24,0.95), transparent)" }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: "rgba(14,165,233,0.2)", border: "1px solid rgba(14,165,233,0.3)" }}>
            ›
          </div>
        </button>

        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory" }}
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              large={large}
              onClick={() => navigate(movie._mediaType === "tv" ? `/tv/${movie.id}` : `/movie/${movie.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MovieCard({ movie, large, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgSrc = large
    ? imageUrl(movie.backdrop_path || movie.poster_path, "w780")
    : imageUrl(movie.poster_path, "w300");

  const imgW = large ? "min-w-[280px] md:min-w-[300px]" : "min-w-[130px] md:min-w-[148px]";
  const imgH = large ? "h-[165px]" : "h-[196px] md:h-[222px]";

  const rating = movie.vote_average;
  const ratingColor =
    rating >= 7.5 ? "#10b981" :
    rating >= 6   ? "#f59e0b" :
    rating > 0    ? "#ef4444" : null;

  return (
    <div
      className={`shrink-0 ${imgW} cursor-pointer group/card`}
      style={{ scrollSnapAlign: "start" }}
      onClick={onClick}
    >
      {/* Poster */}
      <div
        className={`relative ${imgH} rounded-xl overflow-hidden transition-all duration-300 group-hover/card:ring-2 group-hover/card:-translate-y-1`}
        style={{
          background: "var(--bg-card)",
          ringColor: "rgba(14,165,233,0.5)",
          boxShadow: "0 0 0 0 transparent",
        }}
      >
        <style>{`.group\\/card:hover .card-img { box-shadow: 0 0 0 2px rgba(14,165,233,0.5), 0 8px 24px rgba(6,12,24,0.8); }`}</style>

        {!imgLoaded && <div className="absolute inset-0 skeleton" />}

        <img
          src={imgSrc}
          alt={movie.title || movie.name}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 group-hover/card:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        />

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-200"
          style={{ background: "rgba(6,12,24,0.35)" }}>
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm"
            style={{ background: "rgba(14,165,233,0.85)", boxShadow: "0 0 20px rgba(14,165,233,0.6)" }}
          >
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>

        {/* Rating badge */}
        {ratingColor && (
          <div
            className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white backdrop-blur-sm"
            style={{ background: `${ratingColor}cc` }}
          >
            ★ {rating.toFixed(1)}
          </div>
        )}

        {/* AI reason badge (from AIMood / ForYou rows) */}
        {movie._aiReason && (
          <div
            className="absolute bottom-0 left-0 right-0 px-2 py-1.5 opacity-0 group-hover/card:opacity-100 transition-all"
            style={{ background: "linear-gradient(to top, rgba(6,12,24,0.95), transparent)" }}
          >
            <p className="text-[10px] text-[#7dd3fc] leading-tight line-clamp-2">✦ {movie._aiReason}</p>
          </div>
        )}
      </div>

      {/* Always-visible title + meta */}
      <div className="mt-2 px-0.5">
        <p className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover/card:text-white transition-colors leading-tight">
          {movie.title || movie.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-slate-500">{(movie.release_date || movie.first_air_date)?.split("-")[0]}</span>
          {movie.genre_ids?.length > 0 && (
            <>
              <span className="text-[10px] text-slate-700">·</span>
              <span className="text-[10px] text-slate-500 truncate">{genreMap[movie.genre_ids[0]] || ""}</span>
            </>
          )}
        </div>
      </div>
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

export default Row;
