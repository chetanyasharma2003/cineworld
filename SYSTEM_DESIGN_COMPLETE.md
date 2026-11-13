# 🏗️ CineWorld - Complete System Design Document

---

## 📚 Table of Contents
1. [System Design Overview](#1-system-design-overview)
2. [Architecture Patterns](#2-architecture-patterns)
3. [Components & Interactions](#3-components--interactions)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Database Design](#5-database-design)
6. [API Design](#6-api-design)
7. [Caching Strategy](#7-caching-strategy)
8. [Security Architecture](#8-security-architecture)
9. [Scalability & Performance](#9-scalability--performance)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Monitoring & Logging](#11-monitoring--logging)
12. [Trade-offs & Decisions](#12-trade-offs--decisions)

---

# 1. System Design Overview 🎯

## What is System Design?

**System Design = कैसे एक बड़ा application को build करते हैं ताकि:**
- ✅ Fast रहे (Performance)
- ✅ Safe रहे (Security)  
- ✅ Reliable रहे (No crashes)
- ✅ Scale कर सके (millions of users)
- ✅ Maintain करना आसान हो

## CineWorld System Architecture (Bird's Eye View)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CINEWORLD SYSTEM                              │
└──────────────────────────────────────────────────────────────────────┘

                         ↓ USER REQUESTS ↓
                         
        ┌────────────────┬────────────────┬────────────────┐
        │                │                │                │
        ▼                ▼                ▼                ▼
    ┌─────────┐     ┌──────────┐     ┌──────────┐    ┌──────────┐
    │ Browser │     │ Mobile   │     │ Desktop  │    │ API      │
    │ Client  │     │ App      │     │ App      │    │ Client   │
    └────┬────┘     └────┬─────┘     └────┬─────┘    └────┬─────┘
         │               │                │              │
         └───────────────┼────────────────┼──────────────┘
                         │
                HTTPS Encryption
                         │
        ┌────────────────▼────────────────┐
        │    CDN (Content Delivery)       │
        │  - Global Cache Layer           │
        │  - 80+ countries                │
        │  - Instant static file serving  │
        └────────────────┬────────────────┘
                         │
                   HTTPS Encryption
                         │
        ┌────────────────▼──────────────────────┐
        │  Load Balancer                        │
        │  - Distribute traffic                │
        │  - Health checks                     │
        │  - SSL termination                   │
        └────────────────┬──────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  API        │   │  API        │   │  API        │
│  Server 1   │   │  Server 2   │   │  Server 3   │
│  (Render)   │   │  (Render)   │   │  (Render)   │
├─────────────┤   ├─────────────┤   ├─────────────┤
│ ┌─────────┐ │   │ ┌─────────┐ │   │ ┌─────────┐ │
│ │Middleware│ │   │ │Middleware│ │   │ │Middleware│ │
│ │Services  │ │   │ │Services  │ │   │ │Services  │ │
│ │Routes    │ │   │ │Routes    │ │   │ │Routes    │ │
│ └─────────┘ │   │ └─────────┘ │   │ └─────────┘ │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
         ┌────────────────────────────┐
         │   Database Layer           │
         │                            │
         │ Primary: MongoDB (Read)    │
         │ Replica Sets               │
         │ Automatic Failover         │
         │                            │
         │ - Connection Pooling       │
         │ - Query Optimization       │
         │ - Indexing Strategy        │
         └──────────────┬─────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
    ┌──────────┐               ┌──────────────┐
    │ Cache    │               │ External     │
    │ Layer    │               │ Services     │
    │(Redis)   │               │              │
    └──────────┘               │ - TMDB API   │
                               │ - Groq LLM   │
                               │ - Email      │
                               │ - Sentry     │
                               └──────────────┘

MESSAGE QUEUES (Async Tasks):
                    │
                    ▼
    ┌───────────────────────────────┐
    │ Job Queue (node-cron)         │
    │ - Weekly digest emails        │
    │ - Data aggregation            │
    │ - Cleanup tasks               │
    └───────────────────────────────┘
```

## System Requirements (Design करने से पहले)

### Functional Requirements (Kya करना है)
```
MUST HAVE:
✓ Users sign up/login कर सकें
✓ Movies browse कर सकें  
✓ Search functionality
✓ Watchlist maintain कर सकें
✓ Reviews लिख सकें
✓ Other users को follow कर सकें

NICE TO HAVE:
✓ AI recommendations
✓ Real-time notifications
✓ Movie comparison
✓ Collaborative filtering
✓ Weekly digest emails
```

### Non-Functional Requirements (Kaise करना है)
```
PERFORMANCE:
- API response time < 200ms
- Page load time < 2s
- Database queries < 100ms

RELIABILITY:
- 99.9% uptime
- Auto-failover
- Data replication

SCALABILITY:
- 1000+ concurrent users
- 10 million+ movies
- 100 million+ reviews

SECURITY:
- HTTPS everywhere
- Password encryption
- Input validation
- Rate limiting
- DDoS protection

MAINTAINABILITY:
- Code organized
- Easy to debug
- Good logging
- Clear documentation
```

---

# 2. Architecture Patterns 🎨

## Layered Architecture (3-Tier)

```
┌─────────────────────────────────────┐
│   PRESENTATION LAYER (Frontend)     │
│                                     │
│  React Components                  │
│  - Pages                          │
│  - UI Components                  │
│  - Forms                          │
│  - Routing                        │
│                                     │
│  Responsibilities:                  │
│  - User interface                  │
│  - Client-side validation          │
│  - State management                │
│  - Cache management                │
└──────────────────┬──────────────────┘
                   │
                   │ HTTP/REST API
                   │ (JSON data)
                   │
┌──────────────────▼──────────────────┐
│   BUSINESS LOGIC LAYER (Backend)    │
│                                     │
│  Express Routes                    │
│  - Auth routes                     │
│  - API endpoints                   │
│                                     │
│  Services                          │
│  - AI Service                      │
│  - TMDB Service                    │
│  - Email Service                   │
│                                     │
│  Middleware                        │
│  - Authentication                  │
│  - Validation                      │
│  - Error handling                  │
│  - Logging                         │
│                                     │
│  Responsibilities:                  │
│  - Business logic                  │
│  - Data processing                 │
│  - Security checks                 │
│  - Rate limiting                   │
└──────────────────┬──────────────────┘
                   │
                   │ Mongoose ODM
                   │ SQL Queries
                   │
┌──────────────────▼──────────────────┐
│    DATA ACCESS LAYER (Database)     │
│                                     │
│  MongoDB Collections               │
│  - Users                           │
│  - Reviews                         │
│  - Notifications                   │
│  - Cache                           │
│                                     │
│  Responsibilities:                  │
│  - Data storage                    │
│  - Data retrieval                  │
│  - Indexing                        │
│  - Query optimization              │
└─────────────────────────────────────┘
```

## MVC Pattern (Backend)

```
REQUEST FLOW:
User Input
    ↓
┌─────────────────────────────────────┐
│ MODEL                               │
│                                     │
│ Database schemas                   │
│ (User.js, Review.js, etc.)         │
│                                     │
│ Mongoose models                    │
│ Validation rules                   │
│ Relationships                      │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ CONTROLLER (Routes)                 │
│                                     │
│ Express route handlers             │
│ Request processing                 │
│ Response formatting                │
│                                     │
│ Example:                           │
│ async function getMovies(req,res) │
│   const movies = await Movie.find()
│   res.json(movies)                 │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ VIEW (JSON Response)                │
│                                     │
│ { movies: [...] }                  │
│ Frontend receives                  │
│ Display in browser                 │
└─────────────────────────────────────┘
```

## Service-Oriented Architecture

```
Routes Layer
    │
    ├─→ Auth Service
    │   ├─ validateCredentials()
    │   ├─ generateToken()
    │   └─ refreshToken()
    │
    ├─→ Movie Service (TMDB)
    │   ├─ getHomeMovies()
    │   ├─ searchMovies()
    │   └─ getMovieDetails()
    │
    ├─→ AI Service (Groq)
    │   ├─ parseSearchQuery()
    │   ├─ getMoodRecommendations()
    │   └─ streamMovieChat()
    │
    ├─→ Review Service
    │   ├─ createReview()
    │   ├─ getReviews()
    │   └─ updateReview()
    │
    ├─→ User Service
    │   ├─ getProfile()
    │   ├─ updateProfile()
    │   └─ manageWatchlist()
    │
    └─→ Notification Service
        ├─ createNotification()
        ├─ getNotifications()
        └─ markAsRead()

Benefits:
✓ Code reusability
✓ Easy testing
✓ Separation of concerns
✓ Easy to modify
```

---

# 3. Components & Interactions 🔗

## Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND COMPONENTS                          │
└──────────────────────────────────────────────────────────────────┘

AuthContext (Global State)
    │
    ├─→ AuthProvider
    │   ├─ user state
    │   ├─ token management
    │   ├─ auto-refresh logic
    │   └─ logout handler
    │
    └─→ Used by:
        ├─ ProtectedRoute
        ├─ Navbar
        ├─ LoginPage
        └─ All authenticated pages

ThemeContext (Global State)
    │
    ├─→ ThemeProvider
    │   ├─ dark/light toggle
    │   └─ CSS class application
    │
    └─→ Used by:
        └─ All components

TanStack Query (Server State)
    │
    ├─→ useQuery (fetch data)
    │   ├─ Automatic caching
    │   ├─ Background refetch
    │   └─ Stale time management
    │
    └─→ Used by:
        ├─ HomePage (fetch movies)
        ├─ SearchPage (fetch results)
        ├─ MovieDetail (fetch movie info)
        └─ Watchlist (fetch user's list)

Custom Hooks
    │
    ├─→ useDebounce
    │   └─ Optimize search queries (300ms delay)
    │
    └─→ useRecentlyViewed
        └─ Track viewed movies in localStorage

Pages (Lazy Loaded)
    │
    ├─→ Home
    │   ├─ Uses: TanStack Query (fetch movies)
    │   ├─ Uses: MovieCard component
    │   └─ Uses: Row component (horizontal scroll)
    │
    ├─→ MovieDetail
    │   ├─ Uses: TanStack Query (movie details)
    │   ├─ Uses: ReviewForm
    │   ├─ Uses: AIChatWidget
    │   └─ Uses: SimilarMovies
    │
    ├─→ Watchlist
    │   ├─ Protected (needs auth)
    │   ├─ Uses: TanStack Query (get watchlist)
    │   └─ Uses: FilterTabs (status-wise)
    │
    ├─→ Login/Signup
    │   ├─ Form validation
    │   └─ AuthContext update
    │
    └─→ Profile
        ├─ Protected (needs auth)
        ├─ Shows user info
        └─ Edit avatar/bio

UI Components (Reusable)
    │
    ├─→ Navbar
    │   ├─ Logo
    │   ├─ Search bar
    │   ├─ Auth buttons
    │   └─ User menu
    │
    ├─→ MovieCard
    │   ├─ Poster image
    │   ├─ Title & rating
    │   └─ Hover effects
    │
    ├─→ Row
    │   ├─ Horizontal movie list
    │   └─ Scroll functionality
    │
    ├─→ ReviewForm
    │   ├─ Rating input
    │   └─ Text input
    │
    ├─→ AIChatWidget
    │   ├─ Chat interface
    │   └─ Streaming response
    │
    └─→ Skeletons (Loading)
        ├─ MovieCardSkeleton
        └─ RowSkeleton

Utilities (Helper Functions)
    │
    ├─→ api.ts (Axios instance)
    │   ├─ Base URL configuration
    │   ├─ 401 interceptor (auto-refresh)
    │   └─ Error handling
    │
    └─→ tmdb.ts (TMDB wrapper)
        └─ API call wrappers

┌──────────────────────────────────────────────────────────────────┐
│                     BACKEND COMPONENTS                           │
└──────────────────────────────────────────────────────────────────┘

Express App (index.js)
    │
    ├─→ Middleware Stack
    │   ├─ Sentry (error tracking)
    │   ├─ CORS (cross-origin)
    │   ├─ Helmet (security headers)
    │   ├─ Morgan (logging)
    │   ├─ Compression (gzip)
    │   ├─ Rate Limiter
    │   └─ mongo-sanitize (injection protection)
    │
    ├─→ Routes
    │   ├─ authRoutes (signup, login, refresh)
    │   ├─ movieRoutes (home, search, details)
    │   ├─ userRoutes (watchlist, profile)
    │   ├─ reviewRoutes (create, read, update)
    │   ├─ aiRoutes (AI features)
    │   ├─ notificationRoutes (SSE stream)
    │   └─ tmdbProxy (TMDB cache layer)
    │
    ├─→ Models (Mongoose)
    │   ├─ User
    │   │   ├─ Schema definition
    │   │   ├─ Pre-save hooks (password hashing)
    │   │   └─ Instance methods
    │   │
    │   ├─ Review
    │   │   ├─ Schema with compound index
    │   │   └─ Relationship to User
    │   │
    │   └─ Notification
    │       ├─ Real-time tracking
    │       └─ Read/unread status
    │
    ├─→ Schemas (Zod Validation)
    │   ├─ authSchemas
    │   │   ├─ signupSchema
    │   │   └─ loginSchema
    │   │
    │   └─ reviewSchemas
    │       └─ createReviewSchema
    │
    ├─→ Services
    │   ├─ aiService.js
    │   │   ├─ Groq LLM calls
    │   │   ├─ AI response streaming
    │   │   └─ Prompt engineering
    │   │
    │   ├─ tmdbService.js
    │   │   ├─ Movie data fetching
    │   │   ├─ Caching logic
    │   │   └─ Error handling
    │   │
    │   ├─ authService.js
    │   │   ├─ Password validation
    │   │   └─ Token generation
    │   │
    │   └─ emailService.js
    │       ├─ Verification emails
    │       └─ Digest emails
    │
    ├─→ Middleware
    │   ├─ authMiddleware.js
    │   │   ├─ JWT verification
    │   │   ├─ User attachment
    │   │   └─ Token refresh
    │   │
    │   ├─ validate.js
    │   │   ├─ Zod validation
    │   │   └─ Error formatting
    │   │
    │   └─ errorMiddleware.js
    │       ├─ Global error handler
    │       ├─ Sentry integration
    │       └─ Response formatting
    │
    ├─→ Utils
    │   ├─ cache.js (In-memory LRU)
    │   ├─ mailer.js (Email sending)
    │   ├─ logger.js (Winston logs)
    │   └─ validators.js (Input sanitization)
    │
    └─→ Jobs
        └─ weeklyDigest.js (node-cron scheduled task)

Database Connection Pool
    │
    └─→ MongoDB Atlas
        ├─ Connection pool (5-50 connections)
        ├─ Automatic reconnection
        └─ Health monitoring

External Services Integration
    │
    ├─→ TMDB API
    │   └─ Movie data provider
    │
    ├─→ Groq LLM
    │   └─ AI processing
    │
    ├─→ Nodemailer
    │   └─ Email delivery
    │
    ├─→ Sentry
    │   └─ Error tracking & monitoring
    │
    └─→ Redis (optional)
        └─ Advanced caching
```

---

# 4. Data Flow Diagrams 📊

## Complete User Login Flow

```
USER ACTION: Click "Login" Button
│
▼
FRONTEND: Login Page
│
├─ User enters:
│  ├─ Email: raj@mail.com
│  └─ Password: ••••••••
│
▼
VALIDATION (Frontend)
│
├─ Email format valid? ✓
├─ Password length >= 8? ✓
└─ All good → Proceed
│
▼
API CALL: POST /api/auth/login
│
Headers:
│ Content-Type: application/json
│ (HTTPS encrypted)
│
Body:
│ {
│   "email": "raj@mail.com",
│   "password": "MyPassword123"
│ }
│
▼
BACKEND: authRoutes
│
├─ Receive request
│
▼
MIDDLEWARE CHAIN:
│
├─1. CORS check
│  └─ Origin allowed? ✓
│
├─2. Rate Limiter
│  └─ <20 attempts/15min? ✓
│
├─3. Zod Validation
│  └─ Email & password format valid? ✓
│
└─4. Route Handler (login controller)
│
▼
SERVICE: authService.validateCredentials()
│
├─ Email sanitization
│  └─ Remove special chars, lowercase
│
▼
DATABASE: User.findOne({ email })
│
├─ Query:
│  └─ SELECT * FROM users WHERE email = 'raj@mail.com'
│
▼
├─ User found? 
│  └─ Yes → Continue
│  └─ No → Return 401 Unauthorized
│
▼
SECURITY: bcrypt.compare()
│
├─ Raw password: "MyPassword123"
│ Hashed password: "$2b$10$..."
│
├─ Compare hash
│
▼
├─ Password matches?
│  └─ Yes → Continue
│  └─ No → 
│      ├─ Increment loginAttempts
│      ├─ 5 attempts → Lock account 15 min
│      └─ Return 401 Unauthorized
│
▼
TOKEN GENERATION:
│
├─ Generate accessToken (15 min)
│  └─ JWT.sign({ userId }, SECRET, { expiresIn: "15m" })
│
├─ Generate refreshToken (7 days)
│  └─ JWT.sign({ userId }, SECRET, { expiresIn: "7d" })
│
└─ Save refreshToken in database
   └─ User.updateOne({ _id }, { refreshToken: newToken })
│
▼
RESPONSE:
│
{
  success: true,
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: {
    id: "user_id_123",
    name: "Raj Kumar",
    email: "raj@mail.com",
    avatar: "https://..."
  }
}
│
Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
│
▼
FRONTEND: Response received
│
├─ Store in localStorage:
│  └─ localStorage.token = accessToken
│
├─ HttpOnly cookie automatically set (by browser)
│
├─ Update AuthContext:
│  ├─ user = { id, name, email, avatar }
│  └─ token = accessToken
│
├─ Redirect to homepage
│
└─ Show toast: "Login successful!" ✓
│
▼
NEXT API REQUESTS:
│
Headers:
│ Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Success! User is now logged in ✓
```

## Movie Search Flow (AI Powered)

```
USER ACTION: Type "horror movies 2020"
│
▼
FRONTEND: Search Input
│
├─ Change event triggered
│
▼
useDebounce Hook
│
├─ Wait 300ms
├─ No more changes?
└─ Proceed with search
│
▼
API CALL: POST /api/ai/search
│
Body:
│ {
│   "query": "horror movies 2020"
│ }
│
Authorization: Bearer token
│
▼
BACKEND: Route Handler
│
├─ Auth middleware: Verify token ✓
├─ Rate limiter: Check limit ✓
└─ Validation: Check query format ✓
│
▼
SERVICE: aiService.parseSearchQuery()
│
├─ Input sanitization
│  └─ Escape special characters
│
▼
GROQ LLM API CALL:
│
System Prompt:
│ "Convert movie search request into TMDB parameters.
│  Return ONLY valid JSON.
│  Genre IDs: 27=Horror, 18=Drama, etc."
│
User Input:
│ "horror movies 2020"
│
▼
GROQ PROCESSES (AI Thinking)
│
├─ Understand: "horror" = genre 27
├─ Understand: "2020" = year >= 2020
├─ Understand: "movies" = exclude TV
│
▼
GROQ RESPONSE (JSON):
│
{
  "with_genres": [27],
  "primary_release_year": {
    "gte": 2020
  },
  "sort_by": "popularity.desc",
  "vote_count.gte": 100,
  "page": 1
}
│
▼
BACKEND: Extract JSON Response
│
├─ Parse JSON
├─ Validate structure
└─ Continue
│
▼
SERVICE: tmdbService.discoverMovies()
│
├─ TMDB API call with parameters
│
TMDB Request:
│ GET /discover/movie?
│   with_genres=27&
│   primary_release_year=2020&
│   sort_by=popularity.desc&
│   vote_count.gte=100&
│   page=1
│
▼
TMDB RESPONSE:
│
{
  "results": [
    {
      "id": 550,
      "title": "Scary Movie",
      "poster_path": "/poster.jpg",
      "vote_average": 8.2,
      "release_date": "2020-01-15"
    },
    ... 19 more movies
  ],
  "total_results": 245,
  "total_pages": 13
}
│
▼
BACKEND CACHING:
│
├─ Store in LRU cache:
│  └─ cache.set("search:horror2020", results, 3*60*1000)
│  └─ TTL: 3 minutes
│
▼
RESPONSE TO FRONTEND:
│
{
  success: true,
  data: {
    movies: [...20 movies],
    total: 245
  }
}
│
▼
FRONTEND: TanStack Query
│
├─ Update cache
├─ Update UI
└─ Display movie grid:
│
   ┌─────────┬─────────┬─────────┐
   │ Movie 1 │ Movie 2 │ Movie 3 │
   │ (Horror)│ (Horror)│ (Horror)│
   └─────────┴─────────┴─────────┘

User sees results ✓
```

## Real-Time Notification Flow (SSE)

```
EVENT: User A Follows User B
│
▼
FRONTEND: Click Follow Button
│
┌─────────────────────────────────────┐
│ POST /api/users/B_ID/follow        │
│ Authorization: Bearer token         │
└─────────────────────────────────────┘
│
▼
BACKEND:
│
├─ Verify user A is logged in
├─ Find user B
├─ Add A to B's followers
│  └─ User.updateOne(
│       { _id: B },
│       { $push: { following: A } }
│     )
│
▼
CREATE NOTIFICATION:
│
├─ Notification.create({
│    user: B,
│    icon: "👤",
│    text: "User A started following you",
│    link: "/user/user_a",
│    read: false,
│    createdAt: now
│  })
│
▼
SEND TO ACTIVE USERS:
│
├─ Check if User B is connected via SSE
│
▼
IF USER B IS ONLINE (SSE connection active):
│
└─ Send real-time notification:
  
  SSE Stream:
  ┌────────────────────────────────┐
  │ data: {                        │
  │   "icon": "👤",              │
  │   "text": "User A started...", │
  │   "link": "/user/user_a"      │
  │ }                              │
  │ event: notification            │
  └────────────────────────────────┘
  
  FRONTEND EventSource listener:
  
  eventSource.addEventListener('notification', (e) => {
    const notif = JSON.parse(e.data)
    showNotificationToast(notif)
    updateNotificationBell()
  })
  
  User B immediately sees:
  🔔 "User A started following you" ✓

IF USER B IS OFFLINE (No SSE connection):
│
└─ Notification saved in database
   
   When User B logs in next time:
   GET /api/notifications
   │
   ├─ Database query:
   │  └─ Notification.find({ user: B, read: false })
   │
   └─ Return all pending notifications
      │
      └─ Display in notification center

NOTIFICATION BELL UPDATE:
│
├─ Update unread count
├─ Change bell icon color
└─ Play notification sound

User interaction complete ✓
```

---

# 5. Database Design 📁

## Data Modeling

### Collections & Relationships

```
┌──────────────────────────────────────────────────────────────┐
│                     DATABASE SCHEMA                          │
└──────────────────────────────────────────────────────────────┘

USERS COLLECTION (Primary)
├─ _id: ObjectId (unique identifier)
├─ name: String
├─ email: String (unique, indexed)
├─ password: String (bcrypt encrypted)
├─ savedMovies: Array of Movies
│  └─ id, title, poster, rating, ...
├─ watchlist: Array of Movies (with status)
│  └─ id, title, status (want/watching/watched), ...
├─ aiFeedback: Array (likes/dislikes)
│  └─ movieId, liked (true/false), createdAt
├─ tasteVector: Map (genre preferences)
│  └─ genre_id → score (0-1)
├─ following: Array of UserIds (references)
├─ followers: Array of UserIds (references)
├─ emailVerified: Boolean
├─ emailVerifyToken: String (nullable)
├─ passwordResetToken: String (nullable)
├─ loginAttempts: Number (for security)
├─ lockUntil: Date (for account lockout)
├─ avatarUrl: String (nullable)
├─ digestOptOut: Boolean
├─ isProfilePublic: Boolean
├─ createdAt: Date
└─ updatedAt: Date

Indexes:
├─ email (unique) - Fast email lookup
├─ name - Profile search
└─ created_at - Recent users query

Query Examples:
Find by email:
  db.users.findOne({ email: "raj@mail.com" })
  
Find with watchlist:
  db.users.findOne(
    { _id: userId },
    { watchlist: 1 }
  )

Find active users:
  db.users.find(
    { emailVerified: true },
    { _id: 1, name: 1 }
  )


REVIEWS COLLECTION
├─ _id: ObjectId
├─ movieId: String (TMDB ID)
├─ movieTitle: String
├─ user: ObjectId (ref to User)
├─ author: String (user's name)
├─ content: String (2-1000 chars)
├─ rating: Number (1-5)
├─ createdAt: Date
└─ updatedAt: Date

Indexes:
├─ movieId - Find reviews for a movie
├─ user - Find user's reviews
└─ Compound: (movieId, user) - Unique constraint
   (One user = One review per movie)

Query Examples:
Find reviews for a movie:
  db.reviews.find({ movieId: "550" })
  
Find user's review:
  db.reviews.findOne({
    movieId: "550",
    user: userId
  })
  
Count reviews by rating:
  db.reviews.aggregate([
    { $match: { movieId: "550" } },
    { $group: {
        _id: "$rating",
        count: { $sum: 1 }
      }
    }
  ])
  
Result:
  { _id: 5, count: 25 }
  { _id: 4, count: 12 }
  { _id: 3, count: 8 }
  { _id: 2, count: 3 }
  { _id: 1, count: 2 }


NOTIFICATIONS COLLECTION
├─ _id: ObjectId
├─ user: ObjectId (ref to User)
├─ icon: String (emoji)
├─ text: String (notification message)
├─ link: String (click destination)
├─ read: Boolean
├─ createdAt: Date
└─ updatedAt: Date

Indexes:
├─ user - Find user's notifications
├─ read - Find unread notifications
└─ Compound: (user, read) - Quick unread query

Query Examples:
Find unread notifications:
  db.notifications.find({
    user: userId,
    read: false
  }).sort({ createdAt: -1 })

Mark all as read:
  db.notifications.updateMany(
    { user: userId },
    { $set: { read: true } }
  )


RELATIONSHIPS DIAGRAM:

           User (1)
            │  ▲
            │  │
            │ (1:N)
            │  │
            ▼  │
      Review (N)
      (movieId, user → unique)
      
      
      User (1)
        │
        │ (1:N)
        │
        ▼
   Notification (N)
   
   
      User (1)
        │
        │ (N:M - Many to Many)
        │
   User (1)
   (Following relationship)
   
   
JSON Documents (NoSQL):

User Example:
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Raj Kumar",
  email: "raj@mail.com",
  password: "$2b$10$...",
  
  savedMovies: [
    {
      id: 550,
      title: "Fight Club",
      poster_path: "/image.jpg",
      vote_average: 8.8
    }
  ],
  
  watchlist: [
    {
      id: 550,
      title: "Fight Club",
      status: "watched"
    },
    {
      id: 109,
      title: "Dilwale Dulhania",
      status: "want_to_watch"
    }
  ],
  
  aiFeedback: [
    { movieId: 550, liked: true, createdAt: "2026-09-19T10:00Z" },
    { movieId: 109, liked: false, createdAt: "2026-09-18T15:30Z" }
  ],
  
  tasteVector: {
    "28": 0.85,   // Action (high)
    "18": 0.60,   // Drama (medium)
    "35": 0.20    // Comedy (low)
  },
  
  following: [
    ObjectId("507f1f77bcf86cd799439012"),
    ObjectId("507f1f77bcf86cd799439013")
  ],
  
  emailVerified: true,
  loginAttempts: 0,
  lockUntil: null,
  isProfilePublic: true,
  
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-09-19T10:30:00Z"
}

Review Example:
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  movieId: "550",
  movieTitle: "Fight Club",
  user: ObjectId("507f1f77bcf86cd799439011"),
  author: "Raj Kumar",
  content: "Excellent movie! Mind-bending plot...",
  rating: 5,
  createdAt: "2026-09-15T14:30:00Z",
  updatedAt: "2026-09-15T14:30:00Z"
}
```

## Query Optimization

```
SLOW QUERY → FAST QUERY

❌ SLOW: Get user's watchlist without index
  db.users.find({}, { watchlist: 1 })
  Full collection scan!
  
✓ FAST: With proper indexing
  db.users.find({ _id: userId }, { watchlist: 1 })
  Direct document lookup by ID index

❌ SLOW: Find all movie reviews
  db.reviews.find({})
  
✓ FAST: With compound index
  db.reviews.find({ movieId: "550" })
  Index on movieId → fast lookup

INDEX STRATEGY:

Primary Indexes:
├─ _id (automatic on all collections)
├─ email (unique on Users)
├─ movieId (on Reviews)
└─ user (on Reviews, Notifications)

Compound Indexes:
├─ (movieId, user) on Reviews
│  └─ Enforces unique review per user per movie
├─ (user, read) on Notifications
│  └─ Fast unread notification query
└─ (user, createdAt) on Notifications
   └─ Recent notifications ordering

Query Plan Explanation:

Query: db.reviews.find({ movieId: "550" })

With Index:
┌─────────────────────────────────┐
│ Index Search                    │
│                                 │
│ movieId_index → [doc1, doc2...] │
│ (B-tree structure)              │
│ O(log n) time complexity        │
└─────────────────────────────────┘

Without Index:
┌─────────────────────────────────┐
│ Collection Scan                 │
│                                 │
│ Check every document            │
│ O(n) time complexity            │
│ SLOW for large collections      │
└─────────────────────────────────┘

AGGREGATION PIPELINE (Complex Queries):

Get average rating for a movie:
db.reviews.aggregate([
  { $match: { movieId: "550" } },
  {
    $group: {
      _id: "$movieId",
      avgRating: { $avg: "$rating" },
      totalReviews: { $sum: 1 }
    }
  },
  { $sort: { avgRating: -1 } }
])

Output:
{
  _id: "550",
  avgRating: 4.2,
  totalReviews: 45
}

Get user's watchlist with movie details:
db.users.aggregate([
  { $match: { _id: userId } },
  {
    $project: {
      watchlist: 1,
      totalMovies: { $size: "$watchlist" }
    }
  }
])
```

---

# 6. API Design 🔌

## REST API Principles

```
CineWorld follows REST (Representational State Transfer) principles:

1. RESOURCE-BASED URLS:
   ✓ /api/movies         (resource: movies)
   ✓ /api/users          (resource: users)
   ✓ /api/reviews        (resource: reviews)
   ✓ /api/notifications  (resource: notifications)
   
   ✗ /api/getMovies      (action-based - wrong)
   ✗ /api/createReview   (action-based - wrong)

2. HTTP METHODS:
   GET    → Retrieve data (safe, idempotent)
   POST   → Create data (not idempotent)
   PUT    → Full update (idempotent)
   DELETE → Remove data (idempotent)

3. STATUS CODES:
   200 → OK (success)
   201 → Created (resource created)
   400 → Bad Request (validation error)
   401 → Unauthorized (need login)
   403 → Forbidden (no permission)
   404 → Not Found (resource doesn't exist)
   429 → Too Many Requests (rate limited)
   500 → Server Error
```

## Complete API Endpoints

```
┌─────────────────────────────────────────────────────────────┐
│               AUTHENTICATION ENDPOINTS                       │
└─────────────────────────────────────────────────────────────┘

POST /api/auth/signup
├─ Body: { name, email, password }
├─ Validations:
│  ├─ Email format
│  ├─ Password >= 8 chars
│  └─ Email unique
├─ Response: { token, user }
├─ Side effects:
│  ├─ Send verification email
│  └─ Save user to database
└─ Rate limit: 20 req/15min

POST /api/auth/login
├─ Body: { email, password }
├─ Process:
│  ├─ Find user by email
│  ├─ Verify password (bcrypt)
│  ├─ Check account lockout
│  └─ Generate tokens
├─ Response: { token, user }
└─ Rate limit: 20 req/15min

POST /api/auth/logout
├─ Authorization: Bearer token
├─ Process:
│  └─ Invalidate refresh token in DB
├─ Response: { success: true }
└─ After logout:
   ├─ Frontend clears localStorage
   └─ Redirects to home

POST /api/auth/refresh
├─ Cookies: refreshToken
├─ Process:
│  ├─ Verify refreshToken
│  ├─ Old token invalidated
│  └─ New accessToken issued
├─ Response: { token }
├─ Called automatically by frontend
└─ Auto-refresh every 13 min


┌─────────────────────────────────────────────────────────────┐
│                  MOVIE ENDPOINTS                             │
└─────────────────────────────────────────────────────────────┘

GET /api/movies/home
├─ No auth required
├─ Cached: 10 minutes
├─ Response:
│  {
│    trending: [...20 movies],
│    popular: [...20 movies],
│    topRated: [...20 movies],
│    upcoming: [...20 movies]
│  }
└─ Backend: TMDB API call

GET /api/movies/search?query=fight&page=1
├─ Query params:
│  ├─ query: search term
│  ├─ page: pagination
│  └─ limit: results per page
├─ Debounced in frontend (300ms)
├─ Cached: 3 minutes
├─ Response:
│  {
│    results: [...movies],
│    total: 245,
│    pages: 13
│  }
└─ Backend: TMDB discover

GET /api/movies/:id
├─ URL param: movieId (TMDB ID)
├─ Cached: 1 hour
├─ Response:
│  {
│    id, title, overview, poster, backdrop,
│    releaseDate, genres, runtime, budget,
│    revenue, cast, crew, trailers,
│    watchProviders, similar, reviews,
│    ratings (avg from community)
│  }
└─ Backend: Multiple TMDB calls aggregated


┌─────────────────────────────────────────────────────────────┐
│                   USER ENDPOINTS                             │
└─────────────────────────────────────────────────────────────┘

GET /api/users/me
├─ Authorization: Bearer token
├─ Response:
│  {
│    id, name, email, avatar,
│    watchlist, savedMovies,
│    followers, following count
│  }
└─ No cache (always fresh)

PUT /api/users/me
├─ Authorization: Bearer token
├─ Body: { name, avatar }
├─ Validations:
│  ├─ Name length
│  └─ Avatar URL valid
├─ Response: Updated user
└─ Cache invalidation: Clear user cache

POST /api/users/me/watchlist
├─ Authorization: Bearer token
├─ Body: { movieId, title, status }
├─ Status: "want_to_watch" | "watching" | "watched"
├─ Duplicate handling: Update if exists
├─ Response: { updated watchlist }
└─ Cache invalidation: Clear watchlist

GET /api/users/me/watchlist
├─ Authorization: Bearer token
├─ Response:
│  {
│    watchlist: [
│      { id, title, status, poster... },
│      ...
│    ]
│  }
└─ Grouped by status in frontend

DELETE /api/users/me/watchlist/:movieId
├─ Authorization: Bearer token
├─ Response: { success: true }
├─ Side effect: Remove from watchlist
└─ Cache invalidation: Clear watchlist

POST /api/users/:userId/follow
├─ Authorization: Bearer token
├─ URL param: userId (user to follow)
├─ Side effects:
│  ├─ Add to following array
│  ├─ Create notification for target user
│  └─ Trigger SSE notification
├─ Response: { success: true }
└─ Rate limit: 100 req/hour

POST /api/users/:userId/unfollow
├─ Same as follow, opposite effect
└─ Response: { success: true }

GET /api/users/:userId (Profile)
├─ No auth required
├─ Returns: Public profile info
├─ Includes: User's public watchlist
└─ Filters: Only show if isProfilePublic=true


┌─────────────────────────────────────────────────────────────┐
│                 REVIEW ENDPOINTS                             │
└─────────────────────────────────────────────────────────────┘

POST /api/reviews
├─ Authorization: Bearer token
├─ Body: { movieId, rating, content }
├─ Validations:
│  ├─ Rating: 1-5
│  └─ Content: 2-1000 chars
├─ Unique constraint: One review per user per movie
├─ Response: { review created }
└─ Side effects: Invalidate movie reviews cache

GET /api/reviews/:movieId
├─ No auth required
├─ Query params: page, sort
├─ Response:
│  {
│    reviews: [...reviews],
│    aggregate: {
│      avgRating: 4.2,
│      totalCount: 45,
│      ratingBreakdown: { 5: 25, 4: 12, ... }
│    }
│  }
└─ Cached: 5 minutes

PUT /api/reviews/:reviewId
├─ Authorization: Bearer token
├─ Check: Only review owner can edit
├─ Body: { rating, content }
├─ Response: Updated review
└─ Cache invalidation: Clear movie reviews

DELETE /api/reviews/:reviewId
├─ Authorization: Bearer token
├─ Check: Only review owner can delete
├─ Response: { success: true }
└─ Cache invalidation: Clear movie reviews


┌─────────────────────────────────────────────────────────────┐
│                    AI ENDPOINTS                              │
└─────────────────────────────────────────────────────────────┘

POST /api/ai/search
├─ Authorization: Bearer token
├─ Body: { query: "scary movies 2020" }
├─ Process:
│  ├─ Parse with Groq LLM
│  ├─ Convert to TMDB params
│  └─ Fetch movies
├─ Response: { movies: [...] }
├─ Cache: 3 minutes
└─ Rate limit: 60 req/min

POST /api/ai/mood
├─ Authorization: Bearer token
├─ Body: { mood: "happy, relaxed" }
├─ Process:
│  └─ Groq generates recommendations
├─ Response: { movies: [...] }
└─ Rate limit: 60 req/min

POST /api/ai/chat (SSE Streaming)
├─ Authorization: Bearer token
├─ Body: { movieId, message: "Is this violent?" }
├─ Process:
│  ├─ Fetch movie details
│  ├─ Fetch community reviews (RAG)
│  └─ Stream Groq response
├─ Response: Server-Sent Events (streaming)
│  data: {"chunk": "Movie has..."}
│  data: {"chunk": " 40% action..."}
│  data: {"chunk": " but minimal violence."}
└─ Rate limit: 60 req/min

POST /api/ai/for-you
├─ Authorization: Bearer token
├─ Body: {} (empty, uses user's watchlist)
├─ Process:
│  ├─ Analyze user's taste
│  ├─ Generate recommendations
│  └─ Return top 10
├─ Response: { movies: [...] }
└─ Rate limit: 20 req/hour

POST /api/ai/similar
├─ Authorization: Bearer token
├─ Body: { movieId }
├─ Process:
│  ├─ Analyze movie features
│  ├─ Calculate vector similarity
│  └─ Return similar but different
├─ Response: { movies: [...] }
└─ Rate limit: 60 req/min


┌─────────────────────────────────────────────────────────────┐
│              NOTIFICATION ENDPOINTS                          │
└─────────────────────────────────────────────────────────────┘

GET /api/notifications
├─ Authorization: Bearer token
├─ Response:
│  {
│    notifications: [
│      { icon, text, link, read, createdAt },
│      ...
│    ]
│  }
└─ Sorted: Newest first

GET /api/notifications/stream (SSE)
├─ Authorization: Bearer token (via ?token=...)
├─ Process:
│  └─ Keep connection open
│  └─ Send notifications in real-time
├─ Response: Server-Sent Events
│  data: {"icon": "👤", "text": "User followed..."}
│  data: {"icon": "💬", "text": "New comment..."}
└─ Connection timeout: 30 minutes

PUT /api/notifications/:notifId
├─ Authorization: Bearer token
├─ Body: { read: true }
├─ Response: Updated notification
└─ Side effect: Update unread count

DELETE /api/notifications/:notifId
├─ Authorization: Bearer token
├─ Response: { success: true }
└─ Side effect: Update unread count
```

## API Response Format

```
SUCCESS RESPONSE:
┌────────────────────────────────────────┐
│ Status: 200 OK                         │
│                                        │
│ {                                      │
│   "success": true,                     │
│   "data": {                            │
│     // Response payload               │
│   }                                    │
│ }                                      │
└────────────────────────────────────────┘

ERROR RESPONSE:
┌────────────────────────────────────────┐
│ Status: 400/401/500 etc                │
│                                        │
│ {                                      │
│   "success": false,                    │
│   "error": {                           │
│     "code": "VALIDATION_ERROR",        │
│     "message": "Email invalid",        │
│     "details": [                       │
│       "field: email, issue: format"    │
│     ]                                  │
│   }                                    │
│ }                                      │
└────────────────────────────────────────┘

PAGINATION:
┌────────────────────────────────────────┐
│ {                                      │
│   "data": [...],                       │
│   "pagination": {                      │
│     "page": 1,                         │
│     "limit": 20,                       │
│     "total": 245,                      │
│     "pages": 13                        │
│   }                                    │
│ }                                      │
└────────────────────────────────────────┘
```

---

# 7. Caching Strategy 💾

## Multi-Layer Caching

```
┌──────────────────────────────────────────────────────────────┐
│              CACHING ARCHITECTURE                            │
└──────────────────────────────────────────────────────────────┘

LAYER 1: BROWSER CACHE (Client-Side)
┌────────────────────────────────────┐
│ localStorage                       │
├─ user data                        │
├─ authentication token             │
├─ recently viewed movies           │
└─ theme preference                 │

┌────────────────────────────────────┐
│ sessionStorage                     │
├─ temporary form data              │
└─ current search query             │

┌────────────────────────────────────┐
│ TanStack Query Cache               │
├─ API responses                    │
├─ Automatic refetch                │
├─ Stale time: 5 minutes            │
└─ GC time: 5 minutes               │

HTTP Cache Headers:
  Cache-Control: max-age=300  (5 min)
  ETag: "abc123"              (validate)


LAYER 2: IN-MEMORY SERVER CACHE (LRU)
┌────────────────────────────────────┐
│ Express Server Memory              │
├─ /movies/home → 10 min TTL        │
├─ /movies/search → 3 min TTL       │
├─ /movies/:id → 1 hour TTL         │
├─ /reviews/:movieId → 5 min TTL    │
└─ Max size: 1000 entries (LRU)     │

LRU = Least Recently Used
When max size reached:
├─ Remove oldest accessed item
└─ Add new item


LAYER 3: DATABASE INDEXES
┌────────────────────────────────────┐
│ MongoDB Indexes                    │
├─ _id (primary key)                │
├─ email (unique)                   │
├─ movieId (reviews)                │
├─ user (notifications)             │
└─ Compound indexes                 │

Index usage:
B-Tree Search: O(log n)
vs Full Scan: O(n)

Example: With 1 million documents
  Index: 20 iterations
  Scan:  1,000,000 iterations


LAYER 4: CDN CACHE (Frontend Files)
┌────────────────────────────────────┐
│ Vercel CDN (Global)                │
├─ JS bundles                       │
├─ CSS files                        │
├─ Images                           │
└─ Static assets                    │

Benefits:
├─ Served from nearest location
├─ Automatic gzip compression
└─ Cache headers optimized


CACHING WORKFLOW:

1. User Request
   ↓
2. Browser Cache Hit?
   ├─ Yes → Return from localStorage
   └─ No → Continue
   ↓
3. TanStack Query Cache Hit?
   ├─ Yes → Return from memory
   └─ Not stale → Continue
   ↓
4. API Request to Server
   ↓
5. Server In-Memory Cache Hit?
   ├─ Yes → Return cached response
   └─ No → Query database
   ↓
6. Database Query
   ↓
7. Index Search (Fast)
   ├─ Data found → Return
   └─ No → Full scan (Slow)
   ↓
8. Cache Response
   ├─ Store in LRU
   └─ Set TTL
   ↓
9. Response to Frontend
   ↓
10. TanStack Query Cache Update
   ↓
11. Display to User


CACHE INVALIDATION STRATEGY:

Time-Based (TTL):
  - /movies/home: 10 min
  - /movies/search: 3 min
  - /reviews: 5 min
  - /movies/:id: 1 hour

Event-Based:
  POST /api/reviews
  ↓
  1. Create review
  2. Invalidate /reviews/:movieId cache
  3. Invalidate movie ratings cache
  4. Response
  
  POST /api/users/:id/follow
  ↓
  1. Add follow
  2. Create notification (don't cache)
  3. Trigger SSE (real-time)
  
Manual Clear:
  - Admin command
  - Deployment (clear all)
  - Memory critical


CACHE HIT RATES:

Expected:
┌────────────────────────────┐
│ Home page:    95% cache hit│
│ Search:       70% cache hit│
│ Movie detail: 90% cache hit│
│ Reviews:      80% cache hit│
└────────────────────────────┘

Monitoring:
  Total requests: 10,000
  Cache hits:     8,500
  Cache hit rate: 85% ✓

Performance Impact:
  Cached response:   ~50ms
  Database response: ~200ms
  
  85% hit rate saves:
  (200 - 50) * 0.85 * 10,000 = 1,275,000ms = 21 minutes/day

That's huge! ⚡
```

---

# 8. Security Architecture 🔐

## Multi-Layer Security

```
┌──────────────────────────────────────────────────────────────┐
│                  SECURITY LAYERS                             │
└──────────────────────────────────────────────────────────────┘

LAYER 1: NETWORK SECURITY
┌────────────────────────────────────────┐
│ HTTPS/TLS Encryption                   │
├─ All traffic encrypted                │
├─ Certificate: Let's Encrypt            │
├─ TLS 1.2/1.3                          │
└─ Man-in-the-middle protection         │

┌────────────────────────────────────────┐
│ CORS Policy                            │
├─ Allowed origins:                     │
│  ├─ https://cineworld-kappa.vercel... │
│  ├─ https://cineworld.com             │
│  └─ http://localhost:5173             │
├─ Rejected origins blocked             │
└─ Credentials: include                 │

Attacker request from other site:
  ↓
Browser CORS check
  ↓
Origin not allowed
  ↓
Request blocked ✓


LAYER 2: INPUT VALIDATION & SANITIZATION
┌────────────────────────────────────────┐
│ Frontend Validation                    │
├─ Email format check                   │
├─ Password length check                │
└─ Prevents bad UX                      │

┌────────────────────────────────────────┐
│ Backend Validation (Zod)               │
├─ Email format                         │
├─ Password requirements                │
├─ String length limits                 │
├─ Type checking                        │
└─ Data sanitization                    │

Example:
Input: "<script>alert('xss')</script>"
  ↓
Zod Schema: z.string().max(1000)
  ↓
Output: Escaped/Removed
  ↓
Database: Safe data stored ✓

┌────────────────────────────────────────┐
│ mongo-sanitize Middleware              │
├─ Removes $, . from input keys         │
└─ Prevents NoSQL injection             │

Attack attempt:
  POST /api/auth/login
  {
    "email": { "$gt": "" },
    "password": "anything"
  }
  
This would bypass password check!

mongo-sanitize blocks it:
  ✓ Detects suspicious operators
  └─ Removes $ characters


LAYER 3: AUTHENTICATION
┌────────────────────────────────────────┐
│ Password Security                      │
├─ bcrypt hashing (10 rounds)           │
├─ Random salt per password             │
└─ Cannot reverse hash                  │

bcrypt example:
Input:   "MyPassword123"
Rounds:  10
Salt:    random_salt_123
Hash:    $2b$10$N9qo8uLOickgx2ZMRZo...

Same password, different hash (because salt changes)

┌────────────────────────────────────────┐
│ JWT Token Management                   │
├─ accessToken (15 min)                 │
├─ refreshToken (7 days, HttpOnly)      │
├─ Token rotation on refresh            │
└─ Prevents token hijacking             │

Token theft scenario:
Attacker steals token via:
├─ XSS attack
├─ Network interception
└─ localStorage breach

HttpOnly cookie protection:
✓ XSS can't access refreshToken
✓ Only sent over HTTPS
✓ SameSite=Strict (CSRF protection)

┌────────────────────────────────────────┐
│ Account Lockout                        │
├─ 5 failed login attempts              │
├─ Account locked 15 minutes            │
└─ Prevents brute force attacks         │

Attack: Try 1000 passwords/minute
  ↓
After 5 failures: Account locked
  ↓
Attacker waits 15 minutes
  ↓
Can't try more passwords
  ↓
Attack defeated ✓


LAYER 4: API SECURITY
┌────────────────────────────────────────┐
│ Rate Limiting                          │
├─ General: 600 req/15min per IP        │
├─ Auth: 20 req/15min per IP            │
├─ AI: 60 req/min per IP                │
└─ Prevents DDoS & brute force          │

Attack: Spam API with requests
  ↓
Rate limiter counts requests
  ↓
Limit exceeded
  ↓
429 Too Many Requests
  ↓
Attack blocked ✓

┌────────────────────────────────────────┐
│ Helmet.js Security Headers             │
├─ X-Frame-Options: DENY                │
│  └─ Prevent clickjacking              │
│                                       │
├─ X-Content-Type-Options: nosniff      │
│  └─ Prevent MIME type sniffing        │
│                                       │
├─ Strict-Transport-Security            │
│  └─ Force HTTPS                       │
│                                       │
├─ Content-Security-Policy              │
│  └─ Prevent XSS attacks               │
│                                       │
└─ X-XSS-Protection                     │
   └─ XSS protection mode on            │

Benefits:
  ✓ Clickjacking protection
  ✓ XSS prevention
  ✓ MIME sniffing prevention


LAYER 5: DATA SECURITY
┌────────────────────────────────────────┐
│ Sensitive Data Handling                │
├─ Never log passwords                  │
├─ Never send tokens in URLs            │
├─ Use HttpOnly cookies                 │
├─ Encrypt in transit (HTTPS)           │
└─ Hash passwords at rest               │

┌────────────────────────────────────────┐
│ Database Security                      │
├─ MongoDB Atlas IP whitelist           │
├─ Connection encryption                │
├─ User authentication                  │
└─ Role-based access control            │

┌────────────────────────────────────────┐
│ Error Handling                         │
├─ Don't expose stack traces            │
├─ Generic error messages               │
├─ Log errors server-side               │
└─ Send sanitized responses             │

Bad error response:
  404 User not found in database
  └─ Reveals database structure
  
Good error response:
  400 Invalid credentials
  └─ Generic, no info leaked


LAYER 6: MONITORING & INCIDENT RESPONSE
┌────────────────────────────────────────┐
│ Sentry Error Tracking                  │
├─ Capture all errors                   │
├─ Alert on critical issues             │
├─ Stack traces for debugging           │
└─ User impact analysis                 │

┌────────────────────────────────────────┐
│ Logging                                │
├─ Winston logs all requests            │
├─ Track suspicious activity            │
├─ Audit trail for compliance           │
└─ Help in incident investigation       │

┌────────────────────────────────────────┐
│ Monitoring Alerts                      │
├─ Unusual login patterns               │
├─ High error rates                     │
├─ Rate limit violations                │
└─ Database connection issues           │


ATTACK SCENARIOS & DEFENSES:

1. SQL/NoSQL Injection
   Attack: db.users.find({ email: { $ne: "" } })
   Defense: mongo-sanitize + Zod validation ✓

2. XSS (Cross-Site Scripting)
   Attack: <img src=x onerror=alert('xss')>
   Defense: Input validation + HttpOnly cookies ✓

3. CSRF (Cross-Site Request Forgery)
   Attack: Fake form submitting from other site
   Defense: SameSite=Strict cookies + CORS ✓

4. Brute Force
   Attack: Try 1000 passwords
   Defense: Rate limiting + account lockout ✓

5. Token Hijacking
   Attack: Steal JWT token
   Defense: Short expiry + HttpOnly + HTTPS ✓

6. DDoS (Distributed Denial of Service)
   Attack: 1000s of requests per second
   Defense: Rate limiting + CDN ✓

7. Man-in-the-Middle
   Attack: Intercept HTTPS traffic
   Defense: TLS encryption + certificates ✓
```

---

# 9. Scalability & Performance 🚀

## Horizontal Scalability

```
┌──────────────────────────────────────────────────────────────┐
│            SCALING ARCHITECTURE                              │
└──────────────────────────────────────────────────────────────┘

SINGLE SERVER (Startup Phase):
┌────────────────────────────────┐
│   All-in-One Server            │
│ ├─ Express API                │
│ ├─ Database connection        │
│ ├─ Cache (in-memory)          │
│ ├─ Email queue                │
│ └─ Job scheduler              │
│                               │
│ Can handle: ~100 concurrent   │
└────────────────────────────────┘

As users grow: Performance degrades ↓

MULTIPLE SERVERS (Scale-Out):
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Server 1 │  │ Server 2 │  │ Server 3 │
├─ Express ├──┼─ Express ├──┼─ Express ├─┐
└─────┬────┘  └─────┬────┘  └─────┬────┘ │
      │            │              │      │
      └─────────────┼──────────────┘      │
                    │                    │
            ┌───────▼────────┐           │
            │ Load Balancer  │◄──────────┘
            │ (Distribute    │
            │  traffic)      │
            └───────┬────────┘
                    │
            ┌───────▼────────┐
            │ Shared Database│
            │ (MongoDB Atlas)│
            └────────────────┘

Benefits:
├─ Each server independent
├─ One server fails → Others still running
├─ Traffic distributed evenly
└─ Can handle 1000s of concurrent users


LOAD BALANCING STRATEGY:

Round-Robin:
Request 1 → Server 1
Request 2 → Server 2
Request 3 → Server 3
Request 4 → Server 1 (cycles)

Least Connections:
Request 1 → Server 1 (1 connection)
Request 2 → Server 2 (1 connection)
Request 3 → Server 3 (1 connection)
Request 4 → Server 1 (but connection ends first)

Geographic:
User in USA → Nearest US server
User in Europe → Nearest EU server


CACHING FOR SCALABILITY:

Without Caching:
┌─────────────────────────────────┐
│ 1000 users request /movies/home │
│                                 │
│ All 1000 hit database          │
│ All 1000 queries to TMDB       │
│ Slow response                  │
│ High database load             │
└─────────────────────────────────┘

With Caching:
┌──────────────────────────────────┐
│ 1000 users request /movies/home  │
│                                  │
│ Request 1 → Query database      │
│ Requests 2-1000 → Serve cached  │
│                                  │
│ 999 requests saved              │
│ Low database load               │
│ Fast responses                  │
└──────────────────────────────────┘

Cache hit rate: 99.9% ✓


DATABASE SCALING:

Replica Sets:
┌────────────────────────┐
│ Primary DB             │
│ (Writes)               │
└──────────┬─────────────┘
           │ Replication
   ┌───────┴────────┐
   │                │
   ▼                ▼
Secondary 1      Secondary 2
(Read-only)      (Read-only)

Benefits:
├─ Automatic failover
├─ Read scaling
├─ Data redundancy
└─ High availability

Query Distribution:
Writes  → Primary node
Reads   → Secondary nodes (3x capacity!)


READ-WRITE SEPARATION:

Write-Heavy Operations:
├─ Create review
├─ Add to watchlist
├─ Follow user
└─ → Primary database

Read-Heavy Operations:
├─ Browse movies
├─ Search
├─ View reviews
└─ → Replica/Cache

Result: Better utilization ✓


MONITORING SCALABILITY:

Metrics to Track:
┌────────────────────────────────┐
│ API Response Time              │
│                                │
│ Target: < 200ms               │
│ Alert: > 500ms                │
│                                │
│ Trend: Should stay flat as    │
│ users increase (scaling works)│
└────────────────────────────────┘

┌────────────────────────────────┐
│ Database Query Time            │
│                                │
│ Target: < 100ms               │
│ Alert: > 300ms                │
│                                │
│ Indicates: Need more indexes  │
│ or replica scaling            │
└────────────────────────────────┘

┌────────────────────────────────┐
│ Server CPU / Memory Usage      │
│                                │
│ Target: 60-70%                │
│ Alert: > 85%                  │
│                                │
│ Indicates: Need another server│
└────────────────────────────────┘

┌────────────────────────────────┐
│ Concurrent Users               │
│                                │
│ Single server: ~100-200       │
│ Per added server: +100-200    │
│                                │
│ Linear scaling with servers   │
└────────────────────────────────┘
```

## Performance Optimization

```
PERFORMANCE METRICS:

Page Load Time Target: < 2 seconds
API Response Target: < 200ms
Database Query Target: < 100ms

Monitoring Tools:
├─ Google Lighthouse
├─ WebPageTest
├─ Chrome DevTools
└─ Render Analytics


OPTIMIZATION TECHNIQUES:

1. LAZY LOADING (Frontend)
   
   Without:
   ├─ Load all pages at start
   ├─ Large JS bundle (2MB)
   └─ Slow initial load
   
   With:
   ├─ Load page only when needed
   ├─ Smaller initial bundle (200KB)
   └─ Fast initial load ✓
   
   Code:
   const Home = lazy(() => import('./pages/Home'))
   const Watchlist = lazy(() => import('./pages/Watchlist'))

2. CODE SPLITTING
   
   Bundle analysis:
   Initial bundle: 2MB
   ├─ React: 400KB
   ├─ Dependencies: 800KB
   ├─ Home page: 300KB
   ├─ Watchlist page: 300KB
   └─ Other: 200KB
   
   Solution:
   Separate chunks:
   ├─ Vendor: 400KB (cache 1 year)
   ├─ Home: 300KB (cache 1 month)
   ├─ Watchlist: 300KB (cache 1 month)
   └─ Common: 200KB (cache 1 month)
   
   Result: Smaller initial load ✓

3. IMAGE OPTIMIZATION
   
   Before:
   Homepage:
   ├─ 20 movie posters
   ├─ Each 200KB
   └─ Total: 4MB images
   
   Optimizations:
   ├─ WebP format (50% smaller)
   ├─ Responsive images (srcset)
   ├─ Lazy load below fold
   ├─ Compress (90% quality)
   ├─ CDN delivery
   └─ Result: 400KB total (10x reduction!) ✓

4. DATABASE OPTIMIZATION
   
   Slow Query:
   db.users.find({}, { watchlist: 1 })
   Full collection scan: O(n)
   With 1M users: ~1000ms
   
   With Index:
   db.users.findOne({ _id: userId }, { watchlist: 1 })
   Index lookup: O(log n)
   With 1M users: ~1ms (1000x faster!) ✓

5. CACHING STRATEGY
   
   API calls reduced:
   Without cache: Every request hits API
   With cache:
   ├─ 95% cache hits
   ├─ 5% database hits
   └─ 20x performance improvement ✓

6. COMPRESSION
   
   Gzip compression (automatic on Vercel/Render):
   JS bundle: 500KB → 100KB (5x smaller)
   JSON response: 100KB → 20KB (5x smaller)
   
   Transfer time:
   Without: 1 MB ÷ 1 Mbps = 8 seconds
   With: 200 KB ÷ 1 Mbps = 1.6 seconds

7. CDN DISTRIBUTION
   
   Without CDN:
   User in Tokyo → US server → 200ms latency
   
   With CDN (80+ locations):
   User in Tokyo → Tokyo CDN → 10ms latency ✓
   
   Benefit: 20x faster for global users


PERFORMANCE MONITORING DASHBOARD:

Metrics tracked in real-time:
┌──────────────────────────────────┐
│ Frontend                          │
│ • Page Load Time: 1.2s           │
│ • Time to Interactive: 2.0s      │
│ • Bundle Size: 245KB             │
│ • Cache Hit Rate: 94%            │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Backend                           │
│ • API Latency: 85ms              │
│ • Database Latency: 45ms         │
│ • Error Rate: 0.1%               │
│ • Requests/sec: 150              │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Database                          │
│ • Query Time: 50ms               │
│ • Connections: 12/50             │
│ • Storage: 2GB/10GB              │
│ • Replication Lag: 0ms           │
└──────────────────────────────────┘
```

---

# 10. Deployment Architecture 🚀

## Multi-Environment Deployment

```
┌──────────────────────────────────────────────────────────────┐
│              DEPLOYMENT PIPELINE                             │
└──────────────────────────────────────────────────────────────┘

DEVELOPMENT ENVIRONMENT:
┌────────────────────────────────────────┐
│ Developer's Machine                    │
│                                        │
│ npm run dev (both frontend + backend) │
│ ├─ Frontend: http://localhost:5173   │
│ ├─ Backend: http://localhost:8000    │
│ └─ Database: MongoDB Atlas            │
│                                        │
│ .env.example for configuration       │
│ Git branches: feature/*               │
└────────────────────────────────────────┘


STAGING ENVIRONMENT (Optional):
┌────────────────────────────────────────┐
│ Test Before Production                │
│                                        │
│ Frontend: staging.cineworld.com      │
│ Backend: api-staging.render.com      │
│ Database: MongoDB staging instance   │
│                                        │
│ Tests automated features             │
│ QA team validates                    │
│ Bug fixes before production          │
└────────────────────────────────────────┘


PRODUCTION ENVIRONMENT:
┌────────────────────────────────────────┐
│ Live Users Access                     │
│                                        │
│ Frontend: cineworld-kappa.vercel.app │
│ Backend: cineworld-api.render.com    │
│ Database: MongoDB prod instance      │
│                                        │
│ SSL/TLS certificates                 │
│ Security hardened                    │
│ Monitoring & logging enabled         │
│ Backup strategy active               │
└────────────────────────────────────────┘


GIT WORKFLOW:

Feature Development:
┌─ git checkout -b feature/new-feature
├─ Make changes
├─ git commit
└─ Push to GitHub

Pull Request:
├─ Request review
├─ Automated tests run
├─ Code review by team
└─ Merge if approved

Staging Deploy (Automated):
├─ Push to develop branch
├─ GitHub webhook triggered
├─ Render pulls latest code
├─ Tests run
├─ Deploy to staging
└─ QA tests

Production Deploy (Automated):
├─ Merge to main branch
├─ GitHub webhook triggered
├─ Vercel pulls frontend code
│  ├─ npm install
│  ├─ npm run build
│  └─ Deploy to CDN
├─ Render pulls backend code
│  ├─ npm install
│  ├─ Health check
│  └─ Restart server
└─ Both live within 3-5 minutes


CI/CD PIPELINE:

┌────────────────────────────────────┐
│ Developer pushes code to GitHub    │
└──────────────┬─────────────────────┘
               │
    ┌──────────▼──────────┐
    │ GitHub Webhooks     │
    └──────┬──────┬───────┘
           │      │
      Vercel  Render  Sentry
           │      │      │
    ┌──────▼──┐ ┌──▼──┐ ┌▼──────────────┐
    │ Build   │ │Test │ │Code Analysis  │
    │Frontend │ │&    │ │- Lint         │
    │- npm    │ │Build│ │- Typecheck    │
    │install  │ │- npm│ │- Security     │
    │- build  │ │test │ └───────┬───────┘
    │- deploy │ └──┬──┘         │
    └────┬────┘    │            │
         │    ┌────▼────┐       │
         │    │Success? │       │
         │    └────┬────┘       │
         │         │ All OK     │
         │    ┌────▼────────────▼─────┐
         │    │ Deploy to Production  │
         │    │ - Frontend: CDN       │
         │    │ - Backend: Server     │
         │    │ - Database: Migrate   │
         │    └────┬─────────────────┘
         │         │
         │    ┌────▼─────────────────┐
         │    │ Smoke Tests          │
         │    │ - Health check       │
         │    │ - API verify         │
         │    │ - DB connection      │
         │    └────┬────────────────┘
         │         │
         │    ┌────▼─────────────────┐
         │    │ Notify Team          │
         │    │ Deploy successful ✓  │
         │    └──────────────────────┘


DEPLOYMENT CONFIGURATION:

Vercel (Frontend):
┌────────────────────────────────────────┐
│ vercel.json                            │
├─ Build command: npm --prefix client   │
│                 run build              │
├─ Output directory: client/dist         │
├─ Environment variables:               │
│  └─ VITE_API_URL=api endpoint        │
├─ Regions: Global CDN                  │
└─ Auto-deploy on main branch           │
└─ Zero-downtime deployment             │
└─ Auto-rollback on failure             │
└─ 100% uptime SLA                      │

Render (Backend):
┌────────────────────────────────────────┐
│ render.yaml                            │
├─ Service type: Node.js                │
├─ Build command: npm install            │
├─ Start command: node server/index.js  │
├─ Environment variables:               │
│  ├─ NODE_ENV=production               │
│  ├─ MONGO_URI=...                     │
│  ├─ JWT_SECRET=...                    │
│  └─ [other secrets]                   │
├─ Instance type: Standard (0.5 CPU)    │
├─ Auto-scaling: 1-3 instances          │
├─ Health check: /api/health (30s)      │
├─ Auto-deploy on main branch           │
└─ Automatic HTTPS                      │

Database (MongoDB Atlas):
┌────────────────────────────────────────┐
│ Cloud Configuration                    │
├─ Tier: M0 Free (512 MB storage)        │
├─ Region: US (closest to servers)       │
├─ Replication: 3-node replica set      │
├─ Backup: Daily snapshots (7-day)      │
├─ Authentication:                      │
│  ├─ IP whitelist: 0.0.0.0/0           │
│  └─ Username/password auth            │
├─ Connection string encrypted          │
└─ Automatic failover enabled           │


ROLLBACK STRATEGY:

If production issue detected:
┌─ Sentry alerts team
├─ Review error logs
├─ Identify problematic commit
└─ Decide: Fix or rollback?

Rollback process:
1. git revert <commit-hash>
2. git push main
3. GitHub triggers CI/CD
4. New version deployed
5. Verification: API working?
6. Timeline: 5 minutes total

Rollback vs Fix:
├─ Rollback: 5 min (quick, lose latest feature)
└─ Fix forward: 30 min (fix, keep latest feature)
```

---

# 11. Monitoring & Logging 📊

## Observability Stack

```
┌──────────────────────────────────────────────────────────────┐
│           MONITORING & OBSERVABILITY                         │
└──────────────────────────────────────────────────────────────┘

THREE PILLARS OF OBSERVABILITY:

1. LOGS (What happened?)
2. METRICS (How many/much?)
3. TRACES (How did it happen?)


LOG AGGREGATION (Winston):

┌────────────────────────────────────────┐
│ Winston Logger Configuration           │
│                                        │
│ Development:                           │
│ ├─ Console output (colorized)         │
│ └─ Real-time debugging                │
│                                        │
│ Production:                            │
│ ├─ File logs (daily rotation)         │
│ ├─ Error logs (separate file)         │
│ └─ Archive old logs (7 days)          │
└────────────────────────────────────────┘

Log levels:
INFO    - Important events
WARNING - Unexpected but handled
ERROR   - Something went wrong
DEBUG   - Detailed info

Example logs:
┌────────────────────────────────────────┐
│ [2026-09-19T14:30:45Z] INFO:          │
│ GET /api/movies/home 200 45ms         │
│                                        │
│ [2026-09-19T14:31:22Z] INFO:          │
│ User login successful: raj@mail.com   │
│                                        │
│ [2026-09-19T14:32:15Z] ERROR:         │
│ Database connection timeout           │
│ Stack: at connectDB (db.js:25)        │
│                                        │
│ [2026-09-19T14:33:00Z] WARNING:       │
│ Rate limit exceeded from 192.168.1.1  │
└────────────────────────────────────────┘


ERROR TRACKING (Sentry):

┌────────────────────────────────────────┐
│ Sentry Dashboard                       │
│                                        │
│ Real-time error monitoring            │
│                                        │
│ Alerts:                                │
│ • New error type detected             │
│ • Error spike (10+ in 1 min)          │
│ • Regression (error count increasing) │
│                                        │
│ Data captured:                         │
│ • Stack trace                         │
│ • Environment (prod/dev)              │
│ • User info (anonymous)               │
│ • Request context                     │
│ • Browser/Device info                 │
│                                        │
│ Actions:                               │
│ • Assign to team member               │
│ • Create GitHub issue                 │
│ • Track fix status                    │
│ • Notify on resolution                │
└────────────────────────────────────────┘


METRICS & PERFORMANCE:

┌────────────────────────────────────────┐
│ Application Metrics                    │
│                                        │
│ Requests:                              │
│ • Total requests: 10,000/hour         │
│ • Success rate: 99.9%                 │
│ • Error rate: 0.1%                    │
│                                        │
│ Latency:                               │
│ • P50: 45ms (median)                  │
│ • P95: 200ms (95th percentile)        │
│ • P99: 500ms (99th percentile)        │
│                                        │
│ Database:                              │
│ • Query count: 5,000/hour             │
│ • Query latency: 50ms avg             │
│ • Connection pool: 12/50 used         │
│                                        │
│ API Endpoints (Top 5):                │
│ • GET /movies/home: 2,000 req/hour   │
│ • POST /ai/search: 800 req/hour      │
│ • GET /movies/:id: 3,000 req/hour    │
│ • GET /watchlist: 1,500 req/hour     │
│ • POST /reviews: 500 req/hour        │
└────────────────────────────────────────┘


HEALTH CHECKS:

┌────────────────────────────────────────┐
│ Periodic Health Monitoring             │
│ (Every 30 seconds)                     │
│                                        │
│ API Health:                            │
│ ├─ Server responsive?                 │
│ ├─ Port listening?                    │
│ └─ Status: OK                         │
│                                        │
│ Database Health:                       │
│ ├─ Connection successful?             │
│ ├─ Query latency < 100ms?            │
│ └─ Status: OK                         │
│                                        │
│ External Services:                     │
│ ├─ TMDB API responding?               │
│ ├─ Groq API responding?               │
│ └─ Status: OK                         │
│                                        │
│ If any fails:                          │
│ └─ Alert ops team immediately        │
│ └─ Automatic restart if needed        │
│ └─ Fallback logic triggered           │
└────────────────────────────────────────┘


TRACING & REQUEST FLOW:

┌────────────────────────────────────────┐
│ Distributed Tracing                    │
│                                        │
│ User Request:                          │
│ GET /api/movies/search?query=action   │
│                                        │
│ Trace ID: abc123def                   │
│                                        │
│ ├─[0ms]  Receive request              │
│ ├─[5ms]  CORS check                   │
│ ├─[10ms] Rate limit check             │
│ ├─[15ms] Zod validation               │
│ ├─[50ms] Groq LLM call                │
│ ├─[100ms] TMDB API call               │
│ ├─[150ms] Cache response              │
│ ├─[155ms] Send response               │
│ └─[160ms] Total duration              │
│                                        │
│ Bottleneck: Groq LLM (50ms)           │
│ Opportunity: Move to async job        │
└────────────────────────────────────────┘


ALERTING RULES:

Critical (Page immediately):
├─ Uptime < 95% in 5 min
├─ Error rate > 5%
├─ API latency > 1000ms
├─ Database connection lost
└─ Deployment failed

Warning (Email notification):
├─ Uptime < 98%
├─ Error rate > 1%
├─ API latency > 500ms
├─ Cache hit rate < 80%
└─ Disk usage > 80%

Info (Dashboard only):
├─ New error type
├─ Slow query detected
├─ High memory usage
└─ Certificate expiring soon


ON-CALL PLAYBOOK:

High Error Rate Alert:
├─ 1. Check Sentry for error details
├─ 2. Review recent commits
├─ 3. Check infrastructure metrics
├─ 4. Rollback if necessary
└─ 5. Deploy fix and verify

Database Slow Query:
├─ 1. Review slow query log
├─ 2. Check query plan
├─ 3. Add missing index
├─ 4. Monitor after deployment
└─ 5. Update documentation

High Latency:
├─ 1. Check server CPU/memory
├─ 2. Review active requests
├─ 3. Check external API latency
├─ 4. Scale up if necessary
└─ 5. Analyze after spike ends
```

---

# 12. Trade-offs & Design Decisions 🤝

## Architectural Trade-offs

```
┌──────────────────────────────────────────────────────────────┐
│           DECISIONS & TRADE-OFFS                             │
└──────────────────────────────────────────────────────────────┘

1. MONOREPO vs MULTI-REPO

┌─────────────────────────────────────┐
│ CHOSEN: MONOREPO                    │
│                                     │
│ Structure:                          │
│ cineworld/                          │
│ ├─ client/ (React)                 │
│ ├─ server/ (Express)               │
│ └─ package.json (root)             │
│                                     │
│ Pros:                               │
│ ├─ Single git repository           │
│ ├─ Shared CI/CD pipeline           │
│ ├─ Easy code sharing               │
│ ├─ Single npm install              │
│ └─ Atomic commits                  │
│                                     │
│ Cons:                               │
│ ├─ Larger repo size                │
│ ├─ Can't deploy independently      │
│ └─ More complex dependencies       │
│                                     │
│ Why chosen:                         │
│ For a single team, single project  │
│ Monorepo is simpler and faster     │
└─────────────────────────────────────┘

Alternative: Multi-repo
├─ Pros: Independent deployment
├─ Cons: Complex coordination
└─ Not needed for current scale


2. IN-MEMORY CACHE vs REDIS

┌─────────────────────────────────────┐
│ CHOSEN: IN-MEMORY (LRU Cache)      │
│                                     │
│ Implementation:                     │
│ class LRU {                         │
│   constructor(capacity) { }        │
│   get(key) { }                     │
│   set(key, value) { }              │
│ }                                  │
│                                     │
│ Pros:                               │
│ ├─ No infrastructure overhead      │
│ ├─ Simple implementation           │
│ ├─ Sufficient for single server    │
│ ├─ No network latency              │
│ └─ Free (no cost)                  │
│                                     │
│ Cons:                               │
│ ├─ Only works on 1 server          │
│ ├─ Cache lost on restart           │
│ ├─ Limited size (max 1000 entries) │
│ └─ Not suitable for distributed    │
│                                     │
│ Future: If scaling to multiple    │
│ servers, migrate to Redis          │
└─────────────────────────────────────┘

Alternative: Redis
├─ Pros: Distributed, persistent
├─ Cons: Infrastructure cost
└─ Used when: Multiple servers


3. JWT vs SESSIONS

┌─────────────────────────────────────┐
│ CHOSEN: JWT (JSON Web Tokens)      │
│                                     │
│ Token-based auth:                  │
│ Client stores token                │
│ Each request: Send token           │
│ Server: Verify token               │
│                                     │
│ Pros:                               │
│ ├─ Stateless (no session storage)  │
│ ├─ Scalable (no sync needed)       │
│ ├─ Works with CDN/static serving   │
│ ├─ Mobile-friendly                 │
│ └─ JWT refresh rotation for safety │
│                                     │
│ Cons:                               │
│ ├─ Can't revoke instantly         │
│ ├─ Need to rotate refresh token   │
│ └─ Slightly larger request size    │
│                                     │
│ Implementation:                     │
│ - accessToken: 15 min (httpOnly)  │
│ - refreshToken: 7 days (cookie)   │
│ - Auto-refresh: 13 minutes        │
└─────────────────────────────────────┘

Alternative: Sessions
├─ Pros: Easy revocation
├─ Cons: Database overhead, not scalable
└─ Used for: Traditional apps


4. GROQ vs OPENAI vs LOCAL LLM

┌─────────────────────────────────────┐
│ CHOSEN: GROQ                        │
│                                     │
│ Reasons:                            │
│ ├─ Free tier sufficient            │
│ ├─ 2x faster than OpenAI          │
│ ├─ Open-source Llama models       │
│ ├─ No long-term commitments       │
│ └─ Good quality responses          │
│                                     │
│ Alternative: OpenAI GPT            │
│ ├─ Pros: Best quality              │
│ ├─ Cons: $5-20/month costs        │
│ └─ For: Production with budget     │
│                                     │
│ Alternative: Local Llama           │
│ ├─ Pros: Free, private            │
│ ├─ Cons: Slow, requires GPU       │
│ └─ For: Privacy-critical apps     │
│                                     │
│ Chosen for MVP:                    │
│ Groq hits sweet spot between       │
│ cost and quality                   │
└─────────────────────────────────────┘


5. VERCEL vs AWS vs HEROKU

┌─────────────────────────────────────┐
│ CHOSEN: VERCEL (Frontend)          │
│ CHOSEN: RENDER (Backend)           │
│                                     │
│ Vercel Pros:                        │
│ ├─ Optimized for Next.js/React    │
│ ├─ Global CDN included             │
│ ├─ Zero-config deployments         │
│ ├─ Free tier available             │
│ └─ Excellent DX                    │
│                                     │
│ Render Pros:                        │
│ ├─ Easy Node.js deployment        │
│ ├─ Managed databases included      │
│ ├─ Free tier with limits           │
│ ├─ Good scaling options            │
│ └─ Simple pricing                  │
│                                     │
│ Alternative: AWS                   │
│ ├─ Pros: Maximum control           │
│ ├─ Cons: Complex setup, expensive  │
│ └─ For: Enterprise apps            │
│                                     │
│ Chosen for:                         │
│ Quick deployment, low cost,        │
│ Good for startups & small teams    │
└─────────────────────────────────────┘


6. MONGODB vs POSTGRESQL

┌─────────────────────────────────────┐
│ CHOSEN: MongoDB (NoSQL)            │
│                                     │
│ Why:                                │
│ ├─ Flexible schema (movies vary)   │
│ ├─ JSON-like structure (natural)   │
│ ├─ Easy nested documents           │
│ ├─ Free atlas tier                 │
│ └─ Mongoose for validation         │
│                                     │
│ Pros:                               │
│ ├─ Schema flexibility              │
│ ├─ Horizontal scaling (sharding)   │
│ ├─ Good for read-heavy workloads   │
│ └─ Aggregation pipeline powerful   │
│                                     │
│ Cons:                               │
│ ├─ No ACID transactions (until 4.0)│
│ ├─ Higher memory usage             │
│ └─ Less mature for joins           │
│                                     │
│ Alternative: PostgreSQL            │
│ ├─ Pros: ACID, mature, relational │
│ ├─ Cons: Less flexible             │
│ └─ For: Structured financial data  │
│                                     │
│ Chosen because:                     │
│ Movies data is semi-structured     │
│ and needs flexibility              │
└─────────────────────────────────────┘


7. REALTIME: SSE vs WEBSOCKETS vs POLLING

┌─────────────────────────────────────┐
│ CHOSEN: SSE (Server-Sent Events)   │
│                                     │
│ Why:                                │
│ ├─ Notifications are 1-way         │
│ ├─ Server → Client only            │
│ ├─ Simpler than WebSockets         │
│ ├─ Works over HTTP                 │
│ └─ Auto-reconnect built-in         │
│                                     │
│ Cons:                               │
│ ├─ No client → server messages    │
│ └─ Not suited for bidirectional    │
│                                     │
│ Alternative: WebSockets             │
│ ├─ Pros: Bidirectional             │
│ ├─ Cons: More complex              │
│ └─ For: Real-time chat            │
│                                     │
│ Alternative: Polling               │
│ ├─ Pros: Simple                    │
│ ├─ Cons: Inefficient, high latency│
│ └─ For: Legacy browsers            │
│                                     │
│ Chosen for MVP:                    │
│ Notifications are server → client  │
│ SSE perfect for this use case      │
└─────────────────────────────────────┘


8. EMAIL: NODEMAILER vs SENDGRID vs AWS SES

┌─────────────────────────────────────┐
│ CHOSEN: Nodemailer                 │
│                                     │
│ Why:                                │
│ ├─ Works with Gmail SMTP           │
│ ├─ Free option (Gmail app password)│
│ ├─ Simple to implement             │
│ ├─ Full control                    │
│ └─ Good enough for MVP             │
│                                     │
│ Pros:                               │
│ ├─ No vendor lock-in               │
│ ├─ Works with any SMTP             │
│ └─ Lightweight                     │
│                                     │
│ Cons:                               │
│ ├─ Gmail limits: 500/day           │
│ ├─ No built-in analytics           │
│ └─ More config needed              │
│                                     │
│ Alternative: SendGrid              │
│ ├─ Pros: High volume, analytics    │
│ ├─ Cons: Cost ($20-100/month)      │
│ └─ For: Production scale           │
│                                     │
│ Chosen for:                         │
│ Low volume, low cost MVP           │
│ Migrate to SendGrid if scale > 100k
└─────────────────────────────────────┘


SUMMARY OF KEY DECISIONS:

┌────────────────────────────────────────────────────────┐
│ Architecture Decision Matrix                          │
│                                                       │
│ Monorepo         ✓ Simple, unified                   │
│ In-Memory Cache  ✓ Fast, no overhead                │
│ JWT Auth         ✓ Scalable, stateless               │
│ MongoDB          ✓ Flexible schema                   │
│ Groq AI          ✓ Fast, free tier                   │
│ Vercel + Render  ✓ Quick, affordable                │
│ SSE Notifs       ✓ Simple, server→client            │
│ Nodemailer       ✓ Flexible, low cost               │
│                                                       │
│ All choices optimized for:                          │
│ → Quick MVP development                            │
│ → Low infrastructure cost                          │
│ → Easy to scale later                              │
│ → Good performance baseline                        │
└────────────────────────────────────────────────────────┘
```

---

# FINAL SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE SYSTEM                              │
└─────────────────────────────────────────────────────────────────┘

                          ↓ USERS ↓
        
        ┌─────────────┬───────────┬─────────────┐
        │             │           │             │
        ▼             ▼           ▼             ▼
    ┌───────────┬─────────────┬────────────┬──────────┐
    │ Browser   │ Mobile App  │ Desktop    │ API User │
    │ Client    │             │ App        │          │
    └──────┬────┴────┬────────┴────┬───────┴────┬─────┘
           │         │             │            │
           └─────────┴─────────────┴────────────┘
                     │
                     ▼ (HTTPS)
            ┌────────────────────┐
            │ Vercel CDN         │
            │ (Global + Local)   │
            │ - Static files     │
            │ - React bundles    │
            │ - Images           │
            └────────────┬───────┘
                         │
                    HTTPS encryption
                         │
            ┌────────────▼────────────┐
            │ Load Balancer          │
            │ (Route traffic)        │
            └────────────┬────────────┘
                         │
       ┌─────────────────┼──────────────────┐
       │                 │                  │
       ▼                 ▼                  ▼
    ┌─────────┐    ┌──────────┐    ┌──────────┐
    │ Render  │    │ Render   │    │ Render   │
    │ Server  │    │ Server   │    │ Server   │
    │ (Node.js)    │ (Node.js)│    │ (Node.js)│
    │   +1    │    │   +2     │    │   +3     │
    └────┬────┘    └────┬─────┘    └────┬─────┘
         │             │               │
         └─────────────┼───────────────┘
                       │
            ┌──────────▼──────────┐
            │ Shared Services     │
            │                     │
            ├─ Cache (LRU)        │
            ├─ Logging (Winston)  │
            ├─ Error Tracking     │
            │  (Sentry)           │
            └──────────┬──────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌──────────┐  ┌────────────┐  ┌──────────┐
    │ MongoDB  │  │ External   │  │ Job      │
    │ Atlas    │  │ APIs       │  │ Queue    │
    │Database  │  │            │  │          │
    │          │  ├─ TMDB      │  │- Weekly  │
    │- Users   │  ├─ Groq      │  │  Digest  │
    │- Reviews │  ├─ Nodemailer
    │- Notifs  │  └─ Sentry    │  └──────────┘
    └──────────┘  └────────────┘

DATA FLOW:
1. User → Browser
2. Browser → CDN (static files)
3. Browser → API → Load Balancer
4. Load Balancer → Server 1/2/3
5. Server → Cache (LRU)
6. Server → Database
7. Server → External APIs
8. Response → Browser
9. Display → User

SCALABILITY:
Add more servers: Just increase replicas
Load balancer: Distributes automatically
Database: MongoDB handles growth
Cache: LRU adjusts automatically

MONITORING:
- Sentry: Errors
- Winston: Logs
- Render: Metrics
- Vercel: Analytics

This architecture supports:
✓ Millions of users
✓ Thousands of concurrent connections
✓ Global distribution
✓ High availability
✓ Easy maintenance
```

---

## CONCLUSION 🎉

**CineWorld System Design** demonstrates:

1. **Scalable Architecture** - Can handle growth
2. **Reliable System** - High availability
3. **Secure Implementation** - Multi-layer protection
4. **Optimal Performance** - Fast responses
5. **Good Maintainability** - Easy to understand and modify
6. **Cost-Effective** - Affordable infrastructure
7. **Modern Tech Stack** - Current best practices
8. **Production-Ready** - Deployed and live

**Key Principles Applied:**
- Separation of concerns (Frontend/Backend/Database)
- DRY (Don't Repeat Yourself)
- SOLID principles
- RESTful API design
- Security first
- Performance optimization
- Monitoring & observability

**Ab tum design samajh gaye! 🚀**

---

**Happy coding! 💻✨**
