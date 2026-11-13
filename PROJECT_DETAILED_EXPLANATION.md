# 🎬 CineWorld - Complete Project Explanation (Hindi + English)

---

## 📌 Table of Contents (Quick Links)
1. [Project Kya Hai?](#1-project-kya-hai)
2. [Real-World Problem Kya Solve Karta Hai?](#2-real-world-problem)
3. [Architecture - Pura System Kaise Bana Hai](#3-architecture)
4. [Tech Stack - Kaunsa Technology Kya Kaam Karta Hai](#4-tech-stack)
5. [Database Design - Data Kaise Store Hota Hai](#5-database-design)
6. [Frontend Explained - User Interface](#6-frontend-explained)
7. [Backend Explained - Server Side Logic](#7-backend-explained)
8. [AI Features - Groq Integration](#8-ai-features)
9. [Authentication & Security](#9-authentication-security)
10. [Deployment - Live Server Par Kaise Deploy Hota Hai](#10-deployment)
11. [Step-by-Step Feature Walkthrough](#11-feature-walkthrough)

---

# 1. Project Kya Hai? 🎯

## Simple Explanation (Ek Aadhmi Bhi Samajh Jaye)

**CineWorld** ek **movie discovery web application** hai jaise Netflix, IMDb, ya Google. 

**Kya Kaam Karta Hai:**
- Movies browse kar sakte ho (new, trending, top-rated)
- Movies search kar sakte ho (by name, genre, actor)
- Reviews likha sakte ho aur padh sakte ho
- Apni watchlist maintain kar sakte ho (watch later list)
- Friends/users ko follow kar sakte ho
- **AI se suggestions ले सकते हो** - "Mujhe romantic movies pasand hain" → AI 10 suggestions deta hai

## Technical Definition

CineWorld ek **full-stack web application** hai jo:
- **Frontend:** Modern React interface (Vite + TailwindCSS)
- **Backend:** Express.js REST API server
- **Database:** MongoDB (NoSQL database)
- **AI Integration:** Groq LLM for intelligent recommendations
- **Real-time:** Server-Sent Events for notifications

---

# 2. Real-World Problem Solve Karta Hai 🤔

## Problem 1: Movie Discovery Mein Time Waste
**Problam:** Netflix/IMDb par movies dhundna padta hai. Category select karo, sort karo, phir bhi acha movie nahi milta.

**CineWorld Ka Solution:**
```
User: "Mujhe thriller movie chahiye jo 2020 se baad ho"
CineWorld: "Iska matlab ye 10 movies perfect hain..."
```

## Problem 2: Personal Recommendations Nahi Milte
**Problam:** Standard sorting se movie suggestions generic hote hain.

**CineWorld Ka Solution:**
- Tera watchlist dekh ta hai
- Tera taste samajhta hai
- Personalized recommendations deta hai

## Problem 3: Movie Ke Baare Mein Quick Insights
**Problam:** IMDb par review padna boring hota hai.

**CineWorld Ka Solution:**
```
AI Movie Chat: "Is movie mein action kitna hai? Ending konsa hai?"
AI Instant Response: "Movie mein 40% action hai, ending shocking hai"
```

---

# 3. Architecture - Pura System Kaise Bana Hai 🏗️

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER (Browser)                         │
│                    https://cineworld-app.com                    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  FRONTEND (React+Vite)  │
                    │ ┌─────────────────────┐ │
                    │ │ Pages & Components  │ │
                    │ │ State Management    │ │
                    │ │ TailwindCSS Styles  │ │
                    │ └─────────────────────┘ │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   INTERNET (HTTP/REST)  │
                    └────────────┬────────────┘
                                 │
      ┌──────────────────────────┼──────────────────────────┐
      │                          │                          │
┌─────▼─────────┐      ┌─────────▼──────────┐      ┌──────▼──────────┐
│ BACKEND API   │      │   TMDB API         │      │  GROQ AI LLM    │
│ (Express.js)  │      │  (Movie Database)  │      │  (Llama Models) │
│ Port: 8000    │      │                    │      │                 │
│ ┌──────────┐  │      │ - Movie data       │      │ - NLP           │
│ │ Routes   │  │      │ - Cast & Crew      │      │ - Recommendations
│ │ Models   │  │      │ - Trailers         │      │ - Chat          │
│ │ Services │  │      │ - Watch providers  │      │ - Analysis      │
│ │ Middleware
│ │ Jobs     │  │      │                    │      │                 │
│ └──────────┘  │      └────────────────────┘      └─────────────────┘
└─────┬─────────┘
      │
┌─────▼──────────────────────────────────┐
│  DATABASE (MongoDB Atlas)              │
│  ┌──────────────────────────────────┐  │
│  │ Collections:                     │  │
│  │ - Users (with passwords)         │  │
│  │ - Reviews (ratings & comments)   │  │
│  │ - Notifications (real-time)      │  │
│  │ - Movies Cache (for speed)       │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

## Data Flow Example: User Log In Karte Time

```
1. User clicks "Login" button
   ↓
2. Frontend sends username + password (HTTPS encrypted)
   ↓
3. Backend receives request
   - Validate email format (Zod validation)
   - Password ko database mein store password ke saath hash karke compare
   - Password match? → Generate JWT token
   ↓
4. Backend returns: {accessToken, refreshToken}
   - accessToken = 15 minute validity
   - refreshToken = 7 day validity (secure cookie)
   ↓
5. Frontend stores accessToken in localStorage
   ↓
6. Ab har request mein yeh token bhejta hai (Authorization: Bearer token)
```

---

# 4. Tech Stack - Kaunsa Technology Kya Kaam Karta Hai 💻

## Frontend Stack (User Ke Browser Mein Chalta Hai)

### React 18
```
Kya Hai: JavaScript library jo interactive UIs banati hai
Kya Kaam Karti Hai:
- Components banate ho (reusable UI pieces)
- State manage karte ho (data ko remember rakho)
- Component update hote hain jab data change hota hai

Example:
const MovieCard = ({ movie }) => {
  return (
    <div className="card">
      <h2>{movie.title}</h2>
      <p>{movie.year}</p>
    </div>
  )
}

Ye component ek movie card display karta hai
```

### Vite
```
Kya Hai: Build tool (project ko compress karke fast banata hai)
Kya Kaam Karti Hai:
- JavaScript, CSS ko bundle karta hai
- Development mein fast refresh deta hai
- Production mein optimized files banate hain

Analogy: Jaise Word document ko PDF mein convert karna
```

### TailwindCSS
```
Kya Hai: Utility-first CSS framework
Kya Kaam Karti Hai:
- UI ko beautiful banane ke liye pre-made classes provide karta hai
- Manually CSS likhne ki need nahi

Example:
<button className="bg-red-600 text-white px-4 py-2 rounded">
  Click Me
</button>

ye ek red button create karta hai
```

### TanStack Query (React Query)
```
Kya Hai: Data fetching library
Kya Kaam Karti Hai:
- Server se data fetch karta hai
- Data ko cache karta hai (again fetch nahi karna padta)
- Loading, error, success states handle karta hai
- Real-time sync maintain karta hai

Example:
const { data, isLoading } = useQuery(['movies'], () => 
  fetch('/api/movies').then(r => r.json())
)

isse movies automatically load hote hain
```

### TypeScript
```
Kya Hai: JavaScript का advanced version
Kya Kaam Karti Hai:
- Code ko strict banata hai (typos catch karta hai)
- IDE ko smart suggestions deta hai
- Development mein bugs catch hote hain

Example:
function greet(name: string): string {
  return "Hello " + name
}

greet(123) → ERROR! name should be string, not number
```

---

## Backend Stack (Server Par Chalta Hai)

### Node.js
```
Kya Hai: JavaScript runtime (JavaScript ko server par run karta hai)
Kya Kaam Karti Hai:
- Server-side code chalata hai
- API requests handle karta hai
- Database se communicate karta hai

Analogy: Jaise Python ke liye Python interpreter, 
waisi tarah JavaScript ke liye Node.js
```

### Express.js
```
Kya Hai: Web framework (server banane ke liye toolkit)
Kya Kaam Karti Hai:
- Routes define karte ho (URLs)
- Request-response handle karte ho
- Middleware lagates ho (security, logging, etc.)

Example:
app.get('/api/movies', (req, res) => {
  // movies fetch karo
  res.json({ movies: [...] })
})

jab user /api/movies URL hit kare, yeh code chalega
```

### MongoDB
```
Kya Hai: NoSQL Database (traditional database nahi)
Kya Kaam Karti Hai:
- Data ko JSON format mein store karta hai (Excel spreadsheet jaisa nahi)
- Flexible schema (columns fixed nahi hote)
- Fast queries

Example:
Traditional SQL:
Users Table
| id | name      | email         |
|----|-----------|---------------|
| 1  | Raj       | raj@mail.com  |

MongoDB (JSON style):
{
  _id: 1,
  name: "Raj",
  email: "raj@mail.com"
}

Dono same data represent karte hain, different format mein
```

### Mongoose
```
Kya Hai: MongoDB ke liye library (aasan banati hai)
Kya Kaam Karti Hai:
- Schema define karte ho (data structure)
- Validation add karte ho
- MongoDB queries को safe banata hai

Example:
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true }
})

isse sirf proper data database mein jata hai
```

### JWT (JSON Web Tokens)
```
Kya Hai: Token-based authentication
Kya Kaam Karti Hai:
- User ko token generate karta hai
- Token ko verify karta hai
- Session management (user logged in status)

Flow:
1. User login → Server: "OK, here's your token"
2. User har request mein token bhejta hai
3. Server token verify karta hai
4. Request allowed/denied

Token mein data encrypted hota hai:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP6VRo-cw

Ye 3 parts mein hota hai (dots se separate)
```

---

## Specialized Services

### Groq AI SDK
```
Kya Hai: AI/Machine Learning library (Groq company ka)
Kya Kaam Karti Hai:
- LLM (Large Language Model) se interact karta hai
- Natural language processing
- Movie recommendations, chat, analysis

Example:
User: "Mujhe scary movies chahiye"
Groq: "Main movie search filter apply karunga:
       - genre: Horror
       - year: > 1990
       - rating: > 7"

Groq automatically user ke input ko samajhta hai aur action leta hai
```

### TMDB API (The Movie Database)
```
Kya Hai: External API jo movie data provide karta hai
Kya Kaam Karti Hai:
- Movie details (poster, cast, release date)
- Trending movies
- Search functionality
- Trailers, ratings

CineWorld TMDB data use karta hai, khud database maintain nahi karti
```

### Nodemailer
```
Kya Hai: Email sending library
Kya Kaam Karti Hai:
- Email verification links bhejta hai
- Password reset emails
- Weekly movie digest
- Notifications

Example:
await sendEmail(
  user.email, 
  "Verify Your Account", 
  "Click this link to verify: ..."
)
```

### Sentry
```
Kya Hai: Error tracking service
Kya Kaam Karti Hai:
- Production mein jab error aaye, note karta hai
- Stack trace capture karta hai
- Alert deta hai developers ko

Analogy: Jaise car mein alarm lagta hai jab kuch galat ho,
waisi tarah Sentry error alarm deta hai
```

---

# 5. Database Design - Data Kaise Store Hota Hai 📊

## MongoDB Collections Structure

### User Collection

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Raj Kumar",
  email: "raj@mail.com",
  password: "$2b$10$encrypted_password_here...",  // bcrypt से encrypted
  
  // Movies user ne save ki hain (My List)
  savedMovies: [
    {
      id: 550,
      title: "Fight Club",
      poster_path: "/image.jpg",
      vote_average: 8.8
    }
  ],
  
  // Watchlist with status tracking
  watchlist: [
    {
      id: 550,
      title: "Fight Club",
      status: "watched",  // watched/watching/want_to_watch
      vote_average: 8.8
    },
    {
      id: 19404,
      title: "Dilwale Dulhania Le Jayenge",
      status: "want_to_watch",
      vote_average: 7.8
    }
  ],
  
  // AI features ke liye
  aiFeedback: [
    { movieId: 550, liked: true, createdAt: "2026-09-19" },
    { movieId: 109, liked: false, createdAt: "2026-09-18" }
  ],
  
  // User ke taste profile (AI analysis)
  tasteVector: {
    "28": 0.8,    // Action = high preference
    "18": 0.6,    // Drama = medium preference
    "35": 0.2     // Comedy = low preference
  },
  
  // Social features
  following: [
    ObjectId("507f1f77bcf86cd799439012"),
    ObjectId("507f1f77bcf86cd799439013")
  ],
  
  // Email & verification
  emailVerified: true,
  emailVerifyToken: null,
  
  // Account security
  loginAttempts: 0,
  lockUntil: null,  // Account locked until this time
  
  // Digest preferences
  digestOptOut: false,
  isProfilePublic: true,
  
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-09-19T10:30:00Z"
}
```

**Kya Samajhna Zaroori Hai:**
- `password` को plaintext mein store nahi karte, encrypted (bcrypt) hota hai
- `watchlist` mein movies ka status hai (kaunsi movie dekhli, kaunsi pending)
- `tasteVector` se AI user ke preferences samajhta hai
- `loginAttempts` se account security maintain hoti hai

### Review Collection

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  movieId: "550",           // Fight Club ke reviews
  movieTitle: "Fight Club",
  user: ObjectId("507f1f77bcf86cd799439011"),  // Kaise likha (Raj ne)
  author: "Raj Kumar",
  
  content: "Excellent movie! Mind-bending plot, great cinematography...",
  rating: 5,  // 1-5 stars
  
  createdAt: "2026-09-15T14:30:00Z",
  updatedAt: "2026-09-15T14:30:00Z"
}
```

**Index:**
```
Unique index: (movieId, user)
Meaning: Ek user sirf ek movie pe ek review likha sakta hai
```

### Notification Collection

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439015"),
  user: ObjectId("507f1f77bcf86cd799439011"),  // Notification kisko mila
  icon: "👤",  // Emoji
  text: "Raj Kumar started following you",
  link: "/users/raj-kumar",  // Click karne se yaha jayega
  read: false,  // Padha gaya ya nahi
  
  createdAt: "2026-09-19T10:30:00Z"
}
```

---

## Database Relationships Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USERS Collection                      │
│ (name, email, password, watchlist, etc.)               │
└─────────────────────────────────────────────────────────┘
           ↑                          ↑
           │ (one-to-many)          │ (one-to-many)
           │                        │
    ┌──────────────┐        ┌───────────────────┐
    │ Reviews      │        │ Notifications     │
    │ Collection   │        │ Collection        │
    │              │        │                   │
    │ - movieId    │        │ - user (ref)      │
    │ - user (ref) │        │ - text            │
    │ - rating     │        │ - read status     │
    │ - content    │        │                   │
    └──────────────┘        └───────────────────┘
```

---

# 6. Frontend Explained - User Interface 🎨

## Project Structure

```
client/
├── src/
│   ├── main.jsx                 ← Entry point (app start hota hai)
│   ├── App.jsx                  ← Main routing component
│   │
│   ├── pages/                   ← Different pages/screens
│   │   ├── Home.jsx             (Homepage - trending movies)
│   │   ├── Login.jsx            (Login page)
│   │   ├── Signup.jsx           (Registration)
│   │   ├── MovieDetail.jsx      (Ek movie ke details)
│   │   ├── Watchlist.jsx        (Saved movies)
│   │   ├── Search.jsx           (Search functionality)
│   │   ├── AIMood.jsx           (AI recommendations)
│   │   └── ... more pages
│   │
│   ├── components/              ← Reusable UI components
│   │   ├── Navbar.jsx           (Top navigation)
│   │   ├── MovieCard.jsx        (Movie ki small card)
│   │   ├── AIChatWidget.jsx     (AI chat interface)
│   │   ├── ReviewForm.jsx       (Review likhne ke liye form)
│   │   └── ... more components
│   │
│   ├── context/                 ← Global state management
│   │   ├── AuthContext.jsx      (User login/logout state)
│   │   └── ThemeContext.jsx     (Dark/Light mode)
│   │
│   ├── hooks/                   ← Reusable logic
│   │   ├── useDebounce.ts       (Optimize search queries)
│   │   └── useRecentlyViewed.ts (Track viewed movies)
│   │
│   ├── lib/                     ← Utility functions
│   │   ├── api.ts               (Server se communicate karne ke liye)
│   │   └── tmdb.ts              (TMDB API wrapper)
│   │
│   └── types.ts                 ← TypeScript type definitions
│
└── vite.config.js               ← Vite configuration
```

## Frontend Flow: User Home Page Load Karte Time

```
1. User opens https://cineworld-app.com
   ↓
2. main.jsx execute hota hai
   - React app start hota hai
   - AuthContext initialize hota hai (user check karta hai)
   - ThemeContext initialize hota hai (dark/light mode)
   ↓
3. App.jsx load hota hai
   - <Route path="/" element={<Home />} /> match hota hai
   ↓
4. Home.jsx component render hota hai
   ↓
5. useQuery hook call hota hai
   - TanStack Query: "Mujhe trending movies chahiye"
   ↓
6. Frontend → Backend: GET /api/movies/home
   ↓
7. Backend TMDB se data fetch karta hai
   - Response: 
     {
       trending: [...20 movies],
       popular: [...20 movies],
       topRated: [...20 movies]
     }
   ↓
8. Frontend data receive karta hai
   - TanStack Query cache mein data store karta hai
   ↓
9. Components render hote hain
   - Navbar render
   - Movie rows render
   - Each movie ke liye MovieCard component
   ↓
10. User ko beautiful home page dikh jata hai ✨
```

## Key Frontend Components Explained

### 1. AuthContext - Login/Logout Management

```javascript
// AuthContext jo store karta hai:
{
  user: { name, email, avatar },
  token: "jwt_token_here...",
  authLoading: false,
  
  // Functions:
  loginUser: (userData) => {},    // Login hote time
  logoutUser: () => {},            // Logout hote time
}

// Usage in any component:
const { user, token, loginUser } = useContext(AuthContext)

// Token hamesha auto-refresh hota hai (13 minutes mein)
```

### 2. Protected Routes - Login Required Pages

```javascript
// Watchlist page sirf logged-in users dekh sakte hain
<Route path="/watchlist" element={
  <ProtectedRoute>
    <Watchlist />
  </ProtectedRoute>
} />

// ProtectedRoute component check karta hai:
if (!user || !token) {
  redirect('/login')  // Login page pe jaao
} else {
  show(<Watchlist />)  // Watchlist dikhao
}
```

### 3. TanStack Query - Data Fetching

```javascript
// Home.jsx mein
const { data: movies, isLoading, error } = useQuery({
  queryKey: ['home-movies'],  // Cache key
  queryFn: () => fetch('/api/movies/home').then(r => r.json()),
  staleTime: 5 * 60 * 1000,    // 5 minutes valid rahegा
})

// Usage:
{isLoading && <Skeleton />}
{error && <ErrorMessage />}
{data && <MovieList movies={data} />}
```

### 4. Lazy Loading - Fast Page Load

```javascript
// Pages ko chunks mein split karte hain
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Watchlist = lazy(() => import('./pages/Watchlist'))

// Fayda: 
// - Initial load fast hota hai
// - Sirf jab user page visit kare, tab load hota hai
```

---

# 7. Backend Explained - Server Side Logic ⚙️

## Server Startup Flow

```
1. server/index.js execute hota hai
   ↓
2. Environment variables load (PORT, MONGO_URI, JWT_SECRET, etc.)
   ↓
3. MongoDB connection establish
   - MongoDB Atlas se connect
   - Connection pool set up (5-50 connections)
   ↓
4. Express app initialize
   - Middleware setup (security, logging, compression)
   - Routes register
   - Error handlers setup
   ↓
5. Sentry initialize (error tracking)
   ↓
6. Server listen on port 8000
   ↓
7. Weekly jobs start (node-cron)
   - Every Monday morning: AI digest emails bhejo
   ↓
8. Server ready: "Listening on port 8000"
```

## Main Routes Structure

```
┌─────────────────────────────────────────────────┐
│          Express Server (Port 8000)             │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────────┬─────────────────┬──────────────┐
        │            │                │                 │              │
    ┌───▼────┐  ┌───▼─────┐    ┌────▼──────┐   ┌──────▼──┐   ┌──────▼─────┐
    │ Auth   │  │ Movies  │    │ Users     │   │ Reviews │   │ AI Routes  │
    │ Routes │  │ Routes  │    │ Routes    │   │ Routes  │   │ Routes     │
    │        │  │         │    │           │   │         │   │            │
    │/login  │  │/home    │    │/watchlist │   │/create  │   │/mood       │
    │/signup │  │/search  │    │/profile   │   │/rate    │   │/chat       │
    │/logout │  │/:id     │    │/follow    │   │/list    │   │/recommend  │
    │/refresh│  │/discover│    │/unfollow  │   │/update  │   │/similar    │
    └────────┘  └─────────┘    └───────────┘   └─────────┘   └────────────┘
```

## Database Layer (Models)

```
┌──────────────────────────────────────────────────┐
│      Mongoose Models (Database Schemas)          │
└────────────────┬─────────────────────────────────┘
                 │
    ┌────────────┼────────────┬───────────────┐
    │            │            │               │
┌───▼──┐     ┌───▼───┐    ┌──▼────┐      ┌──▼────┐
│User  │     │Review │    │Notif  │      │Movie  │
│Model │     │Model  │    │Model  │      │Model  │
│      │     │       │    │       │      │       │
│Kya   │     │movieId│    │user   │      │For    │
│store:│     │user   │    │icon   │      │cache  │
│name  │     │rating │    │text   │      │       │
│email │     │content│    │link   │      │movie  │
│pass  │     │       │    │read   │      │data   │
│watch │     │       │    │       │      │       │
│list  │     │       │    │       │      │       │
└──────┘     └───────┘    └───────┘      └───────┘
```

## Authentication Flow - Detailed

```
┌────────────────────────────────────────────────────────────────┐
│                    LOGIN PROCESS (Step-by-step)                │
└────────────────────────────────────────────────────────────────┘

USER SIDE:
┌─────────────┐
│ User enters │
│ email: raj@mail.com
│ password: MyPassword123
└────────┬────┘
         │
         ▼
    ┌─────────────────────────────┐
    │ Frontend encrypts with HTTPS│
    │ (data locked in transit)    │
    └────────┬────────────────────┘
             │
             ▼
    POST /api/auth/login
    Body: {
      email: "raj@mail.com",
      password: "MyPassword123"
    }

SERVER SIDE:
┌─────────────────────┐
│ Request arrive karta│
└────────┬────────────┘
         │
         ▼
    ┌──────────────────────────────┐
    │ Zod Validation               │
    │ - Email format check        │
    │ - Password length check     │
    │ Invalid? → 400 Bad Request  │
    └────────┬─────────────────────┘
             │
             ▼
    ┌──────────────────────────────┐
    │ Database mein email se user  │
    │ find karo                    │
    │ Not found? → 401 Unauthorized│
    └────────┬─────────────────────┘
             │
             ▼
    ┌──────────────────────────────┐
    │ Password verify (bcrypt)     │
    │ User ka plaintext password   │
    │ Database ke encrypted pass   │
    │ से match?                     │
    │ No match? → 401              │
    └────────┬─────────────────────┘
             │
             ▼
    ┌──────────────────────────────┐
    │ LOGIN SUCCESSFUL!            │
    │                              │
    │ 1. Generate JWT tokens:      │
    │    accessToken = 15 min      │
    │    refreshToken = 7 days     │
    │                              │
    │ 2. Update user's refreshToken│
    │    in database               │
    │                              │
    │ 3. Set httpOnly cookie       │
    │    (XSS-proof)               │
    └────────┬─────────────────────┘
             │
             ▼
    Response: {
      success: true,
      token: "eyJhbGc...",
      user: { id, name, email }
    }
    Cookies: refreshToken=...

FRONTEND STORES:
- localStorage.token = accessToken
- httpOnly cookie = refreshToken (automatic)

NEXT REQUESTS:
Authorization: Bearer eyJhbGc...

VERIFICATION:
- Express authMiddleware check karta hai
- Token valid? → allow
- Expired? → Auto-refresh
- Invalid? → 401 logout
```

## API Route Example: Get Trending Movies

```javascript
// server/routes/movieRoutes.js
router.get('/home', async (req, res) => {
  try {
    // 1. Cache check karo
    if (cache.has('movies:home')) {
      return res.json(cache.get('movies:home'))
    }
    
    // 2. TMDB API se fetch karo
    const tmdbData = await tmdbService.getHomeMovies()
    
    // 3. Cache mein save karo (10 minutes)
    cache.set('movies:home', tmdbData, 10 * 60 * 1000)
    
    // 4. Response bhejo
    res.json(tmdbData)
  } catch (err) {
    // 5. Error handling
    errorHandler(err, res)
  }
})

// FLOW:
// Request → Cache check → TMDB fetch → Cache save → Response
// Next request: Cache hit → Instant response ⚡
```

## Rate Limiting - DoS Protection

```
Server-side traffic control:

┌──────────────────────────────────────────┐
│ User sends 600 requests in 15 minutes    │
└──────────────────────────┬───────────────┘
                           │
                    ┌──────▼──────┐
                    │ Rate Limiter│
                    │ Check limit │
                    └──────┬──────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
   ┌────▼────┐                          ┌────▼─────┐
   │ OK Pass │                          │ REJECT   │
   │ (< 600) │                          │ (> 600)  │
   │ Allow   │                          │ 429 error│
   │ request │                          │ Too many │
   └─────────┘                          └──────────┘

Different rates for different routes:
- General API: 600 req/15min
- Auth (login): 20 req/15min
- AI: 60 req/min
```

## Middleware Chain - Request Processing

```
Incoming Request
        ↓
┌───────────────────────────────────────┐
│ 1. CORS Middleware                    │
│    - Check origin (frontend allowed?)│
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 2. Helmet Middleware                  │
│    - Security headers add karo        │
│    - X-Frame-Options, CSP, etc.      │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 3. Morgan Logger                      │
│    - Request log karo (tracking)     │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 4. Rate Limiter                       │
│    - Check request limit              │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 5. Auth Middleware (if protected)    │
│    - JWT token verify karo            │
│    - User details attach karo         │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 6. Validation Middleware              │
│    - Input validate (Zod)             │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 7. Route Handler                      │
│    - Business logic chalega            │
└───────────────────────────────────────┘
        ↓
Response ← (Reverse order mein return)
```

---

# 8. AI Features - Groq Integration 🤖

## Kya Hai Groq?

Groq ek AI company hai jo **free LLM (Large Language Models)** provide karta hai. 

```
LLM = बहुत बड़ा AI model जो:
- Text को समझ सकता है
- Text generate कर सकता है
- Questions का जवाब दे सकता है
- Predictions कर सकता है

Groq का फायदा:
- OpenAI से 2x तेज़
- Free tier sufficient है
- Open-source Llama models
```

## AI Features Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (User)                       │
│                                                             │
│  "Mujhe thriller movies chahiye 2020 ke baad"              │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
                      ┌─────────────────────┐
                      │ POST /api/ai/search │
                      └─────────────┬───────┘
                                    │
                    ┌───────────────▼──────────────┐
                    │ Backend: AI Service          │
                    │                              │
                    │ 1. User input receive       │
                    │ 2. Groq API call            │
                    └─────────────┬────────────────┘
                                  │
            ┌─────────────────────▼──────────────────────┐
            │ Groq LLM Process:                          │
            │                                            │
            │ Input: "thriller movies 2020 ke baad"      │
            │                                            │
            │ AI सोचता है:                              │
            │ - Genre: Thriller (ID: 53)                │
            │ - Year: >= 2020                           │
            │ - Sort: Popularity                        │
            │                                            │
            │ Output JSON:                              │
            │ {                                         │
            │   "genre_ids": [53],                     │
            │   "primary_release_year.gte": 2020,      │
            │   "sort_by": "popularity.desc"           │
            │ }                                         │
            └─────────────┬──────────────────────────────┘
                          │
            ┌─────────────▼──────────────────────┐
            │ TMDB API को parameters भेजो       │
            │ /discover/movie?genre_ids=53...  │
            └─────────────┬──────────────────────┘
                          │
            ┌─────────────▼──────────────────────┐
            │ TMDB का response:                 │
            │ [                                 │
            │   { title: "Saw", year: 2004 },  │
            │   { title: "The Ring", year: 2002}
            │   ...                             │
            │ ]                                 │
            └─────────────┬──────────────────────┘
                          │
                          ▼
            Frontend को भेजो (Frontend)
```

## AI Functions Explained

### 1. Natural Language Search

```javascript
// User: "Mujhe romantic movies 2020 ke baad chahiye"

async function parseSearchQuery(query) {
  // Groq को भेजो:
  "Convert 'romantic movies 2020 ke baad' into TMDB parameters.
   Return JSON: { genre_ids, primary_release_year, ... }"
  
  // Groq का response:
  {
    genre_ids: [10749],           // Romance
    primary_release_year: { gte: 2020 }
  }
  
  // TMDB API call
  results = await tmdb.discover({
    genre_ids: [10749],
    primary_release_year: { gte: 2020 }
  })
  
  return results  // 20+ romantic movies
}
```

### 2. Mood-Based Recommendations

```javascript
// User mood: "Meri party hai aaj raat, kush movies chahiye"

async function getMoodRecommendations(mood, count = 10) {
  // Groq से सवाल:
  "User के mood के लिए 10 movies suggest करो:
   User mood: Party/Fun/Celebration
   Return: [{ movieId, title, reason }, ...]"
  
  // Groq सोचता है:
  // Party mood → Comedy/Uplifting/Fun movies
  // Recommendations:
  [
    { 
      movieId: 278,
      title: "The Shawshank Redemption",
      reason: "Feel-good ending, inspiring story"
    },
    {
      movieId: 550,
      title: "Fight Club",
      reason: "Thrilling, exciting action"
    },
    // ... 8 more
  ]
  
  return recommendations
}
```

### 3. Movie Chat with RAG (Context-Aware)

```javascript
// User: "Is movie mein romance kitna hai?"
// Movie: Fight Club

async function streamMovieChat(movieId, userQuestion) {
  // Step 1: Movie ki details fetch karo
  const movie = await getMovieDetails(movieId)
  
  // Step 2: Community reviews fetch karo (RAG - Retrieval Augmented Generation)
  const reviews = await Review.find({ movieId }).limit(5)
  
  // Step 3: Groq को context दो
  const context = `
    Movie: ${movie.title}
    Plot: ${movie.overview}
    Community Reviews:
    ${reviews.map(r => r.content).join('\n')}
  `
  
  // Step 4: Streaming response
  const stream = await groq.stream(
    "Question: " + userQuestion +
    "Context: " + context
  )
  
  // Step 5: Frontend को real-time stream करो (SSE)
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`)
  }
}

// Response (streaming):
"Is movie mein romance bilkul nahi hai. यह एक action/psychology thriller है।
Community reviews के according भी यही कहा गया है - 'Pure action, no romance'"
```

### 4. Personalized Recommendations (Collaborative Filtering)

```javascript
// User ke watchlist analyze करो

async function getPersonalizedRecs(userId) {
  // Step 1: User ka watchlist get करो
  const userMovies = await User.findById(userId).select('watchlist')
  
  // Step 2: User के preference analyze करो
  const tasteProfile = analyzeTaste(userMovies)
  
  // Step 3: Similar taste वाले दूसरे users ढूंढो
  const similarUsers = await findSimilarUsers(tasteProfile)
  
  // Step 4: उन users ने कौनसी movies देखी हैं?
  const theirMovies = await getMoviesWatchedBy(similarUsers)
  
  // Step 5: Current user ने कौन सी नहीं देखी?
  const unseen = theirMovies.filter(m => 
    !userMovies.includes(m.id)
  )
  
  // Step 6: Top 10 recommendations
  return unseen.slice(0, 10)
}

// Logic:
// अगर Raj की मूवी टेस्ट Priya के जैसी है,
// और Priya ने एक नई thriller देखी है,
// तो Raj को वह thriller suggest करो
```

### 5. Vector Similarity - ML Based

```javascript
// Vectors = Numerical representation

// Movie को 3 dimensions में represent करो:
Movie A = [0.8, 0.2, 0.6]  // [Action, Comedy, Drama]
Movie B = [0.85, 0.1, 0.7] // Similar movie

// Distance = Cosine Similarity = 0.98 (very similar)
// इसलिए Movie B को recommend करो

async function vectorSimilarity(movieId) {
  const movie = await getMovie(movieId)
  
  // Create vector (genre, year, rating based)
  const vector = createVector(movie)
  
  // सभी movies के साथ compare करो
  const allMovies = await getAllMovies()
  
  const similarities = allMovies.map(m => ({
    movie: m,
    similarity: cosineSimilarity(vector, createVector(m))
  }))
  
  // Top 10 similar movies
  return similarities.sort().slice(0, 10)
}
```

### 6. Weekly AI Digest (Scheduled Job)

```javascript
// हर सोमवार सुबह 8 AM को:

async function sendWeeklyDigest() {
  // सभी users के लिए loop
  for (const user of users) {
    // उनकी watchlist से 5 personalized picks suggest करो
    const picks = await getPersonalizedRecs(user._id)
    
    // Email बनाओ
    const emailBody = `
      Dear ${user.name},
      
      यहाँ ये सप्ताह की आपकी top 5 movies हैं:
      
      ${picks.map(m => `
        1. ${m.title} (${m.year})
           ${m.reason}
      `).join('\n')}
      
      Happy watching!
      - CineWorld AI
    `
    
    // Email भेजो
    await sendEmail(user.email, emailBody)
  }
}

// Scheduled with node-cron:
cron.schedule('0 8 * * 1', sendWeeklyDigest)  // Every Monday 8 AM
```

---

# 9. Authentication & Security 🔒

## Password Security

```
┌──────────────────────────────────────────────────────┐
│             Password को कैसे store करते हैं          │
└──────────────────────────────────────────────────────┘

User: "MyPassword123"
         ↓
    ┌────────────────────────┐
    │ Bcrypt Hashing         │
    │ - Rounds: 10           │
    │ - Salt: random         │
    └────────────┬───────────┘
                 ↓
Database: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b...lbxnhZ"

अगली बार Login:
User input: "MyPassword123"
        ↓
bcrypt.compare(input, hashedPassword)
        ↓
Match? Yes → Login successful
Match? No → Login failed

फायदा:
- Even database breach में password safe रहता है
- Hash को reverse नहीं कर सकते (one-way)
```

## JWT Token Rotation

```
Initial Login:
┌────────────────────────────────────────────────┐
│                 User Login                     │
│            username + password                 │
└─────────────────┬──────────────────────────────┘
                  │
        ┌─────────▼──────────┐
        │ Verify password    │
        │ bcrypt comparison  │
        └─────────┬──────────┘
                  │
      ┌───────────▼──────────────┐
      │ Generate Tokens          │
      │                          │
      │ accessToken (15 min):    │
      │ eyJhbGciOiJIUzI1NiIs... │
      │                          │
      │ refreshToken (7 days):   │
      │ eyJhbGciOiJIUzI1NiIs... │
      └───────────┬──────────────┘
                  │
      ┌───────────▼──────────────┐
      │ refreshToken to DB save │
      │ (httpOnly cookie)       │
      └───────────┬──────────────┘
                  │
        Frontend stores:
        - localStorage.token = accessToken
        - Cookie = refreshToken (automatic)


Token का Use करते वक़्त:
┌──────────────────────────────────────────┐
│ All API Requests में:                   │
│ Authorization: Bearer <accessToken>     │
└──────────────────┬───────────────────────┘
                   │
        ┌──────────▼──────────┐
        │ Server verify token │
        │ - Signature check   │
        │ - Expiry check      │
        │ - Tamper check      │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │ Token expire?       │
        │ (15 min over)       │
        └──────────┬──────────┘
                   │
     ┌─────────────┴─────────────┐
     │                           │
  No, valid                   Yes, expired
     │                           │
     │                   ┌───────▼────────┐
     │                   │ Auto Refresh   │
     │                   │                │
     │                   │ Old token +    │
     │                   │ refreshToken   │
     │                   │ → New token    │
     │                   │                │
     │                   │ DB check:      │
     │                   │ refreshToken   │
     │                   │ match करो     │
     │                   └───────┬────────┘
     │                           │
  Allow              ┌───────────▼──────────┐
Request      Generate new accessToken
             (old को invalidate karo)
             
             New token भेजो
             
             Request retry करो
             
             Success ✓
```

## Account Lockout (Brute Force Protection)

```
Failed Login Attempts:
Attempt 1 → Login Failed
Attempt 2 → Login Failed
Attempt 3 → Login Failed
Attempt 4 → Login Failed
Attempt 5 → ACCOUNT LOCKED!

Database update:
{
  loginAttempts: 5,
  lockUntil: "2026-09-19T14:45:00Z"  // 15 minutes
}

अगले 15 मिनट में अगर कोई attempt करे:
┌─────────────────────────────────┐
│ Account check: locked?          │
│ Yes → 429 Too Many Attempts     │
└─────────────────────────────────┘

15 minutes बाद: lockUntil expire हो जाता है
अब फिर से login कर सकते हो
```

## CORS (Cross-Origin Security)

```
Frontend (Vercel): https://cineworld-kappa.vercel.app
Backend (Render):  https://cineworld-api.render.com

Request भेजते वक़्त:
┌─────────────────────────────────────────┐
│ Browser की तरफ से Origin header:       │
│ Origin: https://cineworld-kappa.vercel │
└─────────────────────┬───────────────────┘
                      │
          ┌───────────▼──────────┐
          │ Server CORS check    │
          │                      │
          │ Allowed origins:     │
          │ - cineworld.vercel   │
          │ - localhost:5173     │
          │ - *preview.vercel    │
          └───────────┬──────────┘
                      │
           ┌──────────▼──────────┐
           │ Origin in list?     │
           └──────────┬──────────┘
                      │
        ┌─────────────┴──────────┐
        │                        │
       Yes                       No
        │                        │
   Allow              ┌──────────▼────────┐
 Request         403 Forbidden
             (Origin not allowed)

Fayda: Random domain से request नहीं भेज सकते
```

---

# 10. Deployment - Live Server Par Kaise Deploy Hota Hai 🚀

## Three-Tier Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ TIER 1: Frontend - Vercel                                   │
│                                                              │
│ Live URL: https://cineworld-kappa.vercel.app               │
│                                                              │
│ Kya Karta Hai:                                              │
│ - React app को optimize करके serve करता है                │
│ - CDN से automatically users को nearest server से serve    │
│ - Zero-downtime deployments                                │
│ - Environment variables automatically inject               │
│                                                              │
│ Auto-Deploy on Git Push:                                   │
│ 1. Vercel को GitHub से notification                       │
│ 2. Project clone करो                                       │
│ 3. npm install                                              │
│ 4. npm run build                                            │
│ 5. Build output को CDN पर deploy करो                      │
│ 6. Done! New version live है                              │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼ (HTTPS)
         ┌───────────────────────────────┐
         │   Internet / CDN Network      │
         └───────────────┬───────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ TIER 2: Backend - Render                                   │
│                                                              │
│ Live URL: https://cineworld-api.render.com                │
│                                                              │
│ Kya Karta Hai:                                              │
│ - Node.js server चलाता है                                 │
│ - Express API serve करता है                               │
│ - Database connections manage करता है                     │
│ - Background jobs run करता है (weekly digest)             │
│                                                              │
│ Auto-Deploy:                                               │
│ 1. GitHub push होता है                                     │
│ 2. Render को webhook notification                          │
│ 3. Latest code clone करो                                  │
│ 4. npm install                                              │
│ 5. node server/index.js (start command)                    │
│ 6. Done! New API live है                                  │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼ (HTTPS)
         ┌───────────────────────────────┐
         │   Internet                    │
         └───────────────┬───────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ TIER 3: Database - MongoDB Atlas                            │
│                                                              │
│ Live URL: mongodb+srv://...mongodb.net/cineworld           │
│                                                              │
│ Kya Karta Hai:                                              │
│ - Managed MongoDB cloud database                           │
│ - Automatic backups                                         │
│ - Connection pooling (5-50 connections)                    │
│ - Free tier (512 MB storage)                               │
│ - Security rules (IP whitelist)                            │
│                                                              │
│ Data Persistence:                                           │
│ - All users, movies, reviews persistent                   │
│ - Survives server restarts                                │
│ - Built-in replication (data backup)                      │
└──────────────────────────────────────────────────────────────┘
```

## Deployment Flow Example: Code Change

```
Developer (तुम)
    ↓
Edit file (MovieCard.jsx को update करना)
    ↓
git add .
git commit -m "Improve movie card UI"
git push origin main
    ↓
GitHub
    ↓
┌───────────────┬─────────────────┐
│               │                 │
▼               ▼                 ▼
Vercel      Render          Sentry
│               │                 │
├─ Clone        ├─ Clone         └─ Get notification
│  repo         │  repo           (code analyzed)
│               │
├─ Build        ├─ Install deps
│  (npm run     │
│   build)      ├─ Start server
│               │  (npm start)
├─ Upload to    │
│  CDN          ├─ Health check
│               │
└─ Domain       └─ Ready
   live
   
User tries to access website:
Internet → CDN (Vercel) → Latest UI displayed ✓
API calls → Backend (Render) → New code running ✓

Total time: 2-5 minutes
Downtime: 0 seconds (zero-downtime deployment)
```

## Environment Variables - Configuration

```
Frontend (.env):
VITE_API_URL=https://cineworld-api.render.com/api

Backend (.env):
PORT=8000
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@...mongodb.net/cineworld
JWT_SECRET=your_super_secret_key_here_32_chars_min
TMDB_TOKEN=your_tmdb_api_token
GROQ_API_KEY=your_groq_api_key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SENTRY_DSN=https://key@sentry.io/project

कौन सी जानकारी expose नहीं करते:
❌ Passwords
❌ API Keys
❌ Database URLs
✓ Public URLs
✓ Ports
✓ Feature flags

GitHub पर store नहीं करते, Vercel/Render settings में store करते हैं
```

## Performance & Monitoring

```
Real-time Monitoring:
┌──────────────────────────────────────────────────┐
│               Sentry Dashboard                   │
│                                                  │
│ - Error tracking (production errors)            │
│ - Performance monitoring                        │
│ - Alert notifications                           │
│ - Stack traces                                  │
│                                                  │
│ Example Alert:                                  │
│ ❌ Database connection failed                   │
│ ❌ 50 errors in last 5 minutes                  │
│ ❌ API response time > 5s                       │
└──────────────────────────────────────────────────┘

Winston Logs (Backend logging):
```
[2026-09-19T14:30:45Z] INFO: User signup: raj@mail.com
[2026-09-19T14:31:22Z] INFO: TMDB API call: /discover/movie
[2026-09-19T14:32:15Z] ERROR: Database timeout: ECONNREFUSED
```

---

# 11. Feature Walkthrough - Step By Step 🚶

## Feature 1: User Registration (Signup)

```
┌─────────────────────────────────────────────────────┐
│                SIGNUP PROCESS                       │
└─────────────────────────────────────────────────────┘

FRONTEND:
User clicks "Sign Up"
         ↓
Registration Form खुलता है
- Name: Raj Kumar
- Email: raj@mail.com  
- Password: MySecret123
- Confirm: MySecret123
         ↓
User clicks "Create Account"
         ↓
Frontend validation (Zod):
- Email format valid?
- Password length >= 8?
- Passwords match?
         ↓
POST /api/auth/signup
{
  name: "Raj Kumar",
  email: "raj@mail.com",
  password: "MySecret123"
}

BACKEND:
         ↓
Zod validation फिर से (security)
         ↓
Email already exists check
- Database में raj@mail.com है?
- Yes → 400 Email already registered
- No → Continue
         ↓
Password encrypt (bcrypt):
- Raw password: "MySecret123"
- 10 rounds hashing
- Encrypted: "$2b$10$...encrypted..."
         ↓
Database में save करो:
User document:
{
  name: "Raj Kumar",
  email: "raj@mail.com",
  password: "$2b$10$...encrypted...",
  emailVerified: false,
  emailVerifyToken: "random_token_123",
  emailVerifyExpires: "2026-09-19T14:45:00Z"
}
         ↓
Email verification link भेजो (Nodemailer):
To: raj@mail.com
Subject: Verify Your CineWorld Account
Body:
  "Click here to verify: 
   https://cineworld.com/verify?token=random_token_123"
         ↓
Frontend response भेजो:
{
  success: true,
  message: "Account created! Check email to verify."
}
         ↓
FRONTEND:
"Verification email भेजी गई"
User को verify email का prompt दिखता है

USER:
Email open करता है
Click करता है verification link
         ↓
BACKEND:
GET /verify?token=random_token_123
         ↓
Token verify करो
- Token in database exist करता है?
- Token expired तो नहीं?
- User found है?
         ↓
Token match:
- emailVerified = true
- emailVerifyToken = null
- emailVerifyExpires = null
         ↓
Success message
"Email verified! You can now login."
         ↓
User login कर सकता है अब
```

## Feature 2: Movie Search with AI

```
┌────────────────────────────────────────────────┐
│        AI-POWERED MOVIE SEARCH FLOW            │
└────────────────────────────────────────────────┘

FRONTEND:
User types: "Best action movies 2023"
         ↓
TanStack Query debounced search (300ms delay)
         ↓
POST /api/ai/search
{
  query: "Best action movies 2023"
}

BACKEND - AI Service:
         ↓
Input sanitization (security):
"Best action movies 2023" → escape special chars
         ↓
Groq API call with prompt:
"Convert 'Best action movies 2023' into TMDB parameters.
Return JSON only: { genre_ids, year, sort_by, ... }"
         ↓
Groq's AI Response:
{
  "genre_ids": [28],              // Action
  "primary_release_year": 2023,
  "sort_by": "vote_average.desc", // Best rated
  "vote_count.gte": 100            // Popular
}
         ↓
TMDB API call:
GET /discover/movie?genre_ids=28&year=2023&sort_by=vote_average.desc
         ↓
TMDB Response (20 movies):
[
  {
    id: 550,
    title: "The Raid 2",
    poster_path: "/poster.jpg",
    vote_average: 7.6,
    genre_ids: [28],
    release_date: "2023-01-15"
  },
  ... 19 more
]
         ↓
Cache में save करो (3 min):
cache.set("search:action2023", results)
         ↓
Response भेजो

FRONTEND:
         ↓
Results display करो:
[Movie card 1] [Movie card 2] [Movie card 3] ...
```

## Feature 3: Watchlist Management

```
┌────────────────────────────────────────────────────┐
│        WATCHLIST FEATURE WORKFLOW                  │
└────────────────────────────────────────────────────┘

USER ADDS MOVIE:
User movie detail page खोलता है
Click करता है: "Add to Watchlist"
         ↓
Modal खुलता है:
Select Status:
○ Want to Watch
○ Watching  
○ Watched
         ↓
User selects: "Want to Watch"
Click: "Add"
         ↓
FRONTEND:
POST /api/users/me/watchlist
{
  movieId: 550,
  title: "Fight Club",
  poster_path: "...",
  status: "want_to_watch"
}

Authorization Header में JWT token

BACKEND:
         ↓
authMiddleware: Token verify करो
         ↓
User fetch करो (token से userId)
         ↓
Movie already in watchlist?
- Yes → Update status (want_to_watch → watched)
- No → Add new entry
         ↓
Update database:
User.findByIdAndUpdate(userId, {
  $push: {
    watchlist: {
      id: 550,
      title: "Fight Club",
      status: "want_to_watch"
    }
  }
})
         ↓
Response:
{
  success: true,
  watchlist: [...updated list...]
}

FRONTEND:
         ↓
Toast notification: "Added to Watchlist" ✓
Button text change: "Add to Watchlist" → "Remove"

USER VIEWS WATCHLIST:
Frontend: GET /api/users/me/watchlist
         ↓
Backend returns current user का full watchlist
         ↓
Frontend display:
Tab 1: "Want to Watch" (3 movies)
Tab 2: "Watching" (5 movies)  
Tab 3: "Watched" (12 movies)

USER MARKS AS WATCHED:
Click movie → "Mark as Watched"
         ↓
PUT /api/users/me/watchlist/550
{
  status: "watched"
}
         ↓
Backend updates status
         ↓
Movie "Want to Watch" tab से
"Watched" tab में move हो जाती है

Fayda:
- Track करो कौन सी movies देखी
- Queue maintain करो (want to watch)
- History record करो (watched)
```

## Feature 4: Write & View Reviews

```
┌─────────────────────────────────────────────────┐
│         REVIEW SYSTEM                           │
└─────────────────────────────────────────────────┘

WRITE REVIEW:
User movie page पर "Write Review" button
         ↓
Form खुलता है:
- Rating: ⭐⭐⭐⭐ (4 stars)
- Content: "Excellent film, highly recommended!"
         ↓
Click: "Post Review"
         ↓
FRONTEND:
POST /api/reviews
{
  movieId: "550",
  movieTitle: "Fight Club",
  rating: 4,
  content: "Excellent film, highly recommended!"
}

BACKEND:
         ↓
Zod validation:
- Content length: 2-1000 chars?
- Rating: 1-5?
- MovieId valid?
         ↓
Check unique constraint:
- Same user ek movie पर सिर्फ एक review लिख सकता है
Database compound index: (movieId, user)
         ↓
Review save करो:
{
  movieId: "550",
  movieTitle: "Fight Club",
  user: ObjectId("user_id"),
  author: "Raj Kumar",
  content: "Excellent film...",
  rating: 4,
  createdAt: now
}
         ↓
Response + notification trigger

VIEW REVIEWS:
Frontend: GET /api/reviews/550

BACKEND:
         ↓
Database से सभी reviews fetch करो:
Review.find({ movieId: "550" })
         ↓
Aggregate करो (ratings का):
Average rating: 4.2
Total reviews: 45
Rating breakdown:
- 5 stars: 25 reviews
- 4 stars: 12 reviews
- 3 stars: 8 reviews

FRONTEND:
         ↓
Display करो:

━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ 4.2 / 5 (45 reviews)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Raj Kumar ⭐⭐⭐⭐ (2 days ago)
"Excellent film, highly recommended!"

Priya Singh ⭐⭐⭐⭐⭐ (1 week ago)
"Masterpiece! Every scene is perfect"

... more reviews
```

## Feature 5: Real-Time Notifications (Follow)

```
┌────────────────────────────────────────────────┐
│      REAL-TIME NOTIFICATION (SSE)              │
└────────────────────────────────────────────────┘

USER A FOLLOWS USER B:
User B के profile पर click: "Follow" button
         ↓
FRONTEND:
POST /api/users/B_ID/follow

BACKEND:
         ↓
User A data में User B को add करो (following array)
User B के liye notification create करो
         ↓
Database:
Notification:
{
  user: User_B_ID,
  icon: "👤",
  text: "User A started following you",
  link: "/user/user_a_profile",
  read: false,
  createdAt: now
}

CREATE NOTIFICATION TRIGGER:
         ↓
Check: User B online है या offline?
         ↓
ONLINE (SSE connection active):
│
└─ Real-time notification:
   नोटिफिकेशन तुरंत दिख जाती है
   Notification bell में indicator
   "User A started following you" toast
   
OFFLINE (No SSE connection):
│
└─ Database में save रहता है
   अगली बार जब User B login करे
   सभी pending notifications show होंगी

USER B को NOTIFICATION दिखना:
┌───────────────────────────────┐
│ 🔔 Notifications              │
│                               │
│ 👤 User A started following.. │ ✓ Today
│                               │
│ 💬 Raj Kumar commented on...  │ ✓ Yesterday
│                               │
│ ⭐ Your review got a like     │ ✓ 2 days ago
└───────────────────────────────┘

USER B CLICKS NOTIFICATION:
Link follow करो → User A का profile page
```

---

# 12. Summary - Sab Kuch Ek Choti Si Picture 🎬

## CineWorld Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                     CINEWORLD SYSTEM                            │
└─────────────────────────────────────────────────────────────────┘

                           USER (Browser)
                               │
                               ▼
                    ┌──────────────────┐
                    │ Frontend (React) │
                    │ - Beautiful UI   │
                    │ - Fast loading   │
                    │ - Dark/Light mode
                    └────────┬─────────┘
                             │
                    HTTP/REST │ (TanStack Query)
                             │
                    ┌────────▼─────────┐
                    │ Backend (Express)│
                    │ - API endpoints  │
                    │ - Middleware     │
                    │ - Security       │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    ┌────────┐         ┌──────────┐         ┌────────┐
    │MongoDB │         │TMDB API  │         │Groq AI │
    │Database│         │(Movies)  │         │(LLM)   │
    └────────┘         └──────────┘         └────────┘

USERS KAN FEATURES:
✓ Browse millions of movies
✓ AI-powered search and recommendations
✓ Personal watchlist management
✓ Write and read reviews
✓ Follow other users
✓ Real-time notifications
✓ Weekly AI digest emails
✓ Collaborative recommendations

DEPLOYMENT:
✓ Frontend: Vercel CDN (80+ countries)
✓ Backend: Render (auto-scaling)
✓ Database: MongoDB Atlas (cloud)

SECURITY:
✓ Password encryption (bcrypt)
✓ JWT token rotation
✓ CORS protection
✓ Rate limiting
✓ Input validation
✓ Account lockout
✓ Email verification
```

---

## How Everything Connects

```
COMPLETE USER JOURNEY:

1. SIGNUP
   User → Signup Form → Backend → Email Verification → Login

2. HOME PAGE
   User → React Home → TanStack Query → Backend → TMDB → Display

3. SEARCH
   User → Search Input → Debounce → AI Parse → TMDB Discover → Results

4. MOVIE DETAILS
   User → Click Movie → Detail Page → Show cast, reviews, AI chat

5. ADD TO WATCHLIST
   User → Click "Add" → Backend saves → Database update → Sync

6. WRITE REVIEW
   User → Form → Submit → Validation → Save → Others see it

7. FOLLOW USER
   User → Click Follow → Backend → Create Notification → Real-time trigger

8. AI RECOMMENDATIONS
   User → Ask AI → Groq processes → Personalized movies

9. LOGOUT
   User → Click Logout → Clear tokens → Back to home
```

---

## Kya Seekha?

```
अब तुम समझते हो:

1️⃣ Frontend Kya है → React, UI, User interactions
2️⃣ Backend Kya है → API, Database, Business logic
3️⃣ Database Kya है → Data storage, Collections
4️⃣ AI Kya है → Natural language understanding, Recommendations
5️⃣ Security Kya है → Passwords, Tokens, Validation
6️⃣ Deployment Kya है → Live servers, CDN, Auto-scaling
7️⃣ Real-time Kya है → SSE, Notifications, Live updates

अगर कोई interview में पूछे:
"CineWorld कैसे काम करता है?"
तुम बता सकते हो सब कुछ! ✓
```

---

## Final Architecture Diagram

```
                    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
                    ┃   USER (Browser/App)     ┃
                    ┗━━━━━━━━┬━━━━━━━━━━━━━━━━━┛
                             │
                    ┌────────▼────────┐
                    │  FRONTEND (CDN) │
                    │  ┌────────────┐ │
                    │  │ React 18   │ │
                    │  │ Vite       │ │
                    │  │ TailwindCSS│ │
                    │  │ TanStack Q │ │
                    │  └────────────┘ │
                    └────────┬────────┘
                             │ (REST API)
                    ┌────────▼────────────────┐
                    │   BACKEND (Auto-scale) │
                    │ ┌──────────────────┐   │
                    │ │ Express Routes   │   │
                    │ │ Auth Middleware  │   │
                    │ │ Validation (Zod) │   │
                    │ │ AI Service       │   │
                    │ │ Caching          │   │
                    │ └──────────────────┘   │
                    └────┬────────────┬──────┘
                         │            │
          ┌──────────────▼┐      ┌────▼──────────┐
          │  MongoDB      │      │ External APIs│
          │  (Persistent) │      │ ┌──────────┐ │
          │  Users        │      │ │TMDB Data │ │
          │  Reviews      │      │ │Groq AI  │ │
          │  Watchlist    │      │ │Nodemailer
          │  Notifs       │      │ └──────────┘ │
          └───────────────┘      └─────────────┘

COMPLETE FULL-STACK SYSTEM READY FOR PRODUCTION ✓
```

---

**🎉 अब तुम CineWorld को complete समझ गए!**

**कोई सवाल हो तो बता! 🚀**
