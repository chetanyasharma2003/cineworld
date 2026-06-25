# CineWorld — Claude Instructions

## Project Shape
Full-stack movie discovery app. Monorepo with `client/` (React+Vite) and `server/` (Express+MongoDB).

## Key Files
- Architecture & data models → `.claude/CODEBASE.md`
- How to add an API route → `.claude/skills/add-api-route.md`
- How to add an AI feature → `.claude/skills/add-ai-feature.md`
- How to add a React page → `.claude/skills/add-page.md`
- Architecture decisions → `.claude/memory/architecture.md`

## Rules
1. Server runs on port 8000, client on 5173 (dev)
2. All API routes are prefixed `/api/`
3. Protected routes use `protect` middleware from `server/middleware/authMiddleware.js`
4. Zod schemas live in `server/schemas/` — always validate input there
5. Never read `node_modules/`, `dist/`, `client/dist/`, `server/uploads/` unless explicitly asked
6. AI features use Groq SDK in `server/services/aiService.js` — add new AI functions there
7. Use TanStack Query for all data fetching on the client

## Dev Commands
```bash
# from project root
cd server && npm run dev   # starts server (port 8000)
cd client && npm run dev   # starts client (port 5173)
```
