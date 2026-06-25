import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "../components/Navbar";
import { SkeletonActorDetail } from "../components/Skeletons";
import { API_BASE_URL } from "../lib/api";

import { tmdbGet } from "../lib/tmdb";
const tmdb = (url) => tmdbGet(url);

// ─── Person Chat Widget ────────────────────────────────────
function PersonChatWidget({ personCtx }) {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const historyRef            = useRef([]);
  const bottomRef             = useRef(null);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);

    let reply = "";
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/person-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personContext: personCtx, message: text, history: historyRef.current }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.text) {
              reply += json.text;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: reply };
                return copy;
              });
            }
            if (json.done) {
              historyRef.current = [...historyRef.current, { user: text, assistant: reply }].slice(-6);
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "Sorry, something went wrong." };
        return copy;
      });
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded-xl text-sm hover:bg-red-600/30 transition-all"
      >
        💬 Ask AI about {personCtx.name.split(" ")[0]}
      </button>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-semibold text-white">Chat about {personCtx.name}</span>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
      </div>
      <div className="h-64 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {messages.length === 0 && (
          <p className="text-xs text-gray-600 text-center mt-8">Ask anything about {personCtx.name}'s career, style, or best films.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-red-600 text-white" : "bg-white/10 text-gray-200"}`}>
              {m.content || <span className="flex gap-1">{[0,1,2].map(d => <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${d*0.15}s`}} />)}</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 p-3 border-t border-white/10">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask anything…"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-red-500/50"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-xl text-white text-sm font-medium transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}

function MovieCard({ movie, onClick }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div onClick={onClick} className="cursor-pointer group shrink-0" style={{ width: "130px" }}>
      <div className="relative rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-red-500/50 transition-all group-hover:scale-105">
        {!loaded && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
        <img
          src={movie.poster_path
            ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(movie.title)}&background=222&color=fff`}
          alt={movie.title}
          onLoad={() => setLoaded(true)}
          className={`w-full aspect-[2/3] object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
        <div className="absolute top-1.5 right-1.5 bg-black/70 text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded">
          ★ {movie.vote_average?.toFixed(1)}
        </div>
      </div>
      <p className="text-xs font-medium mt-1.5 line-clamp-2 text-gray-300">{movie.title}</p>
      <p className="text-xs text-gray-600 mt-0.5">{movie.release_date?.split("-")[0]}</p>
    </div>
  );
}

function Section({ title, movies, onMovieClick }) {
  if (!movies?.length) return null;
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-5 bg-red-500 rounded-full" />
        <h2 className="text-base font-bold text-white">{title}</h2>
        <span className="text-xs text-gray-600">({movies.length})</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
        {movies.map((m) => (
          <MovieCard key={m.id} movie={m} onClick={() => onMovieClick(m.id)} />
        ))}
      </div>
    </div>
  );
}

export default function ActorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [actor, setActor]       = useState(null);
  const [movies, setMovies]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setActor(null);
    setMovies([]);

    const fetch = async () => {
      try {
        const [person, credits] = await Promise.all([
          tmdb(`/person/${id}?append_to_response=external_ids`),
          tmdb(`/person/${id}/movie_credits`),
        ]);

        setActor(person);

        const cast = (credits.cast || [])
          .filter(m => m.poster_path)
          .sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));

        setMovies(cast);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <><Navbar /><SkeletonActorDetail /></>;

  if (!actor) return null;

  const today      = new Date();
  const birthDate  = actor.birthday ? new Date(actor.birthday) : null;
  const age        = birthDate
    ? Math.floor((today - birthDate) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  // Categorize movies
  const now        = today.toISOString().split("T")[0];
  const upcoming   = movies.filter(m => m.release_date > now).reverse();
  const recent     = movies.filter(m => m.release_date && m.release_date <= now).slice(0, 20);
  const topRated   = [...movies].sort((a, b) => b.vote_average - a.vote_average).slice(0, 12);

  // Genre breakdown
  const genreCount = {};
  const genreNames = {28:"Action",12:"Adventure",16:"Animation",35:"Comedy",80:"Crime",18:"Drama",14:"Fantasy",27:"Horror",9648:"Mystery",10749:"Romance",878:"Sci-Fi",53:"Thriller"};
  movies.forEach(m => (m.genre_ids || []).forEach(g => { if (genreNames[g]) genreCount[genreNames[g]] = (genreCount[genreNames[g]] || 0) + 1; }));
  const topGenres  = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const bio        = actor.biography || "";
  const shortBio   = bio.length > 400 ? bio.slice(0, 400) + "..." : bio;

  const ogImage = actor.profile_path
    ? `https://image.tmdb.org/t/p/w342${actor.profile_path}`
    : "";
  const ogDesc = bio.length > 155 ? bio.slice(0, 155) + "…" : bio || `${actor.name} — ${movies.length} movies on CineWorld`;

  return (
    <div className="bg-[#0f0f0f] min-h-screen text-white">
      <Helmet>
        <title>{`${actor.name} — CineWorld`}</title>
        <meta name="description" content={ogDesc} />
        <meta property="og:title" content={actor.name} />
        <meta property="og:description" content={ogDesc} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={actor.name} />
        <meta name="twitter:description" content={ogDesc} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
      </Helmet>
      <Navbar />

      {/* Hero */}
      <div className="relative pt-20 pb-8 px-6 md:px-12"
        style={{ background: "linear-gradient(to bottom, rgba(229,9,20,0.08) 0%, transparent 100%)" }}>
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20 transition-all border border-white/10 mb-6">
          ← Back
        </button>

        <div className="flex flex-col md:flex-row gap-8">

          {/* Photo */}
          <div className="shrink-0">
            <div className="relative w-48 h-64 md:w-56 md:h-72 rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-2xl">
              {!imgLoaded && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
              <img
                src={actor.profile_path
                  ? `https://image.tmdb.org/t/p/w342${actor.profile_path}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=222&color=fff&size=342`}
                alt={actor.name}
                onLoad={() => setImgLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              />
            </div>

            {/* Stats card */}
            <div className="mt-4 bg-white/5 rounded-xl p-4 space-y-2.5 text-sm ring-1 ring-white/10 w-48 md:w-56">
              {actor.known_for_department && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Known for</span>
                  <span className="text-red-400 font-medium">{actor.known_for_department}</span>
                </div>
              )}
              {actor.popularity && (
                <div className="flex justify-between">
                  <span className="text-gray-500">TMDB Score</span>
                  <span className="text-yellow-400 font-medium">{Math.round(actor.popularity)}</span>
                </div>
              )}
              {age && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Age</span>
                  <span>{age} years</span>
                </div>
              )}
              {actor.birthday && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Born</span>
                  <span className="text-right text-xs">{new Date(actor.birthday).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              )}
              {actor.deathday && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Died</span>
                  <span className="text-right text-xs">{actor.deathday}</span>
                </div>
              )}
              {actor.place_of_birth && (
                <div className="pt-1 border-t border-white/10">
                  <span className="text-gray-500 block text-xs mb-0.5">Birthplace</span>
                  <span className="text-xs">{actor.place_of_birth}</span>
                </div>
              )}
              <div className="pt-1 border-t border-white/10">
                <span className="text-gray-500 block text-xs mb-1">Total Movies</span>
                <span className="text-2xl font-black text-red-400">{movies.length}</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-1">{actor.name}</h1>

            {/* Badges */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 font-medium">
                🎬 {movies.length} Movies
              </span>
              {upcoming.length > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-green-600/20 border border-green-500/30 text-green-400 font-medium">
                  🔜 {upcoming.length} Upcoming
                </span>
              )}
              <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 font-medium">
                ⭐ TMDB Score: {Math.round(actor.popularity || 0)}
              </span>
            </div>

            {/* Top Genres */}
            {topGenres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {topGenres.map(([g, count]) => (
                  <span key={g} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                    {g} <span className="text-gray-600">·{count}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Biography */}
            {bio && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Biography</h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {showFull ? bio : shortBio}
                </p>
                {bio.length > 400 && (
                  <button onClick={() => setShowFull(!showFull)}
                    className="text-red-400 text-xs font-semibold mt-2 hover:text-red-300 transition-colors">
                    {showFull ? "Show less ↑" : "Read more ↓"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat */}
      <div className="px-6 md:px-12 mb-8">
        <PersonChatWidget personCtx={{
          name: actor.name,
          biography: actor.biography,
          birthday: actor.birthday,
          placeOfBirth: actor.place_of_birth,
          knownDepartment: actor.known_for_department,
          knownFor: topRated.slice(0, 5).map(m => m.title),
        }} />
      </div>

      {/* Movies */}
      <div className="px-6 md:px-12 pb-16">

        {upcoming.length > 0 && (
          <Section title="🎬 Upcoming Movies" movies={upcoming} onMovieClick={id => navigate(`/movie/${id}`)} />
        )}

        <Section title="🕐 Recent Movies" movies={recent} onMovieClick={id => navigate(`/movie/${id}`)} />
        <Section title="⭐ Best Rated" movies={topRated} onMovieClick={id => navigate(`/movie/${id}`)} />

        {/* All movies by year */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 bg-red-500 rounded-full" />
            <h2 className="text-base font-bold">All Movies</h2>
            <span className="text-xs text-gray-600">({movies.length} total)</span>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto pr-2 scrollbar-hide">
            {movies.map(m => (
              <div key={m.id}
                onClick={() => navigate(`/movie/${m.id}`)}
                className="flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-xl cursor-pointer transition-all group"
              >
                <span className="text-xs text-gray-600 w-10 shrink-0">{m.release_date?.split("-")[0] || "TBA"}</span>
                <img
                  src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : ""}
                  className="w-8 h-11 rounded-md object-cover shrink-0 bg-gray-800"
                  alt={m.title}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-red-400 transition-colors">{m.title}</p>
                  {m.character && <p className="text-xs text-gray-600 truncate">as {m.character}</p>}
                </div>
                <span className="text-xs text-yellow-400 shrink-0">★ {m.vote_average?.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}