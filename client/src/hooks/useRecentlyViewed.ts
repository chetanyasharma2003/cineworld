import { useState, useCallback } from "react";

const KEY = "cw_recently_viewed";
const MAX = 12;

interface RecentlyViewedItem {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
}

export function useRecentlyViewed() {
  const [history, setHistory] = useState<RecentlyViewedItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch { return []; }
  });

  const addMovie = useCallback((movie: {
    id: number;
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    vote_average: number;
    release_date: string;
  }) => {
    setHistory(prev => {
      const filtered = prev.filter(m => m.id !== movie.id);
      const next = [{ id: movie.id, title: movie.title, poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path, vote_average: movie.vote_average,
        release_date: movie.release_date }, ...filtered].slice(0, MAX);
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
