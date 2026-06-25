// ── Core TMDB types ───────────────────────────────────────

export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
  budget?: number;
  revenue?: number;
  tagline?: string;
  original_language: string;
  certification?: string;
  status?: string;
  homepage?: string;
}

export interface TVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: Genre[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  original_language: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProviderResult {
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  link?: string;
}

// ── App types ─────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
}

export type WatchlistStatus = "want_to_watch" | "watching" | "watched";

export interface WatchlistItem extends Movie {
  status: WatchlistStatus;
  addedAt?: string;
}

export interface SavedMovie extends Movie {
  addedAt?: string;
}

export interface Review {
  _id: string;
  movieId: string;
  content: string;
  rating: number | null;
  author: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomeSections {
  popular: Movie[];
  upcoming: Movie[];
  topRated: Movie[];
  nowPlaying: Movie[];
  action: Movie[];
  comedy: Movie[];
  horror: Movie[];
  scifi: Movie[];
  animation: Movie[];
  thriller: Movie[];
  romance: Movie[];
  bollywood: Movie[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface DiscoverResponse {
  results: Movie[];
  totalPages: number;
  totalResults: number;
}
