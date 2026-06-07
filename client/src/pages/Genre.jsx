import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";

const GENRES = {
  action:      { id: 28,    label: "Action",        emoji: "💥", color: "from-red-900/40" },
  adventure:   { id: 12,    label: "Adventure",     emoji: "🗺️", color: "from-yellow-900/40" },
  animation:   { id: 16,    label: "Animation",     emoji: "🎪", color: "from-purple-900/40" },
  comedy:      { id: 35,    label: "Comedy",        emoji: "😂", color: "from-yellow-900/40" },
  crime:       { id: 80,    label: "Crime",         emoji: "🔫", color: "from-gray-900/60" },
  drama:       { id: 18,    label: "Drama",         emoji: "🎭", color: "from-blue-900/40" },
  fantasy:     { id: 14,    label: "Fantasy",       emoji: "🧙", color: "from-violet-900/40" },
  horror:      { id: 27,    label: "Horror",        emoji: "👻", color: "from-red-950/60" },
  mystery:     { id: 9648,  label: "Mystery",       emoji: "🔍", color: "from-slate-900/60" },
  romance:     { id: 10749, label: "Romance",       emoji: "❤️", color: "from-pink-900/40" },
  "sci-fi":    { id: 878,   label: "Science Fiction", emoji: "🚀", color: "from-cyan-900/40" },
  thriller:    { id: 53,    label: "Thriller",      emoji: "😱", color: "from-orange-900/40" },
  war:         { id: 10752, label: "War",           emoji: "⚔️", color: "from-stone-900/60" },
  bollywood:   { id: null,  label: "Bollywood",     emoji: "🎵", color: "from-orange-900/40", lang: "hi" },
};

const SORT_OPTIONS = [
  { value: "popularity.desc",   label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "release_date.desc", label: "Newest First" },
  { value: "release_date.asc",  label: "Oldest First" },
];

function MovieCard({ movie, onClick }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer relative rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-red-500/50 transition-all duration-200 hover:scale-105"
    >
      {!loaded && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
      <img
        src={
          movie.poster_path
            ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(movie.title)}&background=333&color=fff&size=300`
        }
        alt={movie.title}
        onLoad={() => setLoaded(true)}
        className={`w-full aspect-[2/3] object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-xs font-bold line-clamp-2 leading-tight">{movie.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-yellow-400 text-xs">★ {movie.vote_average?.toFixed(1)}</span>
            <span className="text-gray-500 text-xs">•</span>
            <span className="text-gray-400 text-xs">{movie.release_date?.split("-")[0]}</span>
          </div>
        </div>
      </div>
      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs text-yellow-400 font-bold">
        ★ {movie.vote_average?.toFixed(1)}
      </div>
    </div>
  );
}

export default function Genre() {
  const { slug } = useParams();
  const navigate  = useNavigate();
  const genre     = GENRES[slug?.toLowerCase()];

  const [movies, setMovies]       = useState([]);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotal]    = useState(1);
  const [loading, setLoading]     = useState(false);
  const [sortBy, setSortBy]       = useState("popularity.desc");
  const [initial, setInitial]     = useState(true);
  const loaderRef                 = useRef(null);

  // Reset when genre or sort changes
  useEffect(() => {
    setMovies([]);
    setPage(1);
    setTotal(1);
    setInitial(true);
  }, [slug, sortBy]);

  // Fetch movies
  const fetchMovies = useCallback(async (pageNum) => {
    if (!genre) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort: sortBy,
        page: pageNum,
      });
      if (genre.lang) {
        params.set("lang", genre.lang);
      } else {
        params.set("genre", genre.id);
      }

      const res = await api.get(`/movies/discover?${params}`);
      const data = res.data;

      setMovies(prev => pageNum === 1 ? (data.results || []) : [...prev, ...(data.results || [])]);
      setTotal(data.totalPages || 1);
      setInitial(false);
    } catch (err) {
      console.error(err);
      setInitial(false);
    } finally {
      setLoading(false);
    }
  }, [genre, sortBy]);

  useEffect(() => {
    if (initial) fetchMovies(1);
  }, [initial, fetchMovies]);

  // Infinite scroll — observe loader div
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && page < totalPages) {
          const next = page + 1;
          setPage(next);
          fetchMovies(next);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loading, page, totalPages, fetchMovies]);

  // Invalid genre
  if (!genre) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen text-white flex items-center justify-center">
        <Navbar />
        <div className="text-center pt-20">
          <p className="text-5xl mb-4">🎬</p>
          <h1 className="text-2xl font-bold">Genre not found</h1>
          <button onClick={() => navigate("/")} className="mt-4 px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold transition-all">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white">
      <Navbar />

      {/* Genre Hero */}
      <div className={`relative pt-32 pb-10 px-6 md:px-12 bg-gradient-to-b ${genre.color} to-[#0a0a0a]`}>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-5xl">{genre.emoji}</span>
          <div>
            <h1 className="text-4xl md:text-5xl font-black">{genre.label}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {movies.length > 0 ? `${movies.length}+ movies` : "Loading..."}
            </p>
          </div>
        </div>

        {/* All genre chips */}
        <div className="flex flex-wrap gap-2 mt-6">
          {Object.entries(GENRES).map(([key, g]) => (
            <button
              key={key}
              onClick={() => navigate(`/genre/${key}`)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                key === slug
                  ? "bg-red-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {g.emoji} {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 md:px-12 py-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {!initial && `${movies.length} movies loaded`}
        </p>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/50 cursor-pointer"
        >
          {SORT_OPTIONS.map(s => (
            <option key={s.value} value={s.value} className="bg-[#1a1a1a]">{s.label}</option>
          ))}
        </select>
      </div>

      {/* Movie Grid */}
      <div className="px-6 md:px-12 pb-16">
        {initial ? (
          // Initial skeleton
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="aspect-[2/3] bg-gray-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movies.map((movie) => (
                <MovieCard
                  key={`${movie.id}-${page}`}
                  movie={movie}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                />
              ))}
            </div>

            {/* Infinite scroll loader */}
            <div ref={loaderRef} className="flex justify-center mt-10 py-4">
              {loading && (
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                  <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  Loading more movies...
                </div>
              )}
              {!loading && page >= totalPages && movies.length > 0 && (
                <p className="text-gray-700 text-sm">You've seen them all! 🎬</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}