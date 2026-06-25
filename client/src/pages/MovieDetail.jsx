import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import AIChatWidget from "../components/AIChatWidget";
import AIReviewSummary from "../components/AIReviewSummary";
import AISimilarMovies from "../components/AISimilarMovies";
import { SkeletonMovieDetail } from "../components/Skeletons";
import CertBadge, { extractCert } from "../components/CertBadge";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Row from "../components/Row";
import ReviewForm, { ReviewEditInline } from "../components/ReviewForm";
import AuthModal from "../components/AuthModal";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";

import { tmdbGet } from "../lib/tmdb";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
const tmdb = (url) => tmdbGet(url);

// ─── Watchlist Hook ────────────────────────────────────────
const WATCHLIST_LABELS = { want_to_watch: "Want to Watch", watching: "Watching", watched: "Watched" };
const WATCHLIST_STATUSES = ["want_to_watch", "watching", "watched"];

const useWatchlist = (movie, navigate) => {
  const { user } = useAuth();
  const [wlStatus, setWlStatus] = useState(null); // null = not in watchlist
  const [showWlMenu, setShowWlMenu] = useState(false);

  useEffect(() => {
    if (!movie) return;
    const check = async () => {
      if (!user) { setWlStatus(null); return; }
      try {
        const res = await api.get("/users/me/watchlist");
        const found = (res.data.movies || []).find((m) => m.id === movie.id);
        setWlStatus(found ? found.status : null);
      } catch { setWlStatus(null); }
    };
    check();
  }, [movie, user]);

  const selectStatus = async (status) => {
    if (!movie) return;
    if (!user) { navigate("/signup"); return; }
    const prevStatus = wlStatus;
    // Optimistic update
    setWlStatus(status);
    setShowWlMenu(false);
    try {
      if (prevStatus === null) {
        await api.post("/users/me/watchlist", { movie, status });
        toast.success(`Added to "${WATCHLIST_LABELS[status]}"`);
      } else {
        await api.put(`/users/me/watchlist/${movie.id}`, { status });
        toast.success(`Moved to "${WATCHLIST_LABELS[status]}"`);
      }
    } catch {
      setWlStatus(prevStatus); // revert on error
      toast.error("Something went wrong");
    }
  };

  const removeFromWatchlist = async () => {
    if (!movie) return;
    const prevStatus = wlStatus;
    // Optimistic update
    setWlStatus(null);
    setShowWlMenu(false);
    try {
      await api.delete(`/users/me/watchlist/${movie.id}`);
      toast("Removed from Watchlist", { icon: "🗑️" });
    } catch {
      setWlStatus(prevStatus); // revert on error
      toast.error("Something went wrong");
    }
  };

  return { wlStatus, showWlMenu, setShowWlMenu, selectStatus, removeFromWatchlist };
};

// ─── Platform URLs ─────────────────────────────────────────
const PLATFORM_URLS = {
  "Netflix":"https://www.netflix.com/search?q=",
  "Amazon Prime Video":"https://www.primevideo.com/search/ref=atv_nb_sr?phrase=",
  "Amazon Video":"https://www.primevideo.com/search/ref=atv_nb_sr?phrase=",
  "Disney Plus":"https://www.disneyplus.com/search/",
  "Disney+":"https://www.disneyplus.com/search/",
  "Apple TV":"https://tv.apple.com/search?term=",
  "Apple TV+":"https://tv.apple.com/search?term=",
  "Hulu":"https://www.hulu.com/search?q=",
  "JioCinema":"https://www.jiocinema.com/search/",
  "Hotstar":"https://www.hotstar.com/in/search?q=",
  "Disney+ Hotstar":"https://www.hotstar.com/in/search?q=",
  "ZEE5":"https://www.zee5.com/search?q=",
  "SonyLIV":"https://www.sonyliv.com/search?q=",
  "Mubi":"https://mubi.com/search/",
  "Peacock":"https://www.peacocktv.com/search?q=",
  "Paramount Plus":"https://www.paramountplus.com/search/",
  "Paramount+":"https://www.paramountplus.com/search/",
  "YouTube":"https://www.youtube.com/results?search_query=",
  "YouTube Premium":"https://www.youtube.com/results?search_query=",
  "Google Play Movies":"https://play.google.com/store/search?q=",
};
const getPlatformUrl = (name, title) => {
  const base = PLATFORM_URLS[name];
  return base ? base + encodeURIComponent(title)
    : `https://www.google.com/search?q=${encodeURIComponent(title + " " + name)}`;
};

