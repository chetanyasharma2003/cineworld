import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Row from "../components/Row";
import ReviewForm from "../components/ReviewForm";
import AuthModal from "../components/AuthModal";
import { api, imageUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";

// My List helper
const useMyList = (movie) => {
  const { user } = useAuth();
  const [inList, setInList] = useState(false);

  useEffect(() => {
    const checkList = async () => {
      if (!movie) return;

      if (user) {
        try {
          const res = await api.get("/users/me/list");
          setInList((res.data.movies || []).some((m) => m.id === movie.id));
          return;
        } catch (err) {
          console.error(err);
        }
      }

      const saved = JSON.parse(localStorage.getItem("myList") || "[]");
      setInList(saved.some((m) => m.id === movie.id));
    };

    checkList();
  }, [movie, user]);

  const toggleList = async () => {
    if (!movie) return;

    if (user) {
      try {
        if (inList) await api.delete(`/users/me/list/${movie.id}`);
        else await api.post("/users/me/list", { movie });
        setInList(!inList);
        return;
      } catch (err) {
        console.error(err);
      }
    }

    const saved = JSON.parse(localStorage.getItem("myList") || "[]");
    let updated;
    if (saved.some((m) => m.id === movie.id)) {
      updated = saved.filter((m) => m.id !== movie.id);
      setInList(false);
    } else {
      updated = [movie, ...saved];
      setInList(true);
    }
    localStorage.setItem("myList", JSON.stringify(updated));
  };

  return { inList, toggleList };
};

// Platform URLs — jab user click kare toh seedha wahan jaaye
const PLATFORM_URLS = {
  "Netflix":            "https://www.netflix.com/search?q=",
  "Amazon Prime Video": "https://www.primevideo.com/search/ref=atv_nb_sr?phrase=",
  "Amazon Video":       "https://www.primevideo.com/search/ref=atv_nb_sr?phrase=",
  "Disney Plus":        "https://www.disneyplus.com/search/",
  "Disney+":            "https://www.disneyplus.com/search/",
  "Apple TV":           "https://tv.apple.com/search?term=",
  "Apple TV+":          "https://tv.apple.com/search?term=",
  "Hulu":               "https://www.hulu.com/search?q=",
  "JioCinema":          "https://www.jiocinema.com/search/",
  "Hotstar":            "https://www.hotstar.com/in/search?q=",
  "Disney+ Hotstar":    "https://www.hotstar.com/in/search?q=",
  "ZEE5":               "https://www.zee5.com/search?q=",
  "SonyLIV":            "https://www.sonyliv.com/search?q=",
  "Mubi":               "https://mubi.com/search/",
  "Peacock":            "https://www.peacocktv.com/search?q=",
  "Paramount Plus":     "https://www.paramountplus.com/search/",
  "Paramount+":         "https://www.paramountplus.com/search/",
  "YouTube":            "https://www.youtube.com/results?search_query=",
  "YouTube Premium":    "https://www.youtube.com/results?search_query=",
  "Google Play Movies": "https://play.google.com/store/search?q=",
  "Aha":                "https://www.aha.video/search?q=",
  "Sun NXT":            "https://www.sunnxt.com/search?q=",
  "MX Player":          "https://www.mxplayer.in/search?q=",
};

const getPlatformUrl = (providerName, movieTitle) => {
  const base = PLATFORM_URLS[providerName];
  if (base) return base + encodeURIComponent(movieTitle);
  return `https://www.google.com/search?q=${encodeURIComponent(movieTitle + " " + providerName + " watch online")}`;
};

// Where to Watch Modal
function WhereToWatchModal({ movie, providers, onClose }) {
  const inIndia = providers?.IN;
  const inUS    = providers?.US;
  const current = inIndia || inUS || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black">Where to Watch</h2>
            <p className="text-xs text-gray-500 mt-0.5">"{movie.title}"</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {!current ? (
          // No providers found
          <div className="text-center py-8">
            <div className="text-4xl mb-3">😔</div>
            <p className="text-gray-400 text-sm">Not available on any streaming platform right now.</p>
            <p className="text-gray-600 text-xs mt-2">Try searching on Google or check back later.</p>
            <button
              onClick={() => window.open(`https://www.google.com/search?q=Where+to+watch+${encodeURIComponent(movie.title)}`, "_blank")}
              className="mt-4 px-5 py-2.5 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-medium transition-all"
            >
              🔍 Search on Google
            </button>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Streaming — included in subscription */}
            {current.flatrate?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">
                  Stream — Included with subscription
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {current.flatrate.map((p) => (
                    <button
                      key={p.provider_id}
                      onClick={() => window.open(getPlatformUrl(p.provider_name, movie.title), "_blank")}
                      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all group"
                    >
                      <img
                        src={imageUrl(p.logo_path, "original")}
                        alt={p.provider_name}
                        className="w-9 h-9 rounded-lg object-cover"
                      />
                      <span className="text-sm font-medium text-left leading-tight group-hover:text-red-400 transition-colors">
                        {p.provider_name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rent */}
            {current.rent?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">
                  Rent
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {current.rent.map((p) => (
                    <button
                      key={p.provider_id}
                      onClick={() => window.open(getPlatformUrl(p.provider_name, movie.title), "_blank")}
                      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all group"
                    >
                      <img
                        src={imageUrl(p.logo_path, "original")}
                        alt={p.provider_name}
                        className="w-9 h-9 rounded-lg object-cover"
                      />
                      <span className="text-sm font-medium text-left leading-tight group-hover:text-red-400 transition-colors">
                        {p.provider_name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Buy */}
            {current.buy?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">
                  Buy
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {current.buy.map((p) => (
                    <button
                      key={p.provider_id}
                      onClick={() => window.open(getPlatformUrl(p.provider_name, movie.title), "_blank")}
                      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all group"
                    >
                      <img
                        src={imageUrl(p.logo_path, "original")}
                        alt={p.provider_name}
                        className="w-9 h-9 rounded-lg object-cover"
                      />
                      <span className="text-sm font-medium text-left leading-tight group-hover:text-red-400 transition-colors">
                        {p.provider_name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TMDB Link */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <button
                onClick={() => window.open(`https://www.themoviedb.org/movie/${movie.id}/watch`, "_blank")}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#01b4e4]/10 hover:bg-[#01b4e4]/20 border border-[#01b4e4]/30 rounded-xl text-sm font-medium text-[#01b4e4] transition-all"
              >
                <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" className="h-3" alt="TMDB" />
                View all streaming options by country
              </button>
              <p className="text-xs text-gray-700 text-center">
                Powered by TMDB • JustWatch
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StarRating({ score }) {
  const stars = Math.round(score / 2);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= stars ? "text-yellow-400 text-lg" : "text-gray-600 text-lg"}>★</span>
      ))}
      <span className="text-gray-400 text-sm ml-2">{score?.toFixed(1)} / 10</span>
    </div>
  );
}

function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie]         = useState(null);
  const [similar, setSimilar]     = useState([]);
  const [cast, setCast]           = useState([]);
  const [reviews, setReviews]     = useState([]);
  const [trailerKey, setTrailerKey] = useState(null);
  const [providers, setProviders] = useState(null);
  const [showAuth, setShowAuth]   = useState(false);
  const [showWhere, setShowWhere] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [ratingData, setRatingData] = useState(null);
  const { inList, toggleList }    = useMyList(movie);

  const openLogin  = () => setShowAuth(true);
  const closeLogin = () => setShowAuth(false);

  // Trailer → YouTube
  const handleTrailer = () => {
    if (trailerKey) {
      window.open(`https://www.youtube.com/watch?v=${trailerKey}`, "_blank");
    } else {
      window.open(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + " official trailer")}`,
        "_blank"
      );
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setImgLoaded(false);
    setMovie(null);
    setProviders(null);

    const fetchMovieDetails = async () => {
      try {
        const res = await api.get(`/movies/${id}`);

        setMovie(res.data.movie);
        setSimilar(res.data.similar || []);
        setCast(res.data.cast || []);
        setProviders(res.data.providers || {});
        setReviews(res.data.reviews || []);
        setTrailerKey(res.data.trailerKey || null);

        // Fetch community rating
        try {
          const ratingRes = await api.get(`/reviews/${id}/rating`);
          setRatingData(ratingRes.data);
        } catch {}
      } catch (err) {
        console.error("Movie detail error:", err);
      }
    };

    fetchMovieDetails();
  }, [id]);

  useEffect(() => {
    document.body.style.overflow = (showAuth || showWhere) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showAuth, showWhere]);

  if (!movie) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading movie details...</p>
        </div>
      </div>
    );
  }

  const releaseYear = movie.release_date?.split("-")[0];
  const hours   = Math.floor(movie.runtime / 60);
  const mins    = movie.runtime % 60;
  const runtime = `${hours}h ${mins}m`;

  // Check if any providers available
  const hasProviders = providers && (
    providers?.IN?.flatrate?.length ||
    providers?.IN?.rent?.length ||
    providers?.IN?.buy?.length ||
    providers?.US?.flatrate?.length ||
    providers?.US?.rent?.length ||
    providers?.US?.buy?.length
  );

  return (
    <div className="bg-[#0f0f0f] text-white min-h-screen">

      {/* HERO BANNER */}
      <div className="relative w-full h-[70vh] overflow-hidden">
        <img
          src={imageUrl(movie.backdrop_path, "original")}
          alt={movie.title}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-black/20" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-6 flex items-center gap-2 text-sm bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-black/60 transition-all border border-white/10 z-10"
        >
          ← Back
        </button>

        <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-2xl">
          <div className="flex flex-wrap gap-2 mb-3">
            {movie.genres?.map((g) => (
              <span key={g.id} className="text-xs px-3 py-1 rounded-full bg-red-600/80 font-medium tracking-wide">
                {g.name}
              </span>
            ))}
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 leading-none">
            {movie.title}
          </h1>

          {movie.tagline && (
            <p className="text-gray-400 italic text-sm mb-3">"{movie.tagline}"</p>
          )}

          <div className="flex items-center gap-3 text-sm text-gray-300 mb-5">
            <span className="text-yellow-400 font-bold text-base">★ {movie.vote_average?.toFixed(1)}</span>
            <span className="text-gray-600">•</span>
            <span>{releaseYear}</span>
            <span className="text-gray-600">•</span>
            <span>{runtime}</span>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-wrap gap-3">
            {/* Where to Watch — main CTA */}
            <button
              onClick={() => setShowWhere(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              📺 Where to Watch
              {hasProviders && (
                <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full font-bold">
                  Available
                </span>
              )}
            </button>

            {/* Trailer */}
            <button
              onClick={handleTrailer}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg font-semibold text-sm transition-all hover:scale-105 active:scale-95"
            >
              🎬 Watch Trailer
            </button>

            {/* My List */}
            <button
              onClick={toggleList}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-105 active:scale-95 border ${
                inList
                  ? "bg-green-600/20 border-green-500/50 text-green-400 hover:bg-green-600/30"
                  : "bg-white/10 border-white/20 hover:bg-white/20"
              }`}
            >
              {inList ? "✓ In My List" : "+ My List"}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="px-6 md:px-12 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Left: Poster + Stats */}
          <div className="lg:w-1/4 shrink-0">
            <img
              src={imageUrl(movie.poster_path, "w500")}
              alt={movie.title}
              className="w-full max-w-[240px] mx-auto lg:mx-0 rounded-xl shadow-2xl ring-1 ring-white/10"
            />

            <div className="mt-4 bg-white/5 rounded-xl p-4 space-y-3 text-sm ring-1 ring-white/10">
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className={movie.status === "Released" ? "text-green-400 font-medium" : "text-yellow-400 font-medium"}>
                  {movie.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Release</span>
                <span>{movie.release_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Runtime</span>
                <span>{runtime}</span>
              </div>
              {movie.budget > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Budget</span>
                  <span>${(movie.budget / 1_000_000).toFixed(0)}M</span>
                </div>
              )}
              {movie.revenue > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Revenue</span>
                  <span>${(movie.revenue / 1_000_000).toFixed(0)}M</span>
                </div>
              )}
              {movie.belongs_to_collection && (
                <div className="pt-1 border-t border-white/10">
                  <span className="text-gray-400 block mb-1">Collection</span>
                  <span className="text-xs text-red-400">{movie.belongs_to_collection.name}</span>
                </div>
              )}

              {/* Mini streaming badges in sidebar */}
              {(providers?.IN?.flatrate || providers?.US?.flatrate) && (
                <div className="pt-2 border-t border-white/10">
                  <span className="text-gray-400 block mb-2 text-xs">Streaming on</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(providers?.IN?.flatrate || providers?.US?.flatrate || []).slice(0, 4).map((p) => (
                      <img
                        key={p.provider_id}
                            src={imageUrl(p.logo_path, "original")}
                        alt={p.provider_name}
                        title={p.provider_name}
                        className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:scale-110 transition-all"
                        onClick={() => setShowWhere(true)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex-1 space-y-8">

            <div>
              <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-2">User Rating</h2>
              <StarRating score={movie.vote_average} />
              <div className="mt-2 w-full max-w-xs bg-gray-800 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-yellow-600 to-yellow-300 h-1.5 rounded-full"
                  style={{ width: `${(movie.vote_average / 10) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{movie.vote_count?.toLocaleString()} votes</p>
            </div>

            <div>
              <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Overview</h2>
              <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
            </div>

            {cast.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Top Cast</h2>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {cast.map((actor) => (
                    <div key={actor.id} className="flex flex-col items-center min-w-[72px] group">
                      <div className="w-14 h-20 rounded-lg overflow-hidden mb-2 ring-1 ring-white/10 group-hover:ring-red-500 transition-all">
                        <img
                          src={
                            actor.profile_path
                              ? imageUrl(actor.profile_path, "w185")
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=222&color=fff`
                          }
                          alt={actor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs font-medium text-center leading-tight">{actor.name}</p>
                      <p className="text-xs text-gray-500 text-center leading-tight mt-0.5">{actor.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">
                Reviews {reviews.length > 0 && <span className="text-red-500 normal-case">({reviews.length})</span>}
              </h2>
              <ReviewForm
                movieId={id}
                setReviews={setReviews}
                openLogin={openLogin}
                ratingData={ratingData}
                setRatingData={setRatingData}
              />
              {reviews.length > 0 && (
                <div className="mt-4 space-y-3">
                  {reviews.map((r) => (
                    <div key={r._id || r.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                      {/* Star rating on review */}
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
                        <p className="text-xs text-gray-600">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                          }) : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <Row title="Similar Movies" movies={similar} />
          </div>
        )}
      </div>

      {/* Where to Watch Modal */}
      {showWhere && (
        <WhereToWatchModal
          movie={movie}
          providers={providers}
          onClose={() => setShowWhere(false)}
        />
      )}

      {showAuth && <AuthModal closeModal={closeLogin} />}
    </div>
  );
}

export default MovieDetail;