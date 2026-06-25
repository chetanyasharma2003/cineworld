import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { SkeletonTVShows } from "../components/Skeletons";

import { tmdbGet } from "../lib/tmdb";
const tmdb = (url) => tmdbGet(url);

const GENRE_MAP = {
  10759: "Action", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 10762: "Kids",
  9648: "Mystery", 10763: "News", 10764: "Reality", 10765: "Sci-Fi",
  10766: "Soap", 10767: "Talk", 10768: "War", 37: "Western"
};

function ShowCard({ show, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const genres = (show.genre_ids || []).slice(0, 2).map(id => GENRE_MAP[id]).filter(Boolean);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`cursor-pointer group shrink-0 transition-all duration-300 ${hovered ? "scale-105 z-10" : "scale-100"}`}
      style={{ width: "150px" }}
    >
      <div className="relative rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-red-500/50 transition-all shadow-lg">
        {!loaded && <div className="absolute inset-0 bg-gray-800 animate-pulse" style={{ aspectRatio: "2/3" }} />}
        <img
          src={show.poster_path
            ? `https://image.tmdb.org/t/p/w300${show.poster_path}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(show.name)}&background=222&color=fff&size=300`}
          alt={show.name}
          onLoad={() => setLoaded(true)}
          className={`w-full object-cover transition-all duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${hovered ? "scale-105" : "scale-100"}`}
          style={{ aspectRatio: "2/3" }}
        />

        {/* Overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex flex-wrap gap-1 mb-1">
              {genres.map(g => (
                <span key={g} className="text-xs px-1.5 py-0.5 bg-red-600/80 rounded text-white">{g}</span>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-xs">★ {show.vote_average?.toFixed(1)}</span>
              <span className="text-gray-400 text-xs">· {show.first_air_date?.split("-")[0]}</span>
            </div>
          </div>
        </div>

        {/* Rating badge always visible */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded">
          ★ {show.vote_average?.toFixed(1)}
        </div>
      </div>

      <p className="text-xs font-medium mt-2 line-clamp-1 text-gray-300 px-0.5">{show.name}</p>
      <p className="text-xs text-gray-600 mt-0.5 px-0.5">{show.first_air_date?.split("-")[0]}</p>
    </div>
  );
}

function ShowRow({ title, shows, onShowClick }) {
  if (!shows?.length) return null;
  return (
    <div className="mb-8 px-6 md:px-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-5 bg-red-500 rounded-full" />
        <h2 className="text-base md:text-lg font-bold">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
        {shows.map((show) => (
          <ShowCard key={show.id} show={show} onClick={() => onShowClick(show.id)} />
        ))}
      </div>
    </div>
  );
}

