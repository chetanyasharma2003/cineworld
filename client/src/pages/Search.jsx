import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";

const GENRES = [
  { id: "", label: "All Genres" },
  { id: 28, label: "Action" },
  { id: 12, label: "Adventure" },
  { id: 16, label: "Animation" },
  { id: 35, label: "Comedy" },
  { id: 80, label: "Crime" },
  { id: 18, label: "Drama" },
  { id: 14, label: "Fantasy" },
  { id: 27, label: "Horror" },
  { id: 9648, label: "Mystery" },
  { id: 10749, label: "Romance" },
  { id: 878, label: "Sci-Fi" },
  { id: 53, label: "Thriller" },
  { id: 10752, label: "War" },
];

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "release_date.desc", label: "Newest First" },
  { value: "release_date.asc", label: "Oldest First" },
];

const YEARS = ["", ...Array.from({ length: 35 }, (_, i) => 2024 - i)];

function MovieCard({ movie, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer relative rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-red-500/50 transition-all duration-200 hover:scale-105"
    >
      {/* Skeleton */}
      {!imgLoaded && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}

      <img
        src={
          movie.poster_path
            ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(movie.title)}&background=333&color=fff&size=300`
        }
        alt={movie.title}
        onLoad={() => setImgLoaded(true)}
        className={`w-full aspect-[2/3] object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-sm font-bold line-clamp-2 leading-tight">{movie.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-yellow-400 text-xs">★ {movie.vote_average?.toFixed(1)}</span>
            <span className="text-gray-400 text-xs">•</span>
            <span className="text-gray-400 text-xs">{movie.release_date?.split("-")[0]}</span>
          </div>
        </div>
      </div>

      {/* Rating badge */}
      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs text-yellow-400 font-bold">
        ★ {movie.vote_average?.toFixed(1)}
      </div>
    </div>
  );
}

function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [genre, setGenre] = useState(searchParams.get("genre") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "popularity.desc");
  const [minRating, setMinRating] = useState(searchParams.get("rating") || "");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const fetchResults = useCallback(async (resetPage = true) => {
    setLoading(true);
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("query", query.trim());
      if (genre) params.set("genre", genre);
      if (year) params.set("year", year);
      if (sortBy) params.set("sort", sortBy);
      if (minRating) params.set("rating", minRating);
      params.set("page", currentPage);

      const res = await api.get(`/movies/discover?${params.toString()}`);
      const data = res.data;

      if (resetPage) {
        setResults(data.results || []);
      } else {
        setResults((prev) => [...prev, ...(data.results || [])]);
      }
      setTotalPages(data.totalPages || 1);
      setTotalResults(data.totalResults || 0);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, genre, year, sortBy, minRating, page]);

  // Fetch on filter change
  useEffect(() => {
    const params = {};
    if (query) params.q = query;
    if (genre) params.genre = genre;
    if (year) params.year = year;
    if (sortBy !== "popularity.desc") params.sort = sortBy;
    if (minRating) params.rating = minRating;
    setSearchParams(params);
    fetchResults(true);
  }, [query, genre, year, sortBy, minRating]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("query", query.trim());
      if (genre) params.set("genre", genre);
      if (year) params.set("year", year);
      if (sortBy) params.set("sort", sortBy);
      if (minRating) params.set("rating", minRating);
      params.set("page", nextPage);
      const res = await api.get(`/movies/discover?${params.toString()}`);
      setResults((prev) => [...prev, ...(res.data.results || [])]);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setGenre("");
    setYear("");
    setSortBy("popularity.desc");
    setMinRating("");
  };

  const hasFilters = query || genre || year || minRating || sortBy !== "popularity.desc";

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white">
      <Navbar />

      <div className="pt-24 px-6 md:px-12 pb-16">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black mb-1">Search & Discover</h1>
          <p className="text-gray-500 text-sm">
            {totalResults > 0 ? `${totalResults.toLocaleString()} movies found` : "Find your next favourite movie"}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search movies by title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 outline-none focus:border-red-500/60 focus:bg-white/8 transition-all text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">

          {/* Genre */}
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/50 cursor-pointer hover:bg-white/8 transition-all"
          >
            {GENRES.map((g) => (
              <option key={g.id} value={g.id} className="bg-[#1a1a1a]">{g.label}</option>
            ))}
          </select>

          {/* Year */}
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/50 cursor-pointer hover:bg-white/8 transition-all"
          >
            <option value="" className="bg-[#1a1a1a]">All Years</option>
            {YEARS.filter(y => y !== "").map((y) => (
              <option key={y} value={y} className="bg-[#1a1a1a]">{y}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/50 cursor-pointer hover:bg-white/8 transition-all"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value} className="bg-[#1a1a1a]">{s.label}</option>
            ))}
          </select>

          {/* Min Rating */}
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/50 cursor-pointer hover:bg-white/8 transition-all"
          >
            <option value="" className="bg-[#1a1a1a]">Any Rating</option>
            {[9, 8, 7, 6, 5].map((r) => (
              <option key={r} value={r} className="bg-[#1a1a1a]">★ {r}+ Rating</option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 rounded-xl text-sm transition-all"
            >
              ✕ Clear All
            </button>
          )}
        </div>

        {/* Results */}
        {loading && results.length === 0 ? (
          // Initial loading skeleton
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="aspect-[2/3] bg-gray-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-6xl">🎬</div>
            <h2 className="text-xl font-bold text-gray-300">No movies found</h2>
            <p className="text-gray-500 text-sm">Try different keywords or filters</p>
            <button onClick={clearFilters} className="mt-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold transition-all">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Movie Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                />
              ))}
            </div>

            {/* Load More */}
            {page < totalPages && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl font-semibold text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${totalResults - results.length} remaining)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Search;