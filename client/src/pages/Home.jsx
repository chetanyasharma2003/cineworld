import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import Navbar from "../components/Navbar";
import Row from "../components/Row";
import Banner from "../components/Banner";
import MovieOfTheDay from "../components/MovieOfTheDay";
import { SkeletonBanner, SkeletonRow } from "../components/Skeletons";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { tmdbGet } from "../lib/tmdb";

// ── AI Recommendation Engine ──────────────────────────────
// User ki My List ke genres analyze karo
// Top genres ke basis pe movies recommend karo
const GENRE_MAP = {
  28:"Action", 12:"Adventure", 16:"Animation", 35:"Comedy",
  80:"Crime", 18:"Drama", 14:"Fantasy", 27:"Horror",
  9648:"Mystery", 10749:"Romance", 878:"Science Fiction",
  53:"Thriller", 10752:"War", 37:"Western"
};

async function getPersonalizedRecommendations(myList) {
  if (!myList?.length) return null;

  const { tmdbGet } = await import("../lib/tmdb");

  // Step 1: Genre frequency count — fetch from TMDB if missing
  const genreCount = {};

  await Promise.all(myList.slice(0, 5).map(async (movie) => {
    let ids = [];

    if (movie.genre_ids?.length) {
      ids = movie.genre_ids;
    } else if (movie.genres?.length) {
      ids = movie.genres.map(g => g.id);
    } else if (movie.id) {
      try {
        const data = await tmdbGet(`/movie/${movie.id}`);
        ids = (data.genres || []).map(g => g.id);
      } catch { /* ignore */ }
    }

    ids.forEach(id => {
      genreCount[id] = (genreCount[id] || 0) + 1;
    });
  }));

  // Step 2: Top 2 genres
  const topGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => id);

  if (!topGenres.length) return null;

  // Step 3: TMDB se un genres ki movies fetch karo
  const genreIds = topGenres.join(",");

  const savedIds = new Set(myList.map(m => m.id));

  try {
    const data = await tmdbGet("/discover/movie", {
      with_genres: genreIds, sort_by: "popularity.desc", "vote_count.gte": 100, page: 1,
    });

    // Already saved movies hatao
    const filtered = (data.results || [])
      .filter(m => m.poster_path && !savedIds.has(m.id))
      .slice(0, 20);

    const topGenreNames = topGenres
      .map(id => GENRE_MAP[id])
      .filter(Boolean)
      .join(" & ");

    return { movies: filtered, genres: topGenreNames };
  } catch {
    return null;
  }
}

/**
 * Resolve an AI rec title → full TMDB movie object
 */
async function resolveRec(rec) {
  const strategies = [
    rec.searchTitle || rec.title,
    (rec.title || "").split(":")[0].trim(),
    (rec.title || "").split(" ").slice(0, 4).join(" "),
  ].filter(Boolean);

  for (const q of strategies) {
    try {
      const data = await tmdbGet(`/search/movie?query=${encodeURIComponent(q)}&page=1`);
      const hits = (data.results || []).filter(m => m.poster_path);
      if (!hits.length) continue;
      const match = rec.year
        ? hits.find(m => m.release_date?.startsWith(String(rec.year))) || hits[0]
        : hits[0];
      return { ...match, _aiReason: rec.reason };
    } catch { /* ignore */ }
  }
  return null;
}

/**
 * Fetch smart personalised picks (feedback-aware) → resolves to TMDB posters.
 * Falls back to /ai/for-you if smart endpoint returns nothing.
 */
async function fetchSmartForYou() {
  try {
    const res = await api.post("/ai/smart-for-you");
    const recs = res.data.recommendations || [];
    if (!recs.length) {
      // fallback
      const res2 = await api.post("/ai/for-you");
      const recs2 = res2.data.recommendations || [];
      const resolved2 = await Promise.allSettled(recs2.map(resolveRec));
      return resolved2.filter(r => r.status === "fulfilled" && r.value).map(r => r.value);
    }
    const resolved = await Promise.allSettled(recs.map(resolveRec));
    return resolved.filter(r => r.status === "fulfilled" && r.value).map(r => r.value);
  } catch {
    return [];
  }
}

function ContinueWatching() {
  const [movies, setMovies] = useState([]);
  useEffect(() => {
    api.get("/users/me/watchlist").then(r => {
      setMovies((r.data.movies || []).filter(m => m.status === "watching").slice(0, 10));
    }).catch(() => {});
  }, []);
  if (!movies.length) return null;
  return <Row title="▶️ Continue Watching" movies={movies} />;
}

// Thumbs up/down on a For-You AI pick
function FeedbackButtons({ movie, onFeedback }) {
  const [voted, setVoted] = useState(null); // "up" | "down" | null

  const vote = async (liked) => {
    if (voted) return;
    setVoted(liked ? "up" : "down");
    try {
      await api.post("/ai/feedback", {
        movieId:    movie.id,
        movieTitle: movie.title,
        liked,
      });
      onFeedback?.(movie.id, liked);
    } catch { /* non-fatal */ }
  };

  return (
    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); vote(true); }}
        title="Good pick"
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
          voted === "up"
            ? "bg-green-500 text-white"
            : "bg-black/60 text-gray-300 hover:bg-green-500/80 hover:text-white"
        }`}
      >👍</button>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); vote(false); }}
        title="Not for me"
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
          voted === "down"
            ? "bg-red-500 text-white"
            : "bg-black/60 text-gray-300 hover:bg-red-500/80 hover:text-white"
        }`}
      >👎</button>
    </div>
  );
}

// AI rec card with reason tooltip + feedback buttons
function ForYouCard({ movie, onFeedback }) {
  const IMG = "https://image.tmdb.org/t/p/w300";
  return (
    <a
      href={`/movie/${movie.id}`}
      className="group relative shrink-0 w-[130px] cursor-pointer"
    >
      <div className="relative rounded-xl overflow-hidden">
        <img
          src={movie.poster_path ? `${IMG}${movie.poster_path}` : "/placeholder.png"}
          alt={movie.title}
          className="w-full h-[195px] object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <FeedbackButtons movie={movie} onFeedback={onFeedback} />
        {movie._aiReason && (
          <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92), transparent)" }}>
            <p className="text-[10px] text-purple-300 leading-tight line-clamp-3">
              {movie._aiReason}
            </p>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs text-gray-300 font-medium truncate px-0.5">{movie.title}</p>
    </a>
  );
}