const TV_GENRES = [
  { id: 10759, name: "Action" }, { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" }, { id: 18, name: "Drama" },
  { id: 10765, name: "Sci-Fi" }, { id: 9648, name: "Mystery" },
  { id: 10751, name: "Family" }, { id: 16, name: "Animation" },
];

export default function TVShows() {
  const navigate = useNavigate();
  const [sections, setSections] = useState({});
  const [loading, setLoading]   = useState(true);
  const [featured, setFeatured] = useState(null);
  const [featLoaded, setFeatLoaded] = useState(false);
  const [activeGenre, setActiveGenre] = useState(null);
  const [genreShows, setGenreShows]   = useState([]);
  const [genreLoading, setGenreLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [trending, popular, topRated, netflix, action, comedy, crime, drama, animation] =
          await Promise.all([
            tmdb("/trending/tv/week"),
            tmdb("/tv/popular"),
            tmdb("/tv/top_rated"),
            tmdb("/discover/tv?with_networks=213&sort_by=popularity.desc"),
            tmdb("/discover/tv?with_genres=10759&sort_by=popularity.desc"),
            tmdb("/discover/tv?with_genres=35&sort_by=popularity.desc"),
            tmdb("/discover/tv?with_genres=80&sort_by=popularity.desc"),
            tmdb("/discover/tv?with_genres=18&sort_by=popularity.desc"),
            tmdb("/discover/tv?with_genres=16&sort_by=popularity.desc"),
          ]);

        setSections({
          trending:  trending.results || [],
          popular:   popular.results || [],
          topRated:  topRated.results || [],
          netflix:   netflix.results || [],
          action:    action.results || [],
          comedy:    comedy.results || [],
          crime:     crime.results || [],
          drama:     drama.results || [],
          animation: animation.results || [],
        });
        setFeatured((trending.results || [])[0] || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleGenreClick = async (genre) => {
    if (activeGenre?.id === genre.id) {
      setActiveGenre(null);
      setGenreShows([]);
      return;
    }
    setActiveGenre(genre);
    setGenreLoading(true);
    try {
      const res = await tmdb(`/discover/tv?with_genres=${genre.id}&sort_by=popularity.desc`);
      setGenreShows(res.results || []);
    } catch {}
    finally { setGenreLoading(false); }
  };

  const goToShow = (id) => navigate(`/tv/${id}`);

  if (loading) return <><Navbar /><SkeletonTVShows /></>;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white">
      <Navbar />

      {/* Featured Banner */}
      {featured && (
        <div className="relative w-full overflow-hidden" style={{ height: "60vh" }}>
          <img
            src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`}
            alt={featured.name}
            onLoad={() => setFeatLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-700 ${featLoaded ? "opacity-100" : "opacity-0"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30" />

          <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-2xl">
            <span className="text-xs px-3 py-1 rounded-full font-bold tracking-wider uppercase mb-3 inline-block bg-red-600/20 border border-red-500/40 text-red-400">
              📺 Trending Show
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">{featured.name}</h1>

            {/* Genre pills on banner */}
            <div className="flex flex-wrap gap-2 mb-3">
              {(featured.genre_ids || []).slice(0, 3).map(id => GENRE_MAP[id]).filter(Boolean).map(g => (
                <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-white/10 border border-white/20">{g}</span>
              ))}
            </div>

            <p className="text-gray-300 text-sm leading-relaxed mb-5 line-clamp-2">{featured.overview}</p>
            <div className="flex gap-3 items-center">
              <button onClick={() => goToShow(featured.id)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-200 transition-all hover:scale-105">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                View Details
              </button>
              <div className="flex items-center gap-2 px-4 py-3 bg-white/10 rounded-lg text-sm border border-white/10">
                <span className="text-yellow-400">★</span>
                <span className="font-bold">{featured.vote_average?.toFixed(1)}</span>
                <span className="text-gray-500 text-xs">({featured.vote_count?.toLocaleString()})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Genre Filter Chips */}
      <div className="px-6 md:px-12 pt-8 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {TV_GENRES.map(g => (
            <button key={g.id}
              onClick={() => handleGenreClick(g)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeGenre?.id === g.id
                  ? "bg-red-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10"
              }`}>
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Genre Results */}
      {activeGenre && (
        <div className="px-6 md:px-12 py-4">
          {genreLoading ? (
            <div className="flex gap-3 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-[150px] h-[220px] rounded-xl bg-gray-800 animate-pulse shrink-0" />
              ))}
            </div>
          ) : (
            <ShowRow title={`${activeGenre.name} Shows`} shows={genreShows} onShowClick={goToShow} />
          )}
        </div>
      )}

      {/* All Sections */}
      <div className="pt-4 pb-16">
        <ShowRow title="🔥 Trending This Week" shows={sections.trending} onShowClick={goToShow} />
        <ShowRow title="🌟 Popular Shows"       shows={sections.popular}  onShowClick={goToShow} />
        <ShowRow title="⭐ Top Rated All Time"  shows={sections.topRated} onShowClick={goToShow} />
        <ShowRow title="🎭 Netflix Originals"   shows={sections.netflix}  onShowClick={goToShow} />
        <ShowRow title="💥 Action & Adventure"  shows={sections.action}   onShowClick={goToShow} />
        <ShowRow title="😂 Comedy"              shows={sections.comedy}   onShowClick={goToShow} />
        <ShowRow title="🔪 Crime & Thriller"    shows={sections.crime}    onShowClick={goToShow} />
        <ShowRow title="🎭 Drama"               shows={sections.drama}    onShowClick={goToShow} />
        <ShowRow title="🎪 Animation"           shows={sections.animation} onShowClick={goToShow} />
      </div>
    </div>
  );
}