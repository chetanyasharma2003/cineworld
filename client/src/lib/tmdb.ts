// All TMDB calls go through our backend proxy — never expose the token on the client
import { API_BASE_URL } from "./api";

const base = `${API_BASE_URL}/tmdb`;

export type TmdbParams = Record<string, string | number | boolean | undefined | null>;

export interface TmdbPagedResult<T = TmdbMovie> {
  results: T[];
  total_results: number;
  total_pages: number;
  page: number;
}

export interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  overview: string;
  genre_ids: number[];
  popularity: number;
}

export interface TmdbPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  biography?: string;
  birthday?: string;
  place_of_birth?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function tmdbGet<T = any>(path: string, params: TmdbParams = {}, _retry = 0): Promise<T> {
  const url = new URL(`${base}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });
  const res = await fetch(url.toString());

  // Retry on 429 (rate limit) with exponential backoff, up to 3 times
  if (res.status === 429 && _retry < 3) {
    await new Promise(r => setTimeout(r, (_retry + 1) * 800));
    return tmdbGet<T>(path, params, _retry + 1);
  }

  if (!res.ok) throw new Error(`TMDB proxy error: ${res.status}`);
  return res.json() as Promise<T>;
}
