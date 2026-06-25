import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

import { tmdbGet } from "../lib/tmdb";
const tmdb = (path) => tmdbGet(path);

// ── Country config ──────────────────────────────────────────────────────────
const COUNTRIES = [
  { code: "all", flag: "🌍", label: "All",      lang: null  },
  { code: "us",  flag: "🇺🇸", label: "USA",     lang: "en"  },
  { code: "in",  flag: "🇮🇳", label: "India",   lang: "hi"  },
  { code: "kr",  flag: "🇰🇷", label: "Korea",   lang: "ko"  },
  { code: "jp",  flag: "🇯🇵", label: "Japan",   lang: "ja"  },
  { code: "fr",  flag: "🇫🇷", label: "France",  lang: "fr"  },
  { code: "es",  flag: "🇪🇸", label: "Spain",   lang: "es"  },
  { code: "it",  flag: "🇮🇹", label: "Italy",   lang: "it"  },
  { code: "de",  flag: "🇩🇪", label: "Germany", lang: "de"  },
  { code: "br",  flag: "🇧🇷", label: "Brazil",  lang: "pt"  },
  { code: "cn",  flag: "🇨🇳", label: "China",   lang: "zh"  },
  { code: "th",  flag: "🇹🇭", label: "Thailand",lang: "th"  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

// Fetch globally popular actors, paginated
async function fetchPopularActors(page) {
  const data = await tmdb(`/person/popular?page=${page}`);
  return {
    people: (data.results || []).filter((p) => p.profile_path && p.known_for_department === "Acting"),
    totalPages: data.total_pages || 1,
  };
}

// Fetch actors from top movies of a specific language
// Strategy: discover top movies → batch credits fetch (3 at a time) → deduplicate
async function fetchActorsByLanguage(lang, page) {
  const d1 = await tmdb(`/discover/movie?with_original_language=${lang}&sort_by=popularity.desc&vote_count.gte=200&page=${page}`);
  const movieIds = (d1.results || []).map((m) => m.id).slice(0, 5); // cap at 5 to avoid 429

  if (!movieIds.length) return { people: [], totalPages: 1 };

  // Fetch credits in batches of 3 to avoid rate limiting
  const allCredits = [];
  for (let i = 0; i < movieIds.length; i += 3) {
    const batch = movieIds.slice(i, i + 3);
    const results = await Promise.all(batch.map((id) => tmdb(`/movie/${id}/credits`)));
    allCredits.push(...results);
    if (i + 3 < movieIds.length) await new Promise(r => setTimeout(r, 300));
  }

  // Merge all cast, deduplicate by person id, filter actors with profile photo
  const seen = new Set();
  const merged = [];
  for (const c of allCredits) {
    for (const person of c.cast || []) {
      if (!seen.has(person.id) && person.profile_path) {
        seen.add(person.id);
        merged.push(person);
      }
    }
  }

  merged.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || (b.popularity ?? 0) - (a.popularity ?? 0));

  return {
    people: merged.slice(0, 30),
    totalPages: Math.min(d1.total_pages ?? 1, 10),
  };
}

// Search actors by name
async function searchActors(query, page) {
  const data = await tmdb(`/search/person?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`);
  return {
    people: (data.results || []).filter((p) => p.profile_path),
    totalPages: data.total_pages || 1,
  };
}

// ── Actor Card ───────────────────────────────────────────────────────────────
function ActorCard({ person, rank }) {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  const knownFor = (person.known_for || [])
    .map((k) => k.title || k.name)
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");

  const popularity = Math.min(Math.round((person.popularity ?? 0) / 3), 100);

  return (
    <div
      onClick={() => navigate(`/actor/${person.id}`)}
      className="group cursor-pointer relative"
    >
      {/* Photo */}
      <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 group-hover:ring-red-500/60 transition-all duration-300 group-hover:scale-[1.03]">
        {!loaded && <div className="skeleton absolute inset-0" />}
        <img
          src={`https://image.tmdb.org/t/p/w300${person.profile_path}`}
          alt={person.name}
          onLoad={() => setLoaded(true)}
          className={`w-full aspect-[2/3] object-cover object-top transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            {knownFor && (
              <p className="text-[10px] text-gray-300 line-clamp-2 leading-relaxed">
                Known for: <span className="text-white">{knownFor}</span>
              </p>
            )}
          </div>
        </div>

        {/* Rank badge */}
        {rank <= 10 && (
          <div className="absolute top-2 left-2 w-6 h-6 bg-red-600 rounded-lg text-xs font-black flex items-center justify-center shadow-lg">
            {rank}
          </div>
        )}

        {/* Popularity badge */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-lg text-[10px] text-yellow-400 font-bold">
          🔥 {person.popularity?.toFixed(0)}
        </div>
      </div>

      {/* Info */}
      <div className="mt-2.5 px-0.5">
        <p className="text-sm font-bold truncate group-hover:text-red-400 transition-colors">{person.name}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-gray-500">{person.known_for_department || "Actor"}</span>
          {/* Popularity bar */}
          <div className="flex items-center gap-1">
            <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${popularity}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton grid ─────────────────────────────────────────────────────────────
function ActorSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="skeleton w-full aspect-[2/3] rounded-2xl" />
          <div className="skeleton h-3 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Actors() {
  const [country, setCountry]   = useState("all");
  const [query, setQuery]       = useState("");
  const [people, setPeople]     = useState([]);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotal]  = useState(1);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setMore]  = useState(false);
  const debounceRef             = useRef(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === country);

  const load = useCallback(async (q, cCode, pg, append = false) => {
    if (!append) setLoading(true);
    else setMore(true);

    try {
      const lang = COUNTRIES.find((c) => c.code === cCode)?.lang ?? null;
      let result;

      if (q.trim()) {
        result = await searchActors(q.trim(), pg);
        // Client-side country filter when both query + country are set
        if (lang && cCode !== "us") {
          result.people = result.people.filter((p) =>
            (p.known_for || []).some((k) => k.original_language === lang)
          );
        }
      } else if (!lang) {
        result = await fetchPopularActors(pg);
      } else {
        result = await fetchActorsByLanguage(lang, pg);
      }

      setPeople((prev) => (append ? [...prev, ...result.people] : result.people));
      setTotal(result.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setMore(false);
    }
  }, []);

  // Single effect — fires on country OR query change
  const isFirstMount = useRef(true);
  useEffect(() => {
    // Skip — the query debounce effect handles initial load too
  }, [country]);

  // On search query change — debounced (also handles initial load)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const delay = isFirstMount.current ? 0 : 400;
    isFirstMount.current = false;
    debounceRef.current = setTimeout(() => {
      setPeople([]);
      setPage(1);
      load(query, country, 1, false);
    }, delay);
    return () => clearTimeout(debounceRef.current);
  }, [query, country]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(query, country, next, true);
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white">
      <Navbar />

      <div className="pt-24 px-6 md:px-12 pb-16">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black mb-1">Actors & Artists</h1>
          <p className="text-gray-500 text-sm">
            Browse popular actors from around the world
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search actors, actresses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 outline-none focus:border-red-500/60 transition-all text-base"
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

        {/* Country tabs — horizontal scrollable */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-8">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setCountry(c.code)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                country === c.code
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              <span className="text-base">{c.flag}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Section title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-red-500 rounded-full" />
          <h2 className="text-lg font-bold">
            {query
              ? `Results for "${query}"${selectedCountry?.code !== "all" ? ` · ${selectedCountry?.flag} ${selectedCountry?.label}` : ""}`
              : `${selectedCountry?.flag} ${selectedCountry?.label === "All" ? "Popular Worldwide" : `Popular in ${selectedCountry?.label}`}`}
          </h2>
          {!loading && people.length > 0 && (
            <span className="text-xs text-gray-600">{people.length} actors</span>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <ActorSkeletonGrid />
        ) : people.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-7xl">🎭</div>
            <h2 className="text-2xl font-bold text-gray-300">No actors found</h2>
            <p className="text-gray-500 text-sm">Try a different name or country</p>
            <button onClick={() => { setQuery(""); setCountry("all"); }} className="mt-2 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold transition-all">
              Reset
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {people.map((person, i) => (
                <ActorCard key={`${person.id}-${i}`} person={person} rank={i + 1} />
              ))}
            </div>

            {/* Load More */}
            {page < totalPages && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl font-semibold text-sm transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Actors"
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