function Home() {
  const [recommendations, setRecs]        = useState(null);
  const [recsLoading, setRecsLoading]     = useState(false);
  const [forYou, setForYou]               = useState([]);
  const [forYouLoading, setForYouLoading] = useState(false);
  const [visibleCount, setVisibleCount]   = useState(4);
  const sentinelRef                       = useRef(null);
  const { user }                          = useAuth();
  const { history: recentlyViewed }       = useRecentlyViewed();

  const handleFeedback = (movieId, liked) => {
    // Optimistically remove disliked movies from the row
    if (!liked) setForYou(prev => prev.filter(m => m.id !== movieId));
  };

  const { data, isLoading: loading, isError } = useQuery({
    queryKey: ["home"],
    queryFn: () => api.get("/movies/home").then(r => r.data.sections),
    staleTime: 5 * 60 * 1000,
  });
  const sections = data || {};

  // Infinite scroll — reveal rows as user scrolls
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount(c => c + 3); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading]);

  // ✅ AI Recommendations — user login hone pe fetch karo
  useEffect(() => {
    if (!user) { setRecs(null); setForYou([]); return; }

    const fetchRecs = async () => {
      setRecsLoading(true);
      try {
        const res = await api.get("/users/me/list");
        const myList = res.data.movies || [];
        if (myList.length < 2) { setRecs(null); return; }
        const result = await getPersonalizedRecommendations(myList);
        setRecs(result);
      } catch {
        setRecs(null);
      } finally {
        setRecsLoading(false);
      }
    };

    const fetchForYou = async () => {
      setForYouLoading(true);
      try {
        const movies = await fetchSmartForYou();
        setForYou(movies);
      } catch {
        setForYou([]);
      } finally {
        setForYouLoading(false);
      }
    };

    fetchRecs();
    fetchForYou();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-[#060c18] min-h-screen" style={{ color: "#f1f5f9" }}>
        <Navbar />
        <SkeletonBanner />
        <div className="relative z-10 -mt-16 space-y-6 pb-16">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow large />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-[#060c18] min-h-screen flex items-center justify-center px-6 text-center">
        <p className="text-red-500">Failed to load movies. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#060c18] min-h-screen" style={{ color: "#f1f5f9" }}>
      <Helmet>
        <title>CineWorld — Discover Movies & TV Shows</title>
        <meta name="description" content="Discover trending movies and TV shows, get AI-powered recommendations, and track your watchlist on CineWorld." />
        <meta property="og:title" content="CineWorld — Discover Movies & TV Shows" />
        <meta property="og:description" content="AI-powered movie discovery platform with personalised recommendations, social follows, and more." />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />
      <Banner movies={sections.popular} />

      <div className="relative z-10 -mt-16 space-y-6 pb-16">

        <MovieOfTheDay />

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <Row title="🕐 Recently Viewed" movies={recentlyViewed} />
        )}

        {/* Continue Watching — movies in "watching" status */}
        {user && <ContinueWatching />}

        {/* ✅ AI Personalized Recommendations — logged in users ke liye */}
        {user && (
          <>
            {recsLoading && (
              <div className="px-6 md:px-8 py-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(to bottom, #0ea5e9, #0284c7)" }} />
                  <h2 className="text-base md:text-lg font-bold">Recommended for You</h2>
                  <div className="flex gap-1">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: "#0ea5e9", animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="min-w-[130px] h-[195px] rounded-xl animate-pulse shrink-0" style={{ background: "var(--bg-card)" }} />
                  ))}
                </div>
              </div>
            )}

            {!recsLoading && recommendations?.movies?.length > 0 && (
              <div>
                <div className="px-6 md:px-8 mb-2 flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold tracking-wide"
                    style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.3)", color: "#38bdf8" }}>
                    ✦ AI Powered
                  </span>
                  <span className="text-xs text-slate-500">
                    Based on your {recommendations.genres} preferences
                  </span>
                </div>
                <Row title="Recommended for You" movies={recommendations.movies} />
              </div>
            )}

            {/* ✦ Groq For You row */}
            {forYouLoading && (
              <div className="px-6 md:px-8 py-4">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="text-xs px-2.5 py-1 rounded-full font-bold tracking-wide animate-pulse"
                    style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}
                  >
                    ✦ Groq AI
                  </div>
                  <h2 className="text-base md:text-lg font-bold">Personalised For You</h2>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="min-w-[130px] h-[195px] rounded-lg bg-purple-900/20 animate-pulse shrink-0" />
                  ))}
                </div>
              </div>
            )}

            {!forYouLoading && forYou.length > 0 && (
              <div>
                <div className="px-6 md:px-8 mb-3 flex items-center gap-2">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-bold tracking-wide"
                    style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}
                  >
                    ✦ Smart AI
                  </span>
                  <span className="text-xs text-gray-500">Curated for your taste · hover to rate</span>
                </div>
                <h2 className="px-6 md:px-8 text-base md:text-lg font-bold mb-3">
                  ✦ For You — AI Picks
                </h2>
                <div className="px-6 md:px-8 flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                  {forYou.map(movie => (
                    <ForYouCard key={movie.id} movie={movie} onFeedback={handleFeedback} />
                  ))}
                </div>
              </div>
            )}

          </>
        )}

        {[
          { title: "🔴 Now Playing",        movies: sections.nowPlaying },
          { title: "🔥 Trending & Popular",  movies: sections.popular },
          { title: "⭐ Top Rated All Time",  movies: sections.topRated },
          { title: "🎬 Upcoming Releases",   movies: sections.upcoming, large: true },
          { title: "💥 Action & Adventure",  movies: sections.action },
          { title: "😂 Comedy",              movies: sections.comedy },
          { title: "👻 Horror",              movies: sections.horror },
          { title: "🚀 Science Fiction",     movies: sections.scifi },
          { title: "🎭 Thrillers",           movies: sections.thriller },
          { title: "❤️ Romance",             movies: sections.romance },
          { title: "🎪 Animation",           movies: sections.animation },
          { title: "🎵 Bollywood",           movies: sections.bollywood },
        ].slice(0, visibleCount).map(({ title, movies, large }) => (
          <Row key={title} title={title} movies={movies} large={large} />
        ))}

        {/* Sentinel — triggers next batch */}
        {visibleCount < 12 && (
          <div ref={sentinelRef} className="flex justify-center py-6">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: "rgba(14,165,233,0.5)", animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="px-8 py-10 text-center" style={{ borderTop: "1px solid rgba(14,165,233,0.1)" }}>
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", boxShadow: "0 0 12px rgba(14,165,233,0.3)" }}
          >◈</div>
          <span className="font-black text-lg">Cine<span style={{ color: "#0ea5e9" }}>World</span></span>
        </div>
        <p className="text-xs text-slate-600">Movie data powered by TMDB · Built with ✦ AI</p>
      </footer>
    </div>
  );
}

export default Home;