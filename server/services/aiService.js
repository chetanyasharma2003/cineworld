import Groq from "groq-sdk";

let _client = null;
const getClient = () => {
  if (!_client) _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _client;
};

// Fast model for JSON parsing, slower for quality chat
const JSON_MODEL = "llama-3.1-8b-instant";   // ultra fast, great for structured output
const CHAT_MODEL = "llama-3.3-70b-versatile"; // best free model for conversational quality

function extractJSON(text, type = "object") {
  const open = type === "array" ? "[" : "{";
  const close = type === "array" ? "]" : "}";
  const start = text.indexOf(open);
  const end = text.lastIndexOf(close);
  if (start === -1 || end === -1) throw new Error("No JSON found");
  return JSON.parse(text.slice(start, end + 1));
}

async function chat(model, system, userContent, maxTokens = 400) {
  const res = await getClient().chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ],
  });
  return res.choices[0]?.message?.content || "";
}

/**
 * Parse natural language query → TMDB discover params
 */
export async function parseSearchQuery(query) {
  const text = await chat(
    JSON_MODEL,
    `You convert movie search requests into TMDB API parameters. Return ONLY valid JSON, no explanation, no markdown.

TMDB genre IDs: 28=Action,12=Adventure,16=Animation,35=Comedy,80=Crime,99=Documentary,18=Drama,10751=Family,14=Fantasy,36=History,27=Horror,10402=Music,9648=Mystery,10749=Romance,878=Science Fiction,53=Thriller,10752=War,37=Western

Return JSON with any relevant fields:
{
  "with_genres": "comma-separated IDs",
  "primary_release_year": "specific year as string",
  "primary_release_date.gte": "YYYY-01-01",
  "primary_release_date.lte": "YYYY-12-31",
  "vote_average.gte": "min rating 1-10",
  "sort_by": "popularity.desc|vote_average.desc|release_date.desc",
  "with_original_language": "ISO code e.g. en,ko,fr,hi",
  "searchQuery": "if user named a specific title, actor, or director"
}`,
    `Query: "${query}"`,
    300
  );

  try {
    return extractJSON(text);
  } catch {
    return { searchQuery: query };
  }
}

/**
 * Mood-based movie recommendations → [{title, year, reason, searchQuery}]
 */
export async function getMoodRecommendations(mood, watchedTitles = []) {
  const excludeNote = watchedTitles.length
    ? `\nAlready watched (do not recommend): ${watchedTitles.slice(0, 15).join(", ")}`
    : "";

  const text = await chat(
    JSON_MODEL,
    `You are a world-class movie expert. Return ONLY a valid JSON array. No explanation, no markdown, no code fences.`,
    `Recommend exactly 10 real movies for this mood/request: "${mood}"${excludeNote}

Return a JSON array with exactly 10 items:
[
  {
    "title": "Exact Official Movie Title",
    "year": 2020,
    "reason": "One sentence why this perfectly fits the mood",
    "searchTitle": "short search-friendly title without subtitles or colons"
  }
]

Rules:
- Real, well-known movies only
- Include the exact release year
- Variety in tone and era
- Match the mood very closely
- Return EXACTLY 10 movies`,
    1200
  );

  try {
    return extractJSON(text, "array");
  } catch {
    return [];
  }
}

/**
 * Head-to-head AI verdict for two movies
 */
export async function getCompareVerdict(movieA, movieB) {
  const fmt = (m) =>
    `Title: ${m.title} (${m.release_date?.split("-")[0] || "?"})
Rating: ${m.vote_average?.toFixed(1)}/10 (${m.vote_count?.toLocaleString() || "?"} votes)
Box Office: ${m.revenue ? `$${(m.revenue / 1e6).toFixed(0)}M` : "Unknown"}
Director: ${m.director || "Unknown"}
Genres: ${m.genres?.map((g) => g.name).join(", ") || "Unknown"}
Overview: ${m.overview?.slice(0, 200) || ""}`;

  const text = await chat(
    JSON_MODEL,
    `You are a film critic. Compare two movies and return ONLY valid JSON, no explanation, no markdown.`,
    `MOVIE A:\n${fmt(movieA)}\n\nMOVIE B:\n${fmt(movieB)}\n\nReturn JSON:
{
  "winner": "A" or "B" or "tie",
  "verdict": "2-3 sentence honest critical comparison",
  "winnerReason": "One sentence why the winner edges it (or why it's a tie)",
  "bestForA": "Type of viewer who should pick Movie A",
  "bestForB": "Type of viewer who should pick Movie B",
  "funFact": "One interesting contrast between the two films"
}`,
    500
  );

  try {
    return extractJSON(text);
  } catch {
    return {
      winner: "tie",
      verdict: "Both are compelling films with their own strengths.",
      winnerReason: "It's too close to call.",
      bestForA: "Fans of " + (movieA.genres?.[0]?.name || "this genre"),
      bestForB: "Fans of " + (movieB.genres?.[0]?.name || "this genre"),
      funFact: "Both films are worth experiencing.",
    };
  }
}

