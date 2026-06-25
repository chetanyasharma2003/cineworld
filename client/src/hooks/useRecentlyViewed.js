import { useState, useCallback } from "react";

const KEY = "cw_recently_viewed";
const MAX = 12;

export function useRecentlyViewed() {
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch { return []; }
  });

  const addMovie = useCallback((movie) => {
    setHistory(prev => {
      const filtered = prev.filter(m => m.id !== movie.id);
      const next = [{
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        _mediaType: movie._mediaType || "movie",
      }, ...filtered].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(KEY);
    setHistory([]);
  }, []);

  return { history, addMovie, clearHistory };
}
