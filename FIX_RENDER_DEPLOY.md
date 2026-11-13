# 🔧 Fix Render Deployment Issue

**Error**: `Exited with status 1 while running your code`

**Status**: 
- ✅ Vercel frontend: LIVE
- ❌ Render backend: FAILED

---

## 🚨 Quick Fix Steps

### Option 1: Check Environment Variables (Most Common)

1. Go to Render Dashboard → `cineworld-api` service
2. Click "Environment" tab
3. Verify these are set:
   - [ ] `DATABASE_URL` — Must start with `mongodb+srv://`
   - [ ] `JWT_SECRET` — Must be 32+ characters
   - [ ] `TMDB_API_KEY` — Must be valid
   - [ ] `GROQ_API_KEY` — Must start with `gsk_`
   - [ ] `NODE_ENV` — Must be `production`

4. If any missing → Add them
5. Click "Save" → Service auto-restarts

---

### Option 2: Check Build Logs

1. Go to Render Dashboard → `cineworld-api`
2. Click "Logs" tab
3. Look for:
   - `npm install` errors → Fix package.json
   - `Database connection` errors → Fix DATABASE_URL
   - `Start command` errors → Check server/package.json

---

### Option 3: Manual Redeploy

1. Render Dashboard → `cineworld-api` service
2. Click "Manual Deploy" button
3. Select branch: `main`
4. Click "Deploy"
5. Wait 2-5 minutes

---

### Option 4: Fix server/package.json Start Script

Check that `server/package.json` has:

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest --passWithNoTests"
  }
}
```

If `start` script missing:
```bash
cd /Users/chetanya/Documents/CineWorld/server
npm set-script start "node index.js"
git add package.json
git commit -m "fix: add start script for Render"
git push origin main
```

---

## 🔍 Detailed Troubleshooting

### Error: "Cannot find module"

```bash
# Fix:
cd server
npm ci  # Clean install
npm start
```

### Error: "Database connection failed"

```bash
# Verify connection string format:
# mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/database

# Check in Render env vars - exact format matters!
# If has special characters → URL encode them
```

### Error: "GROQ_API_KEY not found"

```bash
# Make sure env var is set:
# GROQ_API_KEY=gsk_your_actual_key_here

# NOT: "gsk_your_actual_key_here" (no quotes)
```

---

## ✅ Verification Checklist

After fixing, verify:

```bash
# 1. Check health endpoint
curl https://cineworld-api.onrender.com/health

# 2. Check API docs
curl https://cineworld-api.onrender.com/api/docs

# 3. Check logs show no errors
# Render Dashboard → Logs tab
```

---

## 🚀 Fastest Fix: Just Update DATABASE_URL

**Most common cause**: DATABASE_URL not set

```bash
# 1. Go to MongoDB Atlas
# 2. Get your connection string
# 3. Go to Render → Service → Environment
# 4. Find DATABASE_URL
# 5. Paste your connection string (with username:password)
# 6. Save
# 7. Service auto-redeploys
# 8. Wait 2 min
# 9. Test health check
```

---

**Status**: Will be fixed within 5-10 minutes!
