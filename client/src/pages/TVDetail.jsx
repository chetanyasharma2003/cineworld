import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import { SkeletonTVDetail } from "../components/Skeletons";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";

import { tmdbGet } from "../lib/tmdb";
const tmdb = (url) => tmdbGet(url);

const PLATFORM_URLS = {
  "Netflix": "https://www.netflix.com/search?q=",
  "Amazon Prime Video": "https://www.primevideo.com/search/ref=atv_nb_sr?phrase=",
  "Disney+": "https://www.disneyplus.com/search/",
  "Disney Plus": "https://www.disneyplus.com/search/",
  "Apple TV+": "https://tv.apple.com/search?term=",
  "Hulu": "https://www.hulu.com/search?q=",
  "JioCinema": "https://www.jiocinema.com/search/",
  "Hotstar": "https://www.hotstar.com/in/search?q=",
  "Disney+ Hotstar": "https://www.hotstar.com/in/search?q=",
  "ZEE5": "https://www.zee5.com/search?q=",
  "SonyLIV": "https://www.sonyliv.com/search?q=",
  "Peacock": "https://www.peacocktv.com/search?q=",
  "Paramount+": "https://www.paramountplus.com/search/",
};
const getPlatformUrl = (name, title) => {
  const base = PLATFORM_URLS[name];
  return base ? base + encodeURIComponent(title)
    : `https://www.google.com/search?q=${encodeURIComponent(title + " " + name)}`;
};

