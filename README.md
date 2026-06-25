# CineWorld

A full-stack movie discovery platform built with React, Vite, Express, MongoDB, and TMDB — featuring AI-powered recommendations, real-time notifications, social follows, and more.

**Live Demo:** https://cineworld-kappa.vercel.app

---

## Features

### Movies & Discovery
- Browse trending, popular, top-rated, and upcoming movies
- Search movies and actors from the navbar
- Movie detail pages with cast, trailers, watch providers, and similar movies
- TV Shows section with episode details
- Actor/Director profile pages with filmography
- Movie Calendar — browse releases by month
- Movie of the Day highlight on homepage

### AI Features (powered by Groq)
- **AI Search** — natural language to TMDB filters ("scary movies from the 80s")
- **Mood Recommendations** — describe your mood, get 6 tailored picks
- **For You** — personalised picks based on your watchlist
- **Smart For You** — recommendations refined by thumbs up/down feedback
- **Movie Chat** — streaming AI chat about any movie (with community review RAG)
- **Watchlist Chat** — ask questions about your own watchlist
- **Similar But Different** — AI picks that share vibes but aren't obvious
- **Review Summary** — sentiment analysis and summary of community reviews
- **Poster Mood Analysis** — analyses movie poster image for mood and aesthetic tags
- **Taste Insights** — AI analysis of your watchlist taste profile
- **Watchlist Smart Groups** — groups your watchlist by mood/theme
- **Collaborative Filtering** — finds users with similar taste, recommends their picks
- **Weekly AI Digest** — Monday morning email with 5 personalised picks
- **Vector Similarity** — cosine similarity ranking on genre/year/rating feature vectors

### Social
- Follow / unfollow other users
- Public profile pages with watchlist preview
- Real-time follow notifications via SSE
- Follower / following counts

### User
- JWT auth with refresh token rotation (httpOnly cookies)
- Google OAuth login
- Email verification + password reset
- Avatar upload
- Watchlist with status tracking (Plan to Watch / Watching / Completed / Dropped)
- My List (saved movies)
- Write and edit movie reviews with star ratings
- Thumbs up/down feedback on AI recommendations
- Weekly digest opt-out toggle

### Other
- Real-time notifications (SSE with one-time nonce auth)
- Movie Compare page — side-by-side comparison with AI verdict
- Light / Dark theme toggle
- PWA support (installable)
- Swagger API docs at `/api/docs`
- In-process metrics at `/metrics`

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, TanStack Query |
| Backend | Node.js, Express 5, MongoDB, Mongoose |
| Auth | JWT (access + refresh rotation), Google OAuth |
| AI | Groq SDK (llama-3.1-8b-instant, llama-3.3-70b-versatile) |
| Email | Nodemailer (SMTP) |
| Real-time | Server-Sent Events (SSE) |
| Jobs | node-cron (weekly digest) |
| Security | Helmet, express-rate-limit, mongo-sanitize, Zod validation |
| Deployment | Vercel (client), Render (server), MongoDB Atlas |

---

## Project Structure

```
cineworld/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Navbar, Skeletons, AI widgets, etc.
│   │   ├── pages/           # Home, MovieDetail, Profile, Watchlist, etc.
│   │   ├── context/         # AuthContext, ThemeContext
│   │   ├── hooks/           # useDebounce, useRecentlyViewed
│   │   └── lib/             # api.ts, tmdb.ts
│   └── ...
└── server/                  # Express + MongoDB API
    ├── routes/              # auth, movies, users, ai, notifications, etc.
    ├── models/              # User, Review, Notification
    ├── services/            # aiService.js, tmdbService.js
    ├── middleware/          # authMiddleware, validate
    ├── jobs/                # weeklyDigest.js (node-cron)
    ├── schemas/             # Zod validation schemas
    └── utils/               # mailer, logger, cache, notifyUser
```

---

## Local Setup

### 1. Install dependencies

```bash
npm --prefix client install
npm --prefix server install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Fill in `server/.env`:

```env
PORT=8000
CLIENT_ORIGIN=http://localhost:5173
MONGO_URI=your-mongodb-atlas-uri
JWT_SECRET=your-long-random-secret
TMDB_TOKEN=your-tmdb-read-access-token

# AI features (free at https://console.groq.com)
GROQ_API_KEY=your-groq-api-key

# Email (optional — for verification & weekly digest)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-gmail-app-password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Run

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Client | Vercel | Auto-deploys on push to `main` |
| Server | Render | Auto-deploys on push to `main` |
| Database | MongoDB Atlas | Free tier |

---

## API Overview

```
GET    /api/health
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/movies/home
GET    /api/movies/search?query=
GET    /api/movies/:id
GET    /api/reviews/:movieId
POST   /api/reviews
GET    /api/users/me/watchlist
POST   /api/users/me/watchlist
GET    /api/users/me/list
POST   /api/users/:id/follow
GET    /api/users/collab-picks
POST   /api/ai/search
POST   /api/ai/mood
POST   /api/ai/chat          (SSE)
POST   /api/ai/for-you
POST   /api/ai/smart-for-you
POST   /api/ai/review-summary
POST   /api/ai/similar
GET    /api/notifications
GET    /api/notifications/stream  (SSE)
```

Full docs: `/api/docs` (Swagger UI)