/**
 * Analyse user watchlist and return taste profile
 */
export async function getTasteInsights(watchlist) {
  const data = watchlist.slice(0, 60).map((m) => ({
    title: m.title,
    year: m.release_date?.split("-")[0],
    rating: m.vote_average,
    status: m.status,
  }));

  const text = await chat(
    JSON_MODEL,
    `You are a film analyst. Analyse movie watchlists and return ONLY valid JSON, no explanation, no markdown.`,
    `Analyse this watchlist (${data.length} movies): ${JSON.stringify(data)}

Return JSON:
{
  "tasteProfile": "2-3 sentence description of their cinematic taste",
  "watchingStyle": "e.g. The Binge Watcher, The Curated Collector, The Adrenaline Junkie",
  "topGenres": ["Genre1", "Genre2", "Genre3"],
  "moodTags": ["Loves slow-burn thrillers", "Can't resist a heist film"],
  "hiddenPattern": "One surprising insight about their viewing habits",
  "nextPick": "One specific movie title they should watch next",
  "nextPickReason": "Why it's a perfect fit for their taste"
}`,
    700
  );

  try {
    return extractJSON(text);
  } catch {
    return null;
  }
}

/**
 * Personalised movie recommendations from watchlist (Groq-powered For You)
 */
export async function getForYouRecommendations(watchlist) {
  const data = watchlist.slice(0, 40).map(m => ({
    title: m.title,
    year: m.release_date?.split("-")[0],
    rating: m.vote_average,
    status: m.status,
  }));

  const text = await chat(
    JSON_MODEL,
    `You are a world-class film recommender. Return ONLY valid JSON array, no markdown, no explanation.`,
    `Based on this user's watchlist, recommend 10 movies they would love but haven't seen yet.
Watchlist: ${JSON.stringify(data)}

Return JSON array:
[
  {
    "title": "Exact Movie Title",
    "year": 2022,
    "reason": "One sentence why this matches their taste",
    "searchTitle": "short search-friendly title"
  }
]

Rules: Do NOT recommend movies already in the watchlist. Return exactly 10.`,
    1200
  );

  try { return extractJSON(text, "array"); } catch { return []; }
}

/**
 * Summarise and sentiment-analyse a set of reviews
 */
export async function summarizeReviews(reviews) {
  if (!reviews.length) return null;
  const sample = reviews.slice(0, 20).map(r => ({
    content: r.content?.slice(0, 200),
    rating: r.rating,
  }));

  const text = await chat(
    JSON_MODEL,
    `You are a film critic analyst. Return ONLY valid JSON, no markdown, no explanation.`,
    `Analyse these ${sample.length} user reviews:
${JSON.stringify(sample)}

Return JSON:
{
  "headline": "One punchy sentence summarising overall consensus",
  "positive": 75,
  "mixed": 15,
  "negative": 10,
  "themes": ["Great cinematography", "Weak ending", "Stellar acting"],
  "bestQuote": "The single most insightful short quote from any review (max 80 chars)"
}

positive + mixed + negative must sum to 100.`,
    500
  );

  try { return extractJSON(text); } catch { return null; }
}

/**
 * AI-curated "similar but different" movies
 */