export default function TVDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [show, setShow]               = useState(null);
  const [cast, setCast]               = useState([]);
  const [similar, setSimilar]         = useState([]);
  const [trailerKey, setTrailerKey]   = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [imgLoaded, setImgLoaded]     = useState(false);
  const [season, setSeason]           = useState(1);
  const [providers, setProviders]     = useState(null);
  const [showWhere, setShowWhere]     = useState(false);

  const { addMovie: addToHistory } = useRecentlyViewed();

  useEffect(() => {
    window.scrollTo(0, 0);
    setShow(null);
    setImgLoaded(false);
    setProviders(null);

    const fetchAll = async () => {
      try {
        const [showRes, creditsRes, similarRes, videosRes, providersRes] = await Promise.all([
          tmdb(`/tv/${id}`),
          tmdb(`/tv/${id}/credits`),
          tmdb(`/tv/${id}/similar`),
          tmdb(`/tv/${id}/videos`),
          tmdb(`/tv/${id}/watch/providers`),
        ]);

        setShow(showRes);
        addToHistory({ ...showRes, title: showRes.name, release_date: showRes.first_air_date, _mediaType: "tv" });
        setCast((creditsRes.cast || []).slice(0, 8));
        setSimilar((similarRes.results || []).slice(0, 12).filter(s => s.poster_path));
        setProviders(providersRes.results || {});

        const trailer =
          (videosRes.results || []).find(v => v.type === "Trailer" && v.site === "YouTube") ||
          (videosRes.results || []).find(v => v.site === "YouTube");
        setTrailerKey(trailer?.key || null);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAll();
  }, [id]);

  useEffect(() => {
    document.body.style.overflow = (showTrailer || showWhere) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showTrailer, showWhere]);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") { setShowTrailer(false); setShowWhere(false); }
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  if (!show) return <><Navbar /><SkeletonTVDetail /></>;

  const year      = show.first_air_date?.split("-")[0];
  const seasons   = show.number_of_seasons;
  const episodes  = show.number_of_episodes;

  const hasIN    = providers?.IN;
  const hasUS    = providers?.US;
  const current  = hasIN || hasUS || null;
  const hasProviders = current && (current.flatrate?.length || current.rent?.length || current.buy?.length);

  const ogImage = show.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}`
    : show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : "";

  return (
    <div className="bg-[#0f0f0f] min-h-screen text-white">
      <Helmet>
        <title>{`${show.name} (${year}) — CineWorld`}</title>
        <meta name="description" content={show.overview?.slice(0, 155)} />
        <meta property="og:title" content={`${show.name} (${year})`} />
        <meta property="og:description" content={show.overview?.slice(0, 155)} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="video.tv_show" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${show.name} (${year})`} />
        <meta name="twitter:description" content={show.overview?.slice(0, 155)} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      <Navbar />

      {/* Hero */}
      <div className="relative w-full h-[70vh] overflow-hidden">
        <img
          src={`https://image.tmdb.org/t/p/original${show.backdrop_path}`}
          alt={show.name}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-black/20" />

        <button onClick={() => navigate(-1)}
          className="absolute top-20 left-6 flex items-center gap-2 text-sm bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-black/60 transition-all border border-white/10 z-10">
          ← Back
        </button>

        <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-2xl">
          <div className="flex flex-wrap gap-2 mb-3">
            {show.genres?.map(g => (
              <span key={g.id} className="text-xs px-3 py-1 rounded-full bg-red-600/80 font-medium">{g.name}</span>
            ))}
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 leading-none">{show.name}</h1>
          {show.tagline && <p className="text-gray-400 italic text-sm mb-3">"{show.tagline}"</p>}

          <div className="flex items-center gap-3 text-sm text-gray-300 mb-5 flex-wrap">
            <span className="text-yellow-400 font-bold text-base">★ {show.vote_average?.toFixed(1)}</span>
            <span className="text-gray-600">•</span>
            <span>{year}</span>
            <span className="text-gray-600">•</span>
            <span className="text-red-400 font-medium">📺 {seasons} Season{seasons > 1 ? "s" : ""}</span>
            <span className="text-gray-600">•</span>
            <span>{episodes} Episodes</span>
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
            <button
              onClick={async () => {
                const shareData = { title: show.name, text: `Check out "${show.name}" on CineWorld!`, url: window.location.href };
                if (navigator.share) { try { await navigator.share(shareData); } catch {} }
                else { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-sm transition-all hover:scale-105">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 md:px-12 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Left */}
          <div className="lg:w-64 shrink-0 space-y-5">
            <img
              src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
              alt={show.name}
              className="w-full max-w-[200px] mx-auto lg:mx-0 rounded-2xl shadow-2xl ring-1 ring-white/10"
            />

            {/* Where to Watch Sidebar */}
            <div className="bg-white/5 rounded-2xl p-4 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Where to Watch</p>
              {!current ? (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-500 mb-2">Not streaming right now</p>
                  <button onClick={() => window.open(`https://www.google.com/search?q=Watch+${encodeURIComponent(show.name)}+online+streaming`, "_blank")}
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
                            onClick={() => window.open(getPlatformUrl(p.provider_name, show.name), "_blank")}
                            title={p.provider_name} className="hover:scale-110 transition-all">
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
                            onClick={() => window.open(getPlatformUrl(p.provider_name, show.name), "_blank")}
                            title={p.provider_name} className="hover:scale-110 transition-all">
                            <img src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                              alt={p.provider_name} className="w-9 h-9 rounded-lg object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => window.open(`https://www.themoviedb.org/tv/${show.id}/watch`, "_blank")}
                    className="w-full py-2 text-xs text-blue-400 hover:text-blue-300 transition-colors text-center border-t border-white/5 pt-3">
                    All services →
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 bg-white/5 rounded-2xl p-4 space-y-3 text-sm ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-widest text-gray-500">Details</p>
              {[
                ["Status", show.status, show.status === "Ended" ? "text-red-400" : "text-green-400"],
                ["First Air", show.first_air_date, ""],
                show.last_air_date && ["Last Air", show.last_air_date, ""],
                ["Seasons", seasons, "text-red-400 font-bold"],
                ["Episodes", episodes, "font-bold"],
                show.networks?.[0] && ["Network", show.networks[0].name, "text-xs"],
              ].filter(Boolean).map(([label, value, cls]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-gray-500 shrink-0">{label}</span>
                  <span className={`text-right text-xs ${cls}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* External links */}
            <a href={`https://www.themoviedb.org/tv/${show.id}`} target="_blank" rel="noopener noreferrer"
              className="block w-full py-2 text-center text-xs font-bold bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-xl transition-all">
              TMDB ↗
            </a>
          </div>

          {/* Right */}
          <div className="flex-1 space-y-8">

            {/* Rating */}
            <div className="pb-6 border-b border-white/10">
              <div className="flex items-center gap-2 mb-2">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className={`text-lg ${s <= Math.round(show.vote_average/2) ? "text-yellow-400" : "text-gray-700"}`}>★</span>
                ))}
                <span className="text-gray-400 text-sm ml-1">{show.vote_average?.toFixed(1)} / 10</span>
              </div>
              <p className="text-xs text-gray-600">{show.vote_count?.toLocaleString()} votes</p>
            </div>

            {/* Overview */}
            <div>
              <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Overview</h2>
              <p className="text-gray-300 leading-relaxed">{show.overview}</p>
            </div>

            {/* Seasons */}
            {seasons > 1 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Seasons</h2>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: seasons }, (_, i) => i + 1).map(s => (
                    <button key={s} onClick={() => setSeason(s)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        season === s ? "bg-red-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}>
                      S{s}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Season {season} selected</p>
              </div>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Top Cast</h2>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {cast.map(actor => (
                    <div key={actor.id} onClick={() => navigate(`/actor/${actor.id}`)}
                      className="flex flex-col items-center min-w-[72px] group cursor-pointer">
                      <div className="w-14 h-20 rounded-lg overflow-hidden mb-2 ring-1 ring-white/10 group-hover:ring-red-500 transition-all">
                        <img
                          src={actor.profile_path
                            ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=222&color=fff`}
                          alt={actor.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all"
                        />
                      </div>
                      <p className="text-xs font-medium text-center leading-tight group-hover:text-red-400 transition-colors">{actor.name}</p>
                      <p className="text-xs text-gray-500 text-center leading-tight mt-0.5">{actor.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Shows */}
        {similar.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 bg-red-500 rounded-full" />
              <h2 className="text-base font-bold">Similar Shows</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
              {similar.map(s => (
                <div key={s.id} onClick={() => navigate(`/tv/${s.id}`)}
                  className="cursor-pointer group shrink-0 w-[130px]">
                  <div className="rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-red-500/50 group-hover:scale-105 transition-all">
                    <img src={`https://image.tmdb.org/t/p/w300${s.poster_path}`}
                      alt={s.name} className="w-full aspect-[2/3] object-cover" />
                  </div>
                  <p className="text-xs mt-1.5 line-clamp-1 text-gray-400">{s.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8"
          style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(10px)" }}
          onClick={() => setShowTrailer(false)}>
          <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-bold truncate">{show.name} — Trailer</p>
              <button onClick={() => setShowTrailer(false)} className="text-gray-400 hover:text-white ml-4 shrink-0 text-sm">✕ Close</button>
            </div>
            {trailerKey ? (
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10" style={{ paddingBottom: "56.25%" }}>
                <iframe key={trailerKey} className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                  title={`${show.name} Trailer`} frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : (
              <div className="w-full rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4 py-16">
                <span className="text-5xl">📺</span>
                <p className="text-white font-semibold">Trailer not available</p>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(show.name + " official trailer")}`}
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

      {/* Where to Watch Modal */}
      {showWhere && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowWhere(false)}>
          <div className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black">Where to Watch</h2>
                <p className="text-xs text-gray-500 mt-0.5">"{show.name}"</p>
              </div>
              <button onClick={() => setShowWhere(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all">✕</button>
            </div>
            {!current ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">😔</div>
                <p className="text-gray-400 text-sm">Not available on streaming platforms right now</p>
                <button onClick={() => window.open(`https://www.google.com/search?q=Where+to+watch+${encodeURIComponent(show.name)}`, "_blank")}
                  className="mt-4 px-5 py-2.5 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-medium transition-all">
                  🔍 Search on Google
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {["flatrate", "rent", "buy"].map(type => current[type]?.length > 0 && (
                  <div key={type}>
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                      {type === "flatrate" ? "Stream" : type === "rent" ? "Rent" : "Buy"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {current[type].map(p => (
                        <button key={p.provider_id}
                          onClick={() => window.open(getPlatformUrl(p.provider_name, show.name), "_blank")}
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
                  <button onClick={() => window.open(`https://www.themoviedb.org/tv/${show.id}/watch`, "_blank")}
                    className="w-full py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-sm text-blue-400 font-medium transition-all">
                    View all options by country →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
