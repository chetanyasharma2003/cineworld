# CineWorld API Documentation

Full-stack movie discovery platform with AI-powered features, real-time notifications, and advanced analytics.

## Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://cineworld.vercel.app`
- **API Base**: `/api`

## Authentication

### JWT Token
```bash
Authorization: Bearer <access_token>
```
- Access tokens: 15 minutes validity
- Refresh tokens: 7 days validity (HttpOnly cookies)
- Token rotation on each refresh

### API Key
```bash
X-API-Key: <api_key>
```

## Rate Limiting
- Global: 600 requests / 15 minutes
- Auth: 20 requests / 15 minutes
- Per-User (sensitive): 3 requests / 15 minutes
- Per-User (AI): 30 requests / 15 minutes
- Per-User (general): 100 requests / 15 minutes

## Endpoints

### Authentication (`/api/auth`)

#### POST /signup
Create new user account
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```
Response:
```json
{
  "user": { "_id", "name", "email", "createdAt" },
  "token": "eyJ...",
  "emailVerificationSent": true
}
```

#### POST /login
Authenticate user
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```
Response:
```json
{
  "user": { "_id", "name", "email" },
  "token": "eyJ..."
}
```

#### GET /me
Get authenticated user
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/auth/me
```

#### POST /refresh
Refresh access token (uses HttpOnly refresh token cookie)
```bash
curl -b "refreshToken=..." http://localhost:8000/api/auth/refresh
```

#### GET /verify-email?token=<token>
Verify email address
```bash
curl http://localhost:8000/api/auth/verify-email?token=abc123
```

#### POST /forgot-password
Request password reset email
```json
{ "email": "john@example.com" }
```

#### POST /reset-password
Reset password with token
```json
{
  "token": "<reset_token>",
  "password": "NewSecurePass123!"
}
```

### Movies (`/api/movies`)

#### GET /trending
Get trending movies
```bash
curl http://localhost:8000/api/movies/trending?page=1&limit=20
```

#### GET /search?q=<query>
Search movies
```bash
curl http://localhost:8000/api/movies/search?q=inception&limit=10
```

#### GET /details/:movieId
Get movie details
```bash
curl http://localhost:8000/api/movies/details/550
```

#### GET /recommendations/:movieId
Get similar movies
```bash
curl http://localhost:8000/api/movies/recommendations/550
```

### Advanced Search (`/api/search`)

#### GET /advanced
Search with filters
```bash
curl "http://localhost:8000/api/search/advanced?q=action&genres=28,18&year_gte=2020&rating_gte=7&sort_by=popularity.desc"
```
Parameters:
- `q`: Search query
- `genres`: Comma-separated genre IDs
- `year_gte`, `year_lte`: Year range
- `rating_gte`, `rating_lte`: Rating range
- `sort_by`: Sorting (popularity.desc, rating.desc, release_date.desc)

#### GET /genres
Get all available genres
```bash
curl http://localhost:8000/api/search/genres
```

#### GET /by-genre?genreId=<id>&page=1&limit=20
Filter movies by genre
```bash
curl http://localhost:8000/api/search/by-genre?genreId=28&limit=20
```

#### GET /by-year?year=2023&page=1
Filter movies by year
```bash
curl http://localhost:8000/api/search/by-year?year=2023
```

#### GET /top-rated?rating_gte=7&limit=10
Get top-rated movies
```bash
curl http://localhost:8000/api/search/top-rated?rating_gte=7
```

### Watchlist (`/api/users`)

#### GET /watchlist
Get user watchlist
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/users/watchlist
```

#### POST /watchlist
Add movie to watchlist
```json
{
  "movieId": 550,
  "status": "want_to_watch",
  "movieData": { "title", "posterPath", "genres" }
}
```

#### PUT /watchlist/:movieId
Update watchlist movie status
```json
{ "status": "watching" }
```

#### DELETE /watchlist/:movieId
Remove movie from watchlist
```bash
curl -X DELETE -H "Authorization: Bearer <token>" http://localhost:8000/api/users/watchlist/550
```

### Reviews (`/api/reviews`)

#### GET /movie/:movieId
Get reviews for movie
```bash
curl http://localhost:8000/api/reviews/movie/550
```

#### POST /
Create review
```json
{
  "movieId": 550,
  "rating": 9,
  "content": "Amazing film!",
  "spoilers": false
}
```

#### PUT /:reviewId
Update review
```json
{
  "rating": 8,
  "content": "Still great!",
  "spoilers": false
}
```

#### DELETE /:reviewId
Delete review
```bash
curl -X DELETE -H "Authorization: Bearer <token>" http://localhost:8000/api/reviews/reviewId
```

### AI Features (`/api/ai`)

#### POST /mood
Get mood-based recommendations
```json
{
  "mood": "happy and uplifting",
  "watchedTitles": ["Inception", "Interstellar"]
}
```
Response:
```json
{
  "recommendations": [
    { "title", "description", "reasoning" }
  ]
}
```

#### POST /chat
Stream movie chat (Server-Sent Events)
```json
{
  "movieContext": {
    "movieId": 550,
    "title": "Fight Club",
    "genres": ["Drama", "Thriller"]
  },
  "message": "What's the twist ending?",
  "history": [{ "user": "...", "assistant": "..." }]
}
```

#### POST /for-you
Get personalized recommendations (requires watchlist)
```bash
curl -X POST -H "Authorization: Bearer <token>" http://localhost:8000/api/ai/for-you
```