// ─── Star Rating ───────────────────────────────────────────
function StarRating({ score }) {
  const stars = Math.round(score / 2);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={s <= stars ? "text-yellow-400 text-lg" : "text-gray-700 text-lg"}>★</span>
      ))}
      <span className="text-gray-400 text-sm ml-2">{score?.toFixed(1)} / 10</span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function MovieDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [movie, setMovie]             = useState(null);
  const [similar, setSimilar]         = useState([]);
  const [cast, setCast]               = useState([]);
  const [crew, setCrew]               = useState([]);
  const [reviews, setReviews]         = useState([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsSort, setReviewsSort] = useState("newest");
  const [collection, setCollection]   = useState(null);
  const [trailerKey, setTrailerKey]   = useState(null);
  const [providers, setProviders]     = useState(null);
  const [ratingData, setRatingData]   = useState(null);
  const [keywords, setKeywords]       = useState([]);
  const [certification, setCert]      = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showAuth, setShowAuth]       = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [showWhere, setShowWhere]     = useState(false);
  const [imgLoaded, setImgLoaded]     = useState(false);
  const [activeTab, setActiveTab]     = useState("overview");

  const { user } = useAuth();
  const { wlStatus, showWlMenu, setShowWlMenu, selectStatus, removeFromWatchlist } = useWatchlist(movie, navigate);
  const { addMovie: addToHistory } = useRecentlyViewed();
  const openLogin  = () => setShowAuth(true);
  const closeLogin = () => setShowAuth(false);

  const fetchReviews = async (page = 1, sort = reviewsSort) => {
    const sortParam = sort === "helpful" ? "helpful" : "newest";
    try {
      const res = await api.get(`/reviews/${id}?page=${page}&limit=10&sort=${sortParam}`);
      setReviews(res.data.reviews || []);
      setReviewsTotal(res.data.total || 0);
      setReviewsPage(page);
      setReviewsSort(sort);
    } catch { /* keep existing */ }
  };

  const toggleHelpful = async (reviewId) => {
    if (!user) { openLogin(); return; }
    try {
      const res = await api.post(`/reviews/${reviewId}/helpful`);
      setReviews(prev => prev.map(r => r._id === reviewId
        ? { ...r, helpfulCount: res.data.helpfulCount, helpfulByMe: res.data.helpfulByMe }
        : r
      ));
    } catch { /* silent */ }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setImgLoaded(false);
    setMovie(null);
    setTrailerKey(null);
    setShowTrailer(false);
    setActiveTab("overview");

    const fetchAll = async () => {
      try {
        const [movieRes, creditsRes, similarRes, videosRes, providersRes, keywordsRes, releaseDatesRes] =
          await Promise.all([
            tmdb(`/movie/${id}`),
            tmdb(`/movie/${id}/credits`),
            tmdb(`/movie/${id}/similar`),
            tmdb(`/movie/${id}/videos`),
            tmdb(`/movie/${id}/watch/providers`),
            tmdb(`/movie/${id}/keywords`),
            tmdb(`/movie/${id}/release_dates`),
          ]);

        setMovie(movieRes);
        addToHistory(movieRes);

        // Fetch collection if this movie belongs to one
        if (movieRes.belongs_to_collection?.id) {
          tmdb(`/collection/${movieRes.belongs_to_collection.id}`)
            .then(col => setCollection(col))
            .catch(() => {});
        } else {
          setCollection(null);
        }

        setCast((creditsRes.cast || []).slice(0, 20));
        setCrew(creditsRes.crew || []);
        setSimilar((similarRes.results || []).filter(m => m.poster_path).slice(0, 12));
        setProviders(providersRes.results || {});
        setKeywords((keywordsRes.keywords || []).slice(0, 20));
        setCert(extractCert(releaseDatesRes));

        const videos = videosRes.results || [];
        const trailer =
          videos.find(v => v.type === "Trailer" && v.site === "YouTube" && v.official) ||
          videos.find(v => v.type === "Trailer" && v.site === "YouTube") ||
          videos.find(v => v.site === "YouTube");
        setTrailerKey(trailer?.key || null);

        try {
          const rRes = await api.get(`/reviews/${id}?page=1&limit=10`);
          setReviews(rRes.data.reviews || []);
          setReviewsTotal(rRes.data.total || 0);
          setReviewsPage(1);
        } catch { setReviews([]); setReviewsTotal(0); }

        try {
          const rtRes = await api.get(`/reviews/${id}/rating`);
          setRatingData(rtRes.data);
        } catch { /* ignore */ }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAll();
  }, [id]);

  useEffect(() => {
    document.body.style.overflow = (showAuth || showWhere || showTrailer) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showAuth, showWhere, showTrailer]);

  useEffect(() => {
    const onEsc = (e) => { if (e.key === "Escape") { setShowTrailer(false); setShowWhere(false); setShowWlMenu(false); }};
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  if (!movie) return <SkeletonMovieDetail />;

  const year     = movie.release_date?.split("-")[0];
  const runtime  = `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`;
  const director = crew.find(c => c.job === "Director");
  const _writers  = crew.filter(c => ["Writer","Screenplay","Story"].includes(c.job)).slice(0, 3);
  const _producers= crew.filter(c => c.job === "Producer").slice(0, 3);
  const hasIN    = providers?.IN;
  const hasUS    = providers?.US;
  const current  = hasIN || hasUS || null;
  const hasProviders = current && (current.flatrate?.length || current.rent?.length || current.buy?.length);

  const TABS = ["overview", "cast", "crew", "details", "genres"];

  const ogImage = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "";

  return (
    <div className="bg-[#0f0f0f] text-white min-h-screen">
      <Helmet>
        <title>{`${movie.title} (${year}) — CineWorld`}</title>
        <meta name="description" content={movie.overview?.slice(0, 155)} />
        <meta property="og:title" content={`${movie.title} (${year})`} />
        <meta property="og:description" content={movie.overview?.slice(0, 155)} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="video.movie" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${movie.title} (${year})`} />
        <meta name="twitter:description" content={movie.overview?.slice(0, 155)} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      {/* ── HERO ── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: "280px", height: "65vh" }}>
        <img
          src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
          alt={movie.title}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-1000 ${imgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-black/20" />

        <button onClick={() => navigate(-1)}
          className="absolute top-20 left-6 z-10 flex items-center gap-2 text-sm bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-black/60 transition-all border border-white/10">
          ← Back
        </button>

        <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-2xl">
          <div className="flex flex-wrap gap-2 mb-3">
            {movie.genres?.map(g => (
              <span key={g.id} className="text-xs px-3 py-1 rounded-full bg-red-600/80 font-medium">{g.name}</span>
            ))}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-1 leading-none">{movie.title}</h1>
          {movie.original_title !== movie.title && (
            <p className="text-gray-500 text-sm mb-1">{movie.original_title}</p>
          )}
          {movie.tagline && <p className="text-gray-400 italic text-sm mb-3">"{movie.tagline}"</p>}
          {director && (
            <p className="text-sm text-gray-400 mb-3">
              Directed by <span className="text-white font-semibold">{director.name}</span>
            </p>
          )}
          <div className="flex items-center gap-3 text-sm text-gray-300 mb-5 flex-wrap">
            <span className="text-yellow-400 font-bold text-base">★ {movie.vote_average?.toFixed(1)}</span>
            <span className="text-gray-600">•</span>
            <span>{year}</span>
            <span className="text-gray-600">•</span>
            <span>{runtime}</span>
            {certification && (
              <><span className="text-gray-600">•</span>
              <CertBadge cert={certification} size="lg" /></>
            )}
            {movie.original_language && (
              <><span className="text-gray-600">•</span>
              <span className="uppercase text-xs bg-white/10 px-2 py-0.5 rounded">{movie.original_language}</span></>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowWhere(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95">
              📺 Where to Watch
              {hasProviders > 0 && <span className="bg-white/25 text-xs px-1.5 py-0.5 rounded-full">Available</span>}
            </button>
            <button onClick={() => setShowTrailer(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-sm transition-all hover:scale-105">
              🎬 {trailerKey ? "Watch Trailer" : "Trailer"}
            </button>
            {/* Share button */}
            <button
              onClick={async () => {
                const shareData = { title: movie.title, text: `Check out "${movie.title}" on CineWorld!`, url: window.location.href };
                if (navigator.share) { try { await navigator.share(shareData); } catch { /* ignore */ } }
                else { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-sm transition-all hover:scale-105">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>

            {/* Watchlist button with dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowWlMenu((v) => !v)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 border ${
                  wlStatus
                    ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                    : "bg-white/10 border-white/20 hover:bg-white/20"
                }`}>
                {wlStatus ? `✓ ${WATCHLIST_LABELS[wlStatus]} ▾` : "+ Watchlist"}
              </button>
              {showWlMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[170px]">
                  {WATCHLIST_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => selectStatus(s)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-white/10 ${
                        wlStatus === s ? "text-blue-400 font-semibold bg-blue-600/10" : "text-gray-300"
                      }`}
                    >
                      {WATCHLIST_LABELS[s]}
                    </button>
                  ))}
                  {wlStatus && (
                    <button
                      onClick={removeFromWatchlist}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-600/10 transition-all border-t border-white/10"
                    >
                      Remove from Watchlist
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="px-6 md:px-12 py-8">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* ── LEFT SIDEBAR ── */}
          <div className="lg:w-64 shrink-0 space-y-5">

            {/* Poster */}
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="w-full max-w-[200px] mx-auto lg:mx-0 rounded-2xl shadow-2xl ring-1 ring-white/10"
            />

            {/* Where to Watch sidebar */}
            <div className="bg-white/5 rounded-2xl p-4 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Where to Watch</p>
              {!current ? (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-500 mb-2">Not streaming right now</p>
                  <button onClick={() => window.open(`https://www.google.com/search?q=Watch+${encodeURIComponent(movie.title)}+online`, "_blank")}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-all">
                    🔍 Search online
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {current.flatrate?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Stream</p>
                      <div className="flex flex-wrap gap-2">
                        {current.flatrate.slice(0, 4).map(p => (
                          <button key={p.provider_id}
                            onClick={() => window.open(getPlatformUrl(p.provider_name, movie.title), "_blank")}
                            title={p.provider_name}
                            className="hover:scale-110 transition-all">
                            <img src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                              alt={p.provider_name} className="w-9 h-9 rounded-lg object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {current.rent?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Rent</p>
                      <div className="flex flex-wrap gap-2">
                        {current.rent.slice(0, 4).map(p => (
                          <button key={p.provider_id}
                            onClick={() => window.open(getPlatformUrl(p.provider_name, movie.title), "_blank")}
                            title={p.provider_name} className="hover:scale-110 transition-all">
                            <img src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                              alt={p.provider_name} className="w-9 h-9 rounded-lg object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {current.buy?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Buy</p>
                      <div className="flex flex-wrap gap-2">
                        {current.buy.slice(0, 4).map(p => (
                          <button key={p.provider_id}
                            onClick={() => window.open(getPlatformUrl(p.provider_name, movie.title), "_blank")}
                            title={p.provider_name} className="hover:scale-110 transition-all">
                            <img src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                              alt={p.provider_name} className="w-9 h-9 rounded-lg object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => window.open(`https://www.themoviedb.org/movie/${movie.id}/watch`, "_blank")}
                    className="w-full py-2 text-xs text-blue-400 hover:text-blue-300 transition-colors text-center border-t border-white/5 pt-3">
                    All services →
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white/5 rounded-2xl p-4 ring-1 ring-white/10 space-y-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-gray-500">Details</p>
              {[
                ["Status", movie.status, movie.status === "Released" ? "text-green-400" : "text-yellow-400"],
                ["Release", movie.release_date, ""],
                ["Runtime", runtime, ""],
                movie.budget > 0 && ["Budget", `$${(movie.budget/1e6).toFixed(0)}M`, ""],
                movie.revenue > 0 && ["Box Office", `$${(movie.revenue/1e6).toFixed(0)}M`, "text-green-400"],
              ].filter(Boolean).map(([label, value, cls]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-gray-500 shrink-0">{label}</span>
                  <span className={`text-right text-xs ${cls}`}>{value}</span>
                </div>
              ))}
              {certification && (
                <div className="flex justify-between gap-2 pt-1 border-t border-white/5">
                  <span className="text-gray-500 shrink-0">Certification</span>
                  <CertBadge cert={certification} size="lg" />
                </div>
              )}
              {movie.belongs_to_collection && (
                <div className="pt-2 border-t border-white/5">
                  <p className="text-gray-500 text-xs mb-1">Part of</p>
                  <p className="text-xs text-red-400">{movie.belongs_to_collection.name}</p>
                </div>
              )}
            </div>

            {/* External Links */}
            <div className="flex gap-2">
              {movie.imdb_id && (
                <a href={`https://www.imdb.com/title/${movie.imdb_id}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-2 text-center text-xs font-bold bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 rounded-xl transition-all">
                  IMDb ↗
                </a>
              )}
              <a href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2 text-center text-xs font-bold bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-xl transition-all">
                TMDB ↗
              </a>
            </div>
          </div>

          {/* ── RIGHT CONTENT ── */}
          <div className="flex-1 min-w-0">

            {/* Rating Bar */}
            <div className="mb-6 pb-6 border-b border-white/10">
              <StarRating score={movie.vote_average} />
              <div className="mt-2 w-full max-w-xs bg-gray-800 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-yellow-600 to-yellow-300 h-1.5 rounded-full"
                  style={{ width: `${(movie.vote_average / 10) * 100}%` }} />
              </div>
              <p className="text-xs text-gray-600 mt-1">{movie.vote_count?.toLocaleString()} votes on TMDB</p>
            </div>

            {/* ── TABS ── */}
            <div className="flex gap-1 mb-6 border-b border-white/10 overflow-x-auto scrollbar-hide">
              {TABS.map(tab => (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-semibold capitalize whitespace-nowrap transition-all border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-red-500 text-white"
                      : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <p className="text-gray-300 leading-relaxed text-base">{movie.overview}</p>
                </div>

                {/* Director */}
                {director && (
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl ring-1 ring-white/10">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                      <img src={director.profile_path
                        ? `https://image.tmdb.org/t/p/w185${director.profile_path}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(director.name)}&background=333&color=fff`}
                        alt={director.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest">Director</p>
                      <p className="font-bold text-white">{director.name}</p>
                    </div>
                  </div>
                )}

                {/* Top Cast preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500">Top Cast</h3>
                    <button onClick={() => setActiveTab("cast")} className="text-xs text-red-400 hover:text-red-300">See all →</button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {cast.slice(0, 8).map(actor => (
                      <div key={actor.id} onClick={() => navigate(`/actor/${actor.id}`)}
                        className="flex flex-col items-center min-w-[70px] cursor-pointer group">
                        <div className="w-14 h-20 rounded-xl overflow-hidden mb-2 ring-1 ring-white/10 group-hover:ring-red-500 transition-all">
                          <img src={actor.profile_path
                            ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=222&color=fff`}
                            alt={actor.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                        </div>
                        <p className="text-xs font-medium text-center line-clamp-1 group-hover:text-red-400 transition-colors">{actor.name}</p>
                        <p className="text-xs text-gray-600 text-center line-clamp-1 mt-0.5">{actor.character}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collection */}
                {collection?.parts?.length > 1 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">
                      Part of: {collection.name}
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {collection.parts
                        .filter(p => p.poster_path)
                        .sort((a, b) => (a.release_date || "").localeCompare(b.release_date || ""))
                        .map(part => (
                          <div
                            key={part.id}
                            onClick={() => navigate(`/movie/${part.id}`)}
                            className={`flex-shrink-0 cursor-pointer group ${part.id === Number(id) ? "ring-2 ring-red-500 rounded-xl" : ""}`}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w185${part.poster_path}`}
                              alt={part.title}
                              className="w-20 rounded-xl object-cover group-hover:opacity-80 transition-opacity"
                            />
                            <p className="text-xs text-gray-500 mt-1 text-center w-20 line-clamp-1 group-hover:text-white transition-colors">
                              {part.title}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {keywords.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map(k => (
                        <span key={k.id} className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:border-white/20 hover:text-white transition-all cursor-default">
                          {k.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500">
                      CineWorld Reviews {reviewsTotal > 0 && <span className="text-red-400">({reviewsTotal})</span>}
                    </h3>
                    {reviewsTotal > 0 && (
                      <select
                        value={reviewsSort}
                        onChange={e => fetchReviews(1, e.target.value)}
                        className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-gray-400"
                      >
                        <option value="newest">Newest</option>
                        <option value="helpful">Most Helpful</option>
                      </select>
                    )}
                  </div>
                  <ReviewForm movieId={id} movieTitle={movie?.title || ""} setReviews={(fn) => {
                    if (typeof fn === "function") {
                      setReviews(fn);
                      setReviewsTotal(t => t + 1);
                    }
                  }} openLogin={openLogin}
                    ratingData={ratingData} setRatingData={setRatingData} />
                  {reviews.length >= 2 && (
                    <div className="mt-3">
                      <AIReviewSummary reviews={reviews} />
                    </div>
                  )}
                  {reviews.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {reviews.map(r => (
                        <div key={r._id}>
                          {editingReviewId === r._id ? (
                            <ReviewEditInline
                              review={r}
                              onSave={(updated) => {
                                setReviews(prev => prev.map(x => x._id === r._id ? updated : x));
                                setEditingReviewId(null);
                              }}
                              onCancel={() => setEditingReviewId(null)}
                            />
                          ) : (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all">
                              {r.rating && (
                                <div className="flex gap-0.5 mb-2">
                                  {[1,2,3,4,5].map(s => (
                                    <span key={s} className={`text-sm ${s <= r.rating ? "text-yellow-400" : "text-gray-700"}`}>★</span>
                                  ))}
                                </div>
                              )}
                              <p className="text-sm text-gray-200 leading-relaxed">"{r.content}"</p>
                              <div className="flex items-center justify-between mt-3">
                                <p className="text-xs text-red-400 font-semibold">— {r.author}</p>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => toggleHelpful(r._id)}
                                    className={`flex items-center gap-1 text-xs transition-colors ${r.helpfulByMe ? "text-green-400" : "text-gray-600 hover:text-green-400"}`}
                                    title="Mark as helpful"
                                  >
                                    👍 {r.helpfulCount > 0 ? r.helpfulCount : ""}
                                  </button>
                                  <p className="text-xs text-gray-600">
                                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric"}) : ""}
                                  </p>
                                  {user && (r.user === user.id || r.user?._id === user.id) && (
                                    <div className="flex gap-2">
                                      <button onClick={() => setEditingReviewId(r._id)}
                                        className="text-xs text-gray-500 hover:text-yellow-400 transition-colors">
                                        Edit
                                      </button>
                                      <button onClick={async () => {
                                        try {
                                          await api.delete(`/reviews/${r._id}`);
                                          setReviews(prev => prev.filter(x => x._id !== r._id));
                                          setReviewsTotal(t => t - 1);
                                          toast.success("Review deleted");
                                        } catch { toast.error("Could not delete review"); }
                                      }} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Pagination */}
                      {reviewsTotal > 10 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            disabled={reviewsPage === 1}
                            onClick={() => fetchReviews(reviewsPage - 1, reviewsSort)}
                            className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-gray-400 disabled:opacity-30 hover:bg-white/10 transition-all"
                          >
                            ← Prev
                          </button>
                          <span className="text-xs text-gray-600">
                            Page {reviewsPage} of {Math.ceil(reviewsTotal / 10)}
                          </span>
                          <button
                            disabled={reviewsPage >= Math.ceil(reviewsTotal / 10)}
                            onClick={() => fetchReviews(reviewsPage + 1, reviewsSort)}
                            className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-gray-400 disabled:opacity-30 hover:bg-white/10 transition-all"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── CAST TAB ── */}
            {activeTab === "cast" && (
              <div>
                <p className="text-xs text-gray-500 mb-4">{cast.length} cast members</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {cast.map(actor => (
                    <div key={actor.id} onClick={() => navigate(`/actor/${actor.id}`)}
                      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-red-500/50 hover:bg-white/8 transition-all group">
                      <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0">
                        <img src={actor.profile_path
                          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=222&color=fff`}
                          alt={actor.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold line-clamp-1 group-hover:text-red-400 transition-colors">{actor.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{actor.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── CREW TAB ── */}
            {activeTab === "crew" && (
              <div className="space-y-6">
                {[
                  { title: "Direction", jobs: ["Director"] },
                  { title: "Writing", jobs: ["Writer","Screenplay","Story","Novel","Characters"] },
                  { title: "Production", jobs: ["Producer","Executive Producer"] },
                  { title: "Music", jobs: ["Original Music Composer","Music"] },
                  { title: "Cinematography", jobs: ["Director of Photography"] },
                  { title: "Editing", jobs: ["Editor"] },
                  { title: "Art & Design", jobs: ["Production Designer","Art Direction","Set Decoration"] },
                  { title: "Costume & Makeup", jobs: ["Costume Design","Makeup Department Head"] },
                ].map(({ title, jobs }) => {
                  const members = crew.filter(c => jobs.includes(c.job));
                  if (!members.length) return null;
                  return (
                    <div key={title}>
                      <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">{title}</h3>
                      <div className="flex flex-wrap gap-2">
                        {members.map(m => (
                          <div key={`${m.id}-${m.job}`}
                            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                              <img src={m.profile_path
                                ? `https://image.tmdb.org/t/p/w185${m.profile_path}`
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=333&color=fff`}
                                alt={m.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold">{m.name}</p>
                              <p className="text-xs text-gray-600">{m.job}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── DETAILS TAB ── */}
            {activeTab === "details" && (
              <div className="space-y-4">
                {[
                  ["Title", movie.title],
                  ["Original Title", movie.original_title],
                  ["Status", movie.status],
                  ["Release Date", movie.release_date],
                  ["Runtime", runtime],
                  ["Budget", movie.budget > 0 ? `$${movie.budget.toLocaleString()}` : "N/A"],
                  ["Box Office", movie.revenue > 0 ? `$${movie.revenue.toLocaleString()}` : "N/A"],
                  ["Original Language", movie.original_language?.toUpperCase()],
                  ["Spoken Languages", movie.spoken_languages?.map(l => l.english_name).join(", ")],
                  ["Production Countries", movie.production_countries?.map(c => c.name).join(", ")],
                  ["Production Companies", movie.production_companies?.map(c => c.name).join(", ")],
                  ["Tagline", movie.tagline],
                  ["TMDB ID", movie.id],
                  movie.imdb_id && ["IMDb ID", movie.imdb_id],
                ].filter(Boolean).filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex gap-4 py-3 border-b border-white/5">
                    <span className="text-gray-500 text-sm w-40 shrink-0">{label}</span>
                    <span className="text-sm text-gray-200">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── GENRES TAB ── */}
            {activeTab === "genres" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Genres</h3>
                  <div className="flex flex-wrap gap-3">
                    {movie.genres?.map(g => (
                      <button key={g.id}
                        onClick={() => navigate(`/genre/${g.name.toLowerCase().replace(/\s+/g, "-").replace("science fiction","sci-fi")}`)}
                        className="px-5 py-2.5 bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-500/50 rounded-xl text-sm font-semibold transition-all hover:text-red-400">
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>

                {keywords.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Keywords / Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map(k => (
                        <span key={k.id}
                          className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:border-white/20 transition-all cursor-default">
                          {k.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {movie.production_companies?.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Production Studios</h3>
                    <div className="flex flex-wrap gap-3">
                      {movie.production_companies.map(c => (
                        <div key={c.id} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                          {c.logo_path ? (
                            <img src={`https://image.tmdb.org/t/p/w92${c.logo_path}`}
                              alt={c.name} className="h-5 object-contain filter brightness-200" />
                          ) : (
                            <span className="text-sm text-gray-300">{c.name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Similar But Different */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <AISimilarMovies movie={movie} />
        </div>

        {/* Similar Movies */}
        {similar.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <Row title="More Like This" movies={similar} />
          </div>
        )}
      </div>

      {/* ── TRAILER MODAL ── */}
      {showTrailer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8"
          style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(10px)" }}
          onClick={() => setShowTrailer(false)}>
          <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-bold text-base truncate">{movie.title} — Trailer</p>
              <button onClick={() => setShowTrailer(false)} className="text-gray-400 hover:text-white ml-4 shrink-0 text-sm">✕ Close</button>
            </div>
            {trailerKey ? (
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10" style={{ paddingBottom: "56.25%" }}>
                <iframe key={trailerKey} className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                  title={`${movie.title} Trailer`} frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : (
              <div className="w-full rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4 py-16">
                <span className="text-5xl">🎬</span>
                <p className="text-white font-semibold">Trailer not available</p>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + " official trailer")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-all">
                  🔍 Search on YouTube
                </a>
              </div>
            )}
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-600">Press ESC to close</p>
              {trailerKey && (
                <a href={`https://www.youtube.com/watch?v=${trailerKey}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-red-400 hover:text-red-300 transition-colors">
                  Watch on YouTube ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Where to Watch Full Modal */}
      {showWhere && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowWhere(false)}>
          <div className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black">Where to Watch</h2>
                <p className="text-xs text-gray-500 mt-0.5">"{movie.title}"</p>
              </div>
              <button onClick={() => setShowWhere(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all">✕</button>
            </div>
            {!current ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">😔</div>
                <p className="text-gray-400 text-sm">Not available on streaming platforms right now</p>
                <button onClick={() => window.open(`https://www.google.com/search?q=Where+to+watch+${encodeURIComponent(movie.title)}`, "_blank")}
                  className="mt-4 px-5 py-2.5 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-medium transition-all">
                  🔍 Search on Google
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {["flatrate","rent","buy"].map(type => current[type]?.length > 0 && (
                  <div key={type}>
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                      {type === "flatrate" ? "Stream" : type === "rent" ? "Rent" : "Buy"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {current[type].map(p => (
                        <button key={p.provider_id}
                          onClick={() => window.open(getPlatformUrl(p.provider_name, movie.title), "_blank")}
                          className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all group">
                          <img src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                            alt={p.provider_name} className="w-9 h-9 rounded-lg object-cover" />
                          <span className="text-sm font-medium group-hover:text-red-400 transition-colors">{p.provider_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-white/5">
                  <button onClick={() => window.open(`https://www.themoviedb.org/movie/${movie.id}/watch`, "_blank")}
                    className="w-full py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-sm text-blue-400 font-medium transition-all">
                    View all options by country →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAuth && <AuthModal closeModal={closeLogin} />}
      <AIChatWidget movie={movie} />
    </div>
  );
}