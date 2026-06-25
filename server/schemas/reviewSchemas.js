import { z } from "zod";

export const createReviewSchema = z.object({
  movieId: z.string().min(1, "Movie ID required").max(40),
  movieTitle: z.string().max(200).optional().default(""),
  content: z.string().min(2, "Review too short").max(1000, "Review too long"),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export const editReviewSchema = z.object({
  content: z.string().min(2, "Review too short").max(1000, "Review too long"),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});
