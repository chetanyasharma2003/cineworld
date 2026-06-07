# CineWorld

CineWorld is a full-stack movie discovery app built with React, Vite, Express, MongoDB, and TMDB.

## Features

- Browse TMDB movie sections through the backend API
- Search movies from the navbar
- View movie details, cast, similar movies, trailers, and watch providers
- Sign up and log in with JWT authentication
- Submit protected movie reviews
- Save movies to My List, synced to MongoDB when logged in

## Project Structure

```txt
Cineworld/
  client/   React + Vite frontend
  server/   Express + MongoDB API
```

## Setup

1. Install dependencies:

```bash
npm --prefix client install
npm --prefix server install
```

2. Create environment files:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

3. Fill in `server/.env`:

```env
PORT=8000
CLIENT_ORIGIN=http://localhost:5173
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-long-random-secret
TMDB_TOKEN=your-tmdb-read-access-token
```

4. Run the app:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.
Backend runs on `http://localhost:8000`.

## Run In VS Code

1. Open VS Code.
2. Choose `File > Open Folder...`.
3. Select `/Users/chetanya/Documents/Cineworld`.
4. Open two terminals inside VS Code.
5. In terminal 1:

```bash
cd server
npm install
npm start
```

6. In terminal 2:

```bash
cd client
npm install
npm run dev
```

7. Open `http://localhost:5173`.

You can also use `Terminal > Run Task...` and choose `Start backend` or `Start frontend`.

## Useful Scripts

```bash
npm run client:dev
npm run server:dev
npm run build
npm run lint
npm test
```

## API Overview

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/movies/home`
- `GET /api/movies/search?query=avatar`
- `GET /api/movies/:id`
- `GET /api/reviews/:movieId`
- `POST /api/reviews`
- `GET /api/users/me/list`
- `POST /api/users/me/list`
- `DELETE /api/users/me/list/:movieId`