#### GET /insights
Get watchlist taste analysis (requires 3+ movies)
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/ai/insights
```

#### POST /smart-for-you
AI recommendations using feedback loop
```bash
curl -X POST -H "Authorization: Bearer <token>" http://localhost:8000/api/ai/smart-for-you
```

#### POST /feedback
Submit AI recommendation feedback
```json
{
  "movieId": 550,
  "movieTitle": "Fight Club",
  "liked": true
}
```

### Admin (`/api/admin`)

#### GET /dashboard
Get admin dashboard metrics
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/admin/dashboard
```
Response:
```json
{
  "metrics": {
    "total_users": 1250,
    "active_users": 890,
    "banned_users": 5,
    "total_reviews": 5420,
    "activation_rate": "71.20%"
  },
  "recent_users": [],
  "top_reviewers": []
}
```

#### GET /analytics?days=7
Get analytics dashboard
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/admin/analytics?days=7
```

#### GET /analytics/dau?days=30
Get daily active users
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/admin/analytics/dau?days=30
```

#### GET /analytics/mau
Get monthly active users
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/admin/analytics/mau
```

#### GET /analytics/features
Get AI feature usage stats
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/admin/analytics/features
```

#### GET /users?page=1&limit=20&role=user&banned=false
Get user list
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/admin/users
```

#### POST /users/:userId/ban
Ban user
```json
{
  "reason": "Spam posting",
  "duration": 7
}
```

#### POST /users/:userId/unban
Unban user
```bash
curl -X POST -H "Authorization: Bearer <token>" http://localhost:8000/api/admin/users/userId/unban
```

#### PATCH /users/:userId/role
Update user role
```json
{
  "role": "moderator"
}
```

#### DELETE /reviews/:reviewId
Delete inappropriate review
```json
{
  "reason": "Spam"
}
```

### Notifications (`/api/notifications`)

#### GET /stream (SSE)
Stream real-time notifications
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/notifications/stream
```

#### GET /
Get notification history
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/notifications
```

#### POST /:notificationId/read
Mark notification as read
```bash
curl -X POST -H "Authorization: Bearer <token>" http://localhost:8000/api/notifications/notifId/read
```

### Health & Metrics

#### GET /health
Health check
```bash
curl http://localhost:8000/health
```
Response:
```json
{
  "status": "ok",
  "uptime": "1234s",
  "db": "connected",
  "env": "production",
  "version": "1.0.0",
  "timestamp": "2026-11-13T10:30:00Z"
}
```

#### GET /metrics?key=<API_KEY>
Get performance metrics
```bash
curl "http://localhost:8000/metrics?key=$METRICS_API_KEY"
```

#### GET /perf-stats?key=<API_KEY>
Get performance statistics
```bash
curl "http://localhost:8000/perf-stats?key=$METRICS_API_KEY"
```

## Response Format

### Success
```json
{
  "data": {},
  "success": true,
  "timestamp": "2026-11-13T10:30:00Z"
}
```

### Error
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## HTTP Status Codes
- `200 OK` — Success
- `201 Created` — Resource created
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing/invalid token
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Resource not found
- `409 Conflict` — Resource already exists
- `413 Payload Too Large` — Request too large
- `429 Too Many Requests` — Rate limit exceeded
- `500 Internal Server Error` — Server error
- `503 Service Unavailable` — Service temporarily down

## Error Codes
- `INVALID_EMAIL` — Email format invalid
- `WEAK_PASSWORD` — Password doesn't meet requirements
- `USER_EXISTS` — Email already registered
- `INVALID_CREDENTIALS` — Wrong email/password
- `TOKEN_EXPIRED` — JWT token expired
- `INSUFFICIENT_PERMISSIONS` — User lacks required role
- `RESOURCE_NOT_FOUND` — Movie/review/user not found
- `RATE_LIMIT_EXCEEDED` — Too many requests
- `CSRF_INVALID` — CSRF token missing or invalid
- `AI_SERVICE_DOWN` — Groq/AI service unavailable

## SDKs & Libraries

### JavaScript/TypeScript (TanStack Query)
```javascript
import { useQuery, useMutation } from "@tanstack/react-query";

const { data: user } = useQuery({
  queryKey: ["user"],
  queryFn: () => fetch("/api/auth/me").then(r => r.json()),
});
```

### cURL Examples
See individual endpoint sections above

### Postman Collection
Import: `/api/docs.json` (OpenAPI 3.0 format)

## WebSocket Connections

### Notifications (SSE)
```javascript
const eventSource = new EventSource("/api/notifications/stream", {
  headers: { Authorization: "Bearer <token>" }
});

eventSource.onmessage = (e) => {
  const { notification } = JSON.parse(e.data);
  console.log(notification);
};
```

### AI Chat (SSE)
```javascript
const response = await fetch("/api/ai/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ movieContext, message, history })
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = new TextDecoder().decode(value);
  // Process streaming response
}
```

## Environment Variables

### Required
```
DATABASE_URL=mongodb+srv://...
JWT_SECRET=<random_string_32+_chars>
GROQ_API_KEY=gsk_...
TMDB_API_KEY=...
```

### Optional
```
SENTRY_DSN=https://...
NODE_ENV=production
METRICS_API_KEY=<api_key>
CLIENT_ORIGIN=http://localhost:5173
```

## Changelog

### v1.0.0 (2026-11-13)
- Full-stack launch with analytics, admin panel, AI features
- Mobile responsiveness
- Performance optimization
- Security hardening
- Advanced search filters
