import mongoose from "mongoose";

const movieSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    tmdbId: { type: Number, index: true },
    industry: { type: String },
    genre: { type: String },
    description: { type: String },
    poster_path: { type: String },
    backdrop_path: { type: String },
    release_date: { type: String },
    vote_average: { type: Number },
    streamingLink: { type: String },
  },
  { timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;