export async function getSimilarButDifferent(movie) {
  const text = await chat(
    JSON_MODEL,
    `You are a film recommender. Return ONLY valid JSON array, no markdown, no explanation.`,
    `Recommend 8 movies similar in vibe to "${movie.title}" (${movie.release_date?.split("-")[0]}) but that are NOT obvious sequels or the same director's other films.
Genres: ${movie.genres?.map(g => g.name).join(", ")}
Overview: ${movie.overview?.slice(0, 200)}

Return JSON array:
[
  {
    "title": "Exact Movie Title",
    "year": 2020,
    "reason": "One sentence why it shares the same vibe",
    "searchTitle": "short search-friendly title"
  }
]

Focus on under-the-radar picks, not just blockbusters. Return exactly 8.`,
    900
  );

  try { return extractJSON(text, "array"); } catch { return []; }
}

/**
 * Group watchlist into smart mood-based categories
 */
export async function groupWatchlist(watchlist) {
  const data = watchlist.map(m => ({
    id: m.id,
    title: m.title,
    year: m.release_date?.split("-")[0],
    rating: m.vote_average,
    status: m.status,
  }));

  const text = await chat(
    JSON_MODEL,
    `You are a film curator. Return ONLY valid JSON, no markdown, no explanation.`,
    `Group these ${data.length} watchlist movies into 4-5 mood-based categories.
Movies: ${JSON.stringify(data)}

Return JSON:
{
  "groups": [
    {
      "name": "Sunday Morning Comfort",
      "emoji": "☀️",
      "description": "Easy, feel-good watches",
      "movieIds": [123, 456, 789]
    }
  ]
}

Rules: Every movie must appear in exactly one group. Group names should be evocative vibes, not genres.`,
    1000
  );

  try { return extractJSON(text); } catch { return null; }
}

/**
 * Stream natural language watchlist chat with conversational memory
 */
export async function streamWatchlistChat(watchlist, userMessage, onChunk, onDone, history = []) {
  const titles = watchlist
    .map(m => `${m.title} (${m.release_date?.split("-")[0]}, ${m.status?.replace(/_/g, " ")})`)
    .join("; ");

  const pastTurns = history.slice(-6).flatMap(turn => [
    { role: "user",      content: turn.user },
    { role: "assistant", content: turn.assistant },
  ]);

  const stream = await getClient().chat.completions.create({
    model: CHAT_MODEL,
    max_tokens: 400,
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are a personal film concierge with memory of this conversation. The user has these movies in their watchlist:
${titles}

Answer their questions ONLY using movies from this watchlist. Be specific (name the movie). Be concise (2-3 sentences max). Be enthusiastic. Remember what was discussed earlier.`,
      },
      ...pastTurns,
      { role: "user", content: userMessage },
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    if (text) onChunk(text);
    if (chunk.choices[0]?.finish_reason) onDone();
  }
}

/**
 * Stream a chat response about a movie via callbacks.
 * Supports:
 *   - Conversational memory (history array — last 6 turns)
 *   - RAG: real user reviews injected into system prompt
 */
export async function streamMovieChat(movieCtx, userMessage, onChunk, onDone, history = [], reviews = []) {
  // Build conversation: system → past turns (max 6) → new user message
  const pastTurns = history.slice(-6).flatMap(turn => [
    { role: "user",      content: turn.user },
    { role: "assistant", content: turn.assistant },
  ]);

  // RAG: inject real reviews as grounded context
  const reviewContext = reviews.length
    ? `\n\nREAL USER REVIEWS (from CineWorld community — use these to ground your answers):\n${
        reviews
          .slice(0, 5)
          .map((r, i) => `${i + 1}. "${r.content}" — ${r.rating ? `${r.rating}/5 stars` : "no rating"}`)
          .join("\n")
      }`
    : "";

  const stream = await getClient().chat.completions.create({
    model: CHAT_MODEL,
    max_tokens: 500,
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are CineBot, a passionate movie expert assistant with access to real community reviews.
Movie being discussed: "${movieCtx.title}" (${movieCtx.year || "Unknown year"})
Director: ${movieCtx.director || "Unknown"}
Cast: ${movieCtx.cast || "Unknown"}
Genres: ${movieCtx.genres || "Unknown"}
Rating: ${movieCtx.rating}/10
Overview: ${movieCtx.overview?.slice(0, 300) || ""}${reviewContext}

Guidelines:
- Be concise (2-4 sentences). Be friendly and enthusiastic.
- When answering "is it good?" or "what do people think?", reference the real reviews above.
- Avoid spoilers unless asked.
- Remember what was discussed earlier in this conversation.`,
      },
      ...pastTurns,
      { role: "user", content: userMessage },
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    if (text) onChunk(text);
    if (chunk.choices[0]?.finish_reason) onDone();
  }
}

