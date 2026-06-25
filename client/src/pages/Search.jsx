import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";
import CertBadge from "../components/CertBadge";
import { useDebounce } from "../hooks/useDebounce";

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
  { value: "revenue.desc", label: "Highest Grossing" },
];

const YEARS = ["", ...Array.from({ length: 36 }, (_, i) => new Date().getFullYear() - i)];

const DECADES = [
  { value: "", label: "Any Decade" },
  { value: "2020", label: "2020s" },
  { value: "2010", label: "2010s" },
  { value: "2000", label: "2000s" },
  { value: "1990", label: "1990s" },
  { value: "1980", label: "1980s" },
  { value: "1970", label: "1970s" },
];

const LANGUAGES = [
  { value: "", label: "All Languages" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ko", label: "Korean" },
  { value: "ja", label: "Japanese" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "it", label: "Italian" },
  { value: "de", label: "German" },
  { value: "zh", label: "Chinese" },
  { value: "pt", label: "Portuguese" },
];

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
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-yellow-400 text-xs">★ {movie.vote_average?.toFixed(1)}</span>
            <span className="text-gray-400 text-xs">•</span>
            <span className="text-gray-400 text-xs">{movie.release_date?.split("-")[0]}</span>
            {movie.certification && <CertBadge cert={movie.certification} />}
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
  const [decade, setDecade] = useState(searchParams.get("decade") || "");
  const [language, setLanguage] = useState(searchParams.get("lang") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "popularity.desc");
  const [minRating, setMinRating] = useState(searchParams.get("rating") || "");

  const debouncedQuery = useDebounce(query, 400);

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cw_search_history") || "[]"); } catch { return []; }
  });

  const saveToHistory = (term) => {
    if (!term.trim()) return;
    setSearchHistory(prev => {
      const updated = [term, ...prev.filter(t => t !== term)].slice(0, 8);
      localStorage.setItem("cw_search_history", JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("cw_search_history");
  };

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // AI search mode
  const [aiMode, setAiMode] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState("");

  const fetchResults = useCallback(async (resetPage = true) => {
    setLoading(true);
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    try {
      const params = new URLSearchParams();
      if (debouncedQuery.trim()) params.set("query", debouncedQuery.trim());
      if (genre) params.set("genre", genre);
      if (year) params.set("year", year);
      if (decade && !year) { params.set("year_gte", decade); params.set("year_lte", String(parseInt(decade) + 9)); }
      if (language) params.set("language", language);
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
  }, [debouncedQuery, genre, year, decade, language, sortBy, minRating, page]);

  // Fetch on filter change (query is debounced, filters are immediate)
  useEffect(() => {
    const params = {};
    if (debouncedQuery) params.q = debouncedQuery;
    if (genre) params.genre = genre;
    if (year) params.year = year;
    if (decade) params.decade = decade;
    if (language) params.lang = language;
    if (sortBy !== "popularity.desc") params.sort = sortBy;
    if (minRating) params.rating = minRating;
    setSearchParams(params);
    fetchResults(true);
    if (debouncedQuery.trim()) saveToHistory(debouncedQuery.trim());
  }, [debouncedQuery, genre, year, decade, language, sortBy, minRating]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery.trim()) params.set("query", debouncedQuery.trim());
      if (genre) params.set("genre", genre);
      if (year) params.set("year", year);
      if (decade && !year) { params.set("year_gte", decade); params.set("year_lte", String(parseInt(decade) + 9)); }
      if (language) params.set("language", language);
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
    setDecade("");
    setLanguage("");
    setSortBy("popularity.desc");
    setMinRating("");
  };

  const hasFilters = query || genre || year || decade || language || minRating || sortBy !== "popularity.desc";

  const handleAISearch = async () => {
    if (!aiQuery.trim() || aiLoading) return;
    setAiLoading(true);
    setAiInterpretation("");
    try {
      const res = await api.post("/ai/search", { query: aiQuery.trim() });
      const params = res.data.params || {};

      // Apply Claude's interpretation to filter state
      if (params.searchQuery) { setQuery(params.searchQuery); }
      if (params.with_genres) { const id = params.with_genres.split(",")[0]; setGenre(id); }
      if (params.primary_release_year) { setYear(params.primary_release_year); setDecade(""); }
      if (params["primary_release_date.gte"]) {
        const yr = params["primary_release_date.gte"].slice(0, 4);
        const nearestDecade = String(Math.floor(parseInt(yr) / 10) * 10);
        setDecade(nearestDecade); setYear("");
      }
      if (params.with_original_language) setLanguage(params.with_original_language);
      if (params.sort_by) setSortBy(params.sort_by);
      if (params["vote_average.gte"]) setMinRating(params["vote_average.gte"]);

      // Build a human-readable summary
      const parts = [];
      if (params.searchQuery) parts.push(`"${params.searchQuery}"`);
      if (params.with_genres) parts.push("filtered by genre");
      if (params.primary_release_year) parts.push(`from ${params.primary_release_year}`);
      if (params["primary_release_date.gte"]) parts.push(`from the ${params["primary_release_date.gte"].slice(0, 3)}0s`);
      if (params.with_original_language) parts.push(`in ${params.with_original_language.toUpperCase()}`);
      setAiInterpretation(parts.length ? parts.join(", ") : "applied AI filters");
    } catch (err) {
      const msg = err.response?.data?.error || "";
      setAiInterpretation(msg.includes("not configured") ? "AI not configured on server" : "AI search failed — try again");
    } finally {
      setAiLoading(false);
    }
  };

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

        {/* AI / Normal toggle */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => { setAiMode(false); setAiInterpretation(""); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${!aiMode ? "bg-red-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"}`}
          >
            🔍 Normal Search
          </button>
          <button
            onClick={() => { setAiMode(true); setAiInterpretation(""); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${aiMode ? "bg-gradient-to-r from-purple-600 to-red-600 text-white" : "bg-white/5 text-gray-400 hover:text-white border border-white/10"}`}
          >
            <span>✦</span> AI Search
          </button>
          {aiInterpretation && (
            <span className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full">
              ✦ AI found: {aiInterpretation}
            </span>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          {aiMode ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-base">✦</span>
                <input
                  type="text"
                  placeholder="Describe what you want to watch... e.g. '90s sci-fi with time travel'"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
                  className="w-full pl-12 pr-4 py-4 bg-purple-900/10 border border-purple-500/30 rounded-2xl text-white placeholder-gray-600 outline-none focus:border-purple-500/60 transition-all text-base"
                />
              </div>
              <button
                onClick={handleAISearch}
                disabled={aiLoading || !aiQuery.trim()}
                className="px-6 py-4 bg-gradient-to-r from-purple-600 to-red-600 rounded-2xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all whitespace-nowrap"
              >
                {aiLoading ? <span className="animate-spin inline-block">✦</span> : "Search ✦"}
              </button>
            </div>
          ) : (
            <>
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search movies by title..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
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
              {/* Search History Dropdown */}
              {searchFocused && !query.trim() && searchHistory.length > 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Recent Searches</p>
                    <button onClick={clearHistory} className="text-xs text-gray-600 hover:text-red-400 transition-colors">Clear all</button>
                  </div>
                  {searchHistory.map((term, i) => (
                    <button
                      key={i}
                      onMouseDown={() => setQuery(term)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left group border-b border-white/5 last:border-0"
                    >
                      <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{term}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
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
            onChange={(e) => { setYear(e.target.value); if (e.target.value) setDecade(""); }}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/50 cursor-pointer hover:bg-white/8 transition-all"
          >
            <option value="" className="bg-[#1a1a1a]">All Years</option>
            {YEARS.filter(y => y !== "").map((y) => (
              <option key={y} value={y} className="bg-[#1a1a1a]">{y}</option>
            ))}
          </select>

          {/* Decade */}
          <select
            value={decade}
            onChange={(e) => { setDecade(e.target.value); if (e.target.value) setYear(""); }}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/50 cursor-pointer hover:bg-white/8 transition-all"
          >
            {DECADES.map(d => (
              <option key={d.value} value={d.value} className="bg-[#1a1a1a]">{d.label}</option>
            ))}
          </select>

          {/* Language */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/50 cursor-pointer hover:bg-white/8 transition-all"
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value} className="bg-[#1a1a1a]">{l.label}</option>
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