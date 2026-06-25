import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "../components/Navbar";
import { tmdbGet } from "../lib/tmdb";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function MovieCalendar() {
  const navigate = useNavigate();
  const today = new Date();

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [movies, setMovies]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  // Fetch upcoming movies for the displayed month (+/- buffer pages)
  useEffect(() => {
    setLoading(true);
    const firstDay = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
    const lastDay  = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${getDaysInMonth(viewYear, viewMonth)}`;

    Promise.all([
      tmdbGet("/discover/movie", {
        "primary_release_date.gte": firstDay,
        "primary_release_date.lte": lastDay,
        sort_by: "popularity.desc",
        page: 1,
      }),
      tmdbGet("/discover/movie", {
        "primary_release_date.gte": firstDay,
        "primary_release_date.lte": lastDay,
        sort_by: "popularity.desc",
        page: 2,
      }),
    ])
      .then(([r1, r2]) => {
        const seen = new Set();
        const all = [...(r1.results || []), ...(r2.results || [])].filter(m => {
          if (!m.release_date || seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
        setMovies(all);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [viewYear, viewMonth]);

  // Group movies by day number
  const moviesByDay = useMemo(() => {
    const map = {};
    for (const m of movies) {
      const d = parseInt(m.release_date.split("-")[2], 10);
      if (!map[d]) map[d] = [];
      map[d].push(m);
    }
    // Sort each day by popularity desc
    for (const d of Object.keys(map)) {
      map[d].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }
    return map;
  }, [movies]);

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells   = Math.ceil((daysInMonth + firstDayOfWeek) / 7) * 7;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  };

  const isToday = (day) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear  === today.getFullYear();

  const selectedMovies = selectedDate ? (moviesByDay[selectedDate] || []) : [];

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white">
      <Helmet>
        <title>Movie Calendar — CineWorld</title>
        <meta name="description" content="Browse upcoming movie release dates on CineWorld" />
      </Helmet>
      <Navbar />

      <div className="pt-24 px-4 md:px-10 pb-16 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black mb-1">Movie Calendar</h1>
          <p className="text-gray-500 text-sm">Upcoming & recent release dates</p>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-gray-400 hover:text-white"
          >
            ←
          </button>
          <h2 className="text-xl font-black">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-gray-400 hover:text-white"
          >
            →
          </button>
        </div>

        {/* Calendar grid */}
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/10">
            {DAY_NAMES.map(d => (
              <div key={d} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {Array.from({ length: totalCells }, (_, i) => {
                const day = i - firstDayOfWeek + 1;
                const isValid = day >= 1 && day <= daysInMonth;
                const dayMovies = isValid ? (moviesByDay[day] || []) : [];
                const isSelected = selectedDate === day && isValid;

                return (
                  <div
                    key={i}
                    onClick={() => isValid && setSelectedDate(isSelected ? null : day)}
                    className={`min-h-[80px] md:min-h-[100px] border-b border-r border-white/5 p-1.5 transition-all last:border-r-0 ${
                      isValid
                        ? isSelected
                          ? "bg-red-600/10 cursor-pointer"
                          : "hover:bg-white/3 cursor-pointer"
                        : "opacity-30"
                    }`}
                  >
                    {isValid && (
                      <>
                        {/* Day number */}
                        <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold mb-1 ${
                          isToday(day)
                            ? "bg-red-600 text-white"
                            : isSelected
                            ? "bg-red-600/30 text-red-400"
                            : "text-gray-400"
                        }`}>
                          {day}
                        </div>

                        {/* Movie thumbnails */}
                        <div className="flex flex-col gap-0.5">
                          {dayMovies.slice(0, 2).map(m => (
                            <div
                              key={m.id}
                              onClick={(e) => { e.stopPropagation(); navigate(`/movie/${m.id}`); }}
                              title={m.title}
                              className="flex items-center gap-1 bg-red-600/15 hover:bg-red-600/25 rounded px-1 py-0.5 transition-all"
                            >
                              {m.poster_path && (
                                <img
                                  src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                                  alt=""
                                  className="w-4 h-5 rounded object-cover shrink-0 hidden md:block"
                                />
                              )}
                              <span className="text-[10px] text-red-300 truncate leading-tight font-medium">
                                {m.title}
                              </span>
                            </div>
                          ))}
                          {dayMovies.length > 2 && (
                            <span className="text-[10px] text-gray-600 pl-1">
                              +{dayMovies.length - 2} more
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected day panel */}
        {selectedDate && (
          <div className="mt-8">
            <h3 className="text-lg font-black mb-4">
              {MONTH_NAMES[viewMonth]} {selectedDate}, {viewYear}
              <span className="ml-2 text-sm text-gray-500 font-normal">
                {selectedMovies.length} release{selectedMovies.length !== 1 ? "s" : ""}
              </span>
            </h3>

            {selectedMovies.length === 0 ? (
              <p className="text-gray-600 text-sm">No releases found for this date.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {selectedMovies.map(m => (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/movie/${m.id}`)}
                    className="cursor-pointer group"
                  >
                    <div className="aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-red-500/60 transition-all mb-2">
                      <img
                        src={m.poster_path
                          ? `https://image.tmdb.org/t/p/w185${m.poster_path}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.title)}&background=1a1a1a&color=666&size=100`}
                        alt={m.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-xs font-semibold line-clamp-2 text-gray-300 group-hover:text-white transition-colors">
                      {m.title}
                    </p>
                    {m.vote_average > 0 && (
                      <p className="text-xs text-yellow-500 mt-0.5">⭐ {m.vote_average.toFixed(1)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom strip: total releases this month */}
        {!loading && movies.length > 0 && (
          <p className="text-center text-xs text-gray-600 mt-8">
            {movies.length} releases tracked in {MONTH_NAMES[viewMonth]} {viewYear}
          </p>
        )}
      </div>
    </div>
  );
}