/**
 * AI content moderation — zero-shot classifier for review text
 * Returns { safe: boolean, reason: string }
 */
export async function moderateReview(content) {
  const text = await chat(
    JSON_MODEL,
    `You are a content moderator. Return ONLY valid JSON, no explanation.`,
    `Classify this movie review for a family-friendly platform. Check for: hate speech, explicit sexual content, severe profanity, personal attacks, spam, or off-topic content.

Review: "${content.slice(0, 500)}"

Return JSON:
{
  "safe": true or false,
  "reason": "brief reason if unsafe, or 'ok' if safe"
}`,
    150
  );

  try {
    return extractJSON(text);
  } catch {
    return { safe: true, reason: "ok" }; // fail open — don't block on AI error
  }
}

/**
 * Analyse a movie poster image URL and return mood/aesthetic tags
 * Uses Groq vision model
 */
export async function analyzeMoviePoster(posterUrl, movieTitle) {
  const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

  try {
    const res = await getClient().chat.completions.create({
      model: VISION_MODEL,
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: posterUrl },
            },
            {
              type: "text",
              text: `This is the movie poster for "${movieTitle}". Analyze the visual aesthetics and return ONLY valid JSON:
{
  "mood": "one word mood (e.g. dark, hopeful, intense, whimsical, romantic)",
  "palette": "dominant color palette (e.g. warm golden, cold blue-grey, vibrant neon)",
  "vibe": "2-4 word atmospheric description",
  "moodTags": ["tag1", "tag2", "tag3"]
}`,
            },
          ],
        },
      ],
    });

    const content = res.choices[0]?.message?.content || "";
    return extractJSON(content);
  } catch {
    return null;
  }
}

/**
 * Personalised recommendations using feedback + taste vector
 * Liked titles boost similar picks, disliked titles are excluded
 */
export async function getSmartRecommendations(watchlist, likedTitles = [], dislikedTitles = []) {
  // Keep payload small — titles only, max 20 entries
  const titles = watchlist.slice(0, 20).map(m => m.title).filter(Boolean).join(", ");

  const likedNote = likedTitles.length
    ? `\nLoved: ${likedTitles.slice(0, 8).join(", ")}`
    : "";

  const dislikedNote = dislikedTitles.length
    ? `\nDisliked: ${dislikedTitles.slice(0, 8).join(", ")}`
    : "";

  const text = await chat(
    JSON_MODEL,
    `You are a film recommender. Return ONLY a valid JSON array, no other text.`,
    `Recommend 10 movies based on this watchlist.

Watchlist: ${titles}${likedNote}${dislikedNote}

Rules: do not recommend anything already in the watchlist or disliked list. Weight toward loved-list vibes.

Return JSON array (exactly 10 items):
[{"title":"Movie Title","year":2022,"reason":"one sentence","searchTitle":"short title"}]`,
    900
  );

  try { return extractJSON(text, "array"); } catch { return []; }
}

// ── Vector similarity ─────────────────────────────────────────────────────────

// All TMDB genre IDs we track (20 genres)
const GENRE_IDS = [28,12,16,35,80,99,18,10751,14,36,27,10402,9648,10749,878,53,10752,37,10770,10768];

/**
 * Build a normalised feature vector for a movie.
 * Dimensions: [genre_0..genre_19, year_norm, rating_norm]  → length 22
 */
export function movieToVector(movie) {
  const vec = new Array(GENRE_IDS.length + 2).fill(0);

  // Genre presence (binary)
  const genreIds = movie.genre_ids || (movie.genres || []).map(g => g.id);
  for (const id of genreIds) {
    const idx = GENRE_IDS.indexOf(Number(id));
    if (idx !== -1) vec[idx] = 1;
  }

  // Year normalised to [0, 1] across 1900–2030
  const year = parseInt(movie.release_date?.split("-")[0] || movie.year || 2000);
  vec[GENRE_IDS.length] = Math.min(1, Math.max(0, (year - 1900) / 130));

  // Rating normalised to [0, 1] (TMDB 0–10)
  vec[GENRE_IDS.length + 1] = Math.min(1, Math.max(0, (movie.vote_average || 0) / 10));

  return vec;
}

/**
 * Cosine similarity between two equal-length vectors.
 * Returns 0–1 (1 = identical direction).
 */
export function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Compute the centroid (mean) vector of a list of movies — represents user taste.
 */
export function computeCentroid(movies) {
  if (!movies.length) return new Array(GENRE_IDS.length + 2).fill(0);
  const dim = GENRE_IDS.length + 2;
  const sum = new Array(dim).fill(0);
  for (const m of movies) {
    const v = movieToVector(m);
    for (let i = 0; i < dim; i++) sum[i] += v[i];
  }
  return sum.map(x => x / movies.length);
}

/**
 * Rank a list of candidate movies by similarity to a target movie (or taste centroid).
 * Returns candidates sorted descending by similarity score.
 */
export function rankBySimilarity(target, candidates) {
  const targetVec = Array.isArray(target) ? target : movieToVector(target);
  return candidates
    .map(m => ({ ...m, _similarity: cosineSimilarity(targetVec, movieToVector(m)) }))
    .sort((a, b) => b._similarity - a._similarity);
}

/**
 * Update user taste vector based on watchlist genre distribution
 * Returns a Map of genreId → weight (0-1)
 */
export function computeTasteVector(watchlist) {
  const counts = {};
  let total = 0;

  for (const movie of watchlist) {
    for (const genreId of (movie.genre_ids || [])) {
      counts[genreId] = (counts[genreId] || 0) + 1;
      total++;
    }
  }

  if (!total) return {};

  // Normalize to 0-1 weights
  const vector = {};
  for (const [id, count] of Object.entries(counts)) {
    vector[id] = Math.round((count / total) * 100) / 100;
  }

  return vector;
}

/**
 * Generate 5 weekly pick recommendations for a user based on their watchlist taste.
 * Used by the weekly digest cron job.
 */
export async function generateWeeklyPicks(userName, watchlist) {
  const titles = watchlist.slice(0, 30).map(m => m.title).join(", ");
  const text = await chat(
    JSON_MODEL,
    `You are a film recommender. Return ONLY valid JSON array, no markdown, no explanation.`,
    `Generate 5 weekly movie picks for ${userName} based on their watchlist: ${titles}
Do NOT recommend anything already in the list. Return exactly 5 varied picks.

Return JSON array:
[
  {
    "title": "Exact Movie Title",
    "year": 2022,
    "reason": "One sentence why this is their pick of the week"
  }
]`,
    600
  );
  try { return extractJSON(text, "array"); } catch { return []; }
}

/**
 * Streaming chat about a director or actor (person context).
 * personCtx: { name, knownFor, biography?, birthday?, placeOfBirth?, knownDepartment? }
 */
export async function streamPersonChat(personCtx, userMessage, onChunk, onDone, history = []) {
  const pastTurns = history.slice(-6).flatMap(turn => [
    { role: "user",      content: turn.user },
    { role: "assistant", content: turn.assistant },
  ]);

  const bio = personCtx.biography
    ? `\n\nBiography (first 400 chars): ${personCtx.biography.slice(0, 400)}`
    : "";

  const stream = await getClient().chat.completions.create({
    model: CHAT_MODEL,
    max_tokens: 500,
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are CineBot, a knowledgeable film expert. The user is asking about the ${personCtx.knownDepartment || "film"} personality:

Name: ${personCtx.name}
Known for: ${(personCtx.knownFor || []).slice(0, 5).join(", ")}
${personCtx.birthday ? `Born: ${personCtx.birthday}${personCtx.placeOfBirth ? ` in ${personCtx.placeOfBirth}` : ""}` : ""}${bio}

Guidelines:
- Answer in 2-4 concise sentences. Be enthusiastic and knowledgeable.
- Focus on career highlights, style, and notable works.
- Remember what was discussed earlier in this conversation.`,
      },
      ...pastTurns,
      { role: "user", content: userMessage },
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    if (text) onChunk(text);
    if (chunk.choices[0]?.finish_reason) onDone();
  }
}
