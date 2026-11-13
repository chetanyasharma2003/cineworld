# ✅ Final Deployment Checklist (30 Minutes to Live)

**Status**: All code ready, automatic deployment configured  
**Time Estimate**: ~30 minutes  
**Result**: Push to GitHub → Auto-deploy to Render + Vercel

---

## 🎯 PHASE 1: GitHub Repository Setup (Already Done ✅)

- [x] Repository created & initialized
- [x] All code committed (52 commits)
- [x] CI/CD pipeline configured (.github/workflows/ci.yml)
- [x] Vercel config created (vercel.json)
- [x] Render config created (render.yaml)
- [x] .env.example provided
- [x] Documentation complete

**Status**: ✅ READY

---

## 🚀 PHASE 2: Backend Deployment (Render) — 10 Minutes

### Step 1: Create Render Account
- [ ] Go to https://render.com
- [ ] Sign up with GitHub account
- [ ] Authorize GitHub access

### Step 2: Connect Repository to Render
- [ ] Click "New" → "Web Service"
- [ ] Select GitHub account
- [ ] Select repository: `cineworld`
- [ ] Click "Connect"

### Step 3: Configure Service
- [ ] Service name: `cineworld-api`
- [ ] Environment: `Node`
- [ ] Region: Choose closest to users (e.g., Oregon)
- [ ] Plan: `Free` (for now)
- [ ] Build Command: `npm install`
- [ ] Start Command: `cd server && npm start`

### Step 4: Add Environment Variables
Copy these from `.env.example` and fill in YOUR values:

```env
DATABASE_URL=mongodb+srv://YOUR_USER:YOUR_PASS@cluster.mongodb.net/cineworld
JWT_SECRET=<generate random 32+ char string>
TMDB_API_KEY=<from https://www.themoviedb.org/settings/api>
GROQ_API_KEY=gsk_<from https://console.groq.com>
STRIPE_SECRET_KEY=sk_test_<from https://dashboard.stripe.com>
STRIPE_WEBHOOK_SECRET=whsec_<from Stripe webhooks>
EMAIL_USER=<your_gmail@gmail.com>
EMAIL_PASS=<Gmail app password>
SENTRY_DSN=<optional, from Sentry>
CLIENT_ORIGIN=https://cineworld.vercel.app
NODE_ENV=production
METRICS_API_KEY=<generate random string>
```

- [ ] Add all environment variables
- [ ] Click "Deploy"

### Step 5: Verify Deployment
```bash
# Wait 2-5 minutes for deployment
# Then test:
curl https://cineworld-api.onrender.com/health

# Expected response:
{
  "status": "ok",
  "db": "connected",
  "env": "production"
}
```

- [ ] Check Render dashboard shows "Live"
- [ ] Health check returns `ok`
- [ ] Copy your API URL: `https://cineworld-api.onrender.com`

**Status**: ✅ BACKEND LIVE

---

## 💻 PHASE 3: Frontend Deployment (Vercel) — 10 Minutes

### Step 1: Create Vercel Account
- [ ] Go to https://vercel.com
- [ ] Sign up with GitHub account
- [ ] Authorize GitHub access

### Step 2: Import Project
- [ ] Click "Add New" → "Project"
- [ ] Select GitHub account
- [ ] Select repository: `cineworld`
- [ ] Click "Import"

### Step 3: Configure Project
- [ ] Framework: `Vite` (auto-detected)
- [ ] Root Directory: `./client`
- [ ] Build Command: `npm run build` (auto-detected)
- [ ] Output Directory: `dist` (auto-detected)

### Step 4: Add Environment Variables
- [ ] `VITE_API_URL` = Your Render URL from Phase 2 (e.g., `https://cineworld-api.onrender.com`)
- [ ] `VITE_STRIPE_PUBLIC_KEY` = `pk_test_<your_key>` (from Stripe)

- [ ] Click "Deploy"

### Step 5: Verify Deployment
```bash
# Wait 3-5 minutes for build & deployment
# Then test:
Visit https://cineworld.vercel.app

# Expected:
- Page loads without 404 errors
- Can click around (search, browse movies)
- Stripe button visible
```

- [ ] Vercel shows "Ready" status
- [ ] Frontend loads without errors
- [ ] Can make API calls to backend (check Network tab)

**Status**: ✅ FRONTEND LIVE

---

## 🗄️ PHASE 4: Database Setup (MongoDB Atlas) — 5 Minutes

### Step 1: Create MongoDB Account
- [ ] Go to https://mongodb.com/cloud
- [ ] Sign up with email
- [ ] Verify email

### Step 2: Create Cluster
- [ ] Click "Create a Deployment"
- [ ] Select "Free" tier (M0)
- [ ] Choose region closest to you
- [ ] Click "Create"

### Step 3: Create Database User
- [ ] Go to "Database Access"
- [ ] Click "Add New Database User"
- [ ] Username: `admin` (or your choice)
- [ ] Password: Generate strong password
- [ ] Built-in role: "Atlas Admin"
- [ ] Click "Add User"

### Step 4: Whitelist IP
- [ ] Go to "Network Access"
- [ ] Click "Add IP Address"
- [ ] Add "0.0.0.0/0" (allow all IPs for Render)
- [ ] Click "Confirm"

### Step 5: Get Connection String
- [ ] Go to "Database" → Your cluster
- [ ] Click "Connect"
- [ ] Select "Drivers" → "Node.js"
- [ ] Copy connection string

### Step 6: Add to Render
- [ ] Go to Render dashboard
- [ ] Click service `cineworld-api`
- [ ] Go to "Environment" → Edit
- [ ] Update `DATABASE_URL` with your connection string
- [ ] Replace `<username>` and `<password>` with your credentials
- [ ] Click "Save"
- [ ] Service auto-redeploys

- [ ] Connection string added
- [ ] Service redeployed
- [ ] Health check still returns `ok`

**Status**: ✅ DATABASE CONNECTED

---

## 🔐 PHASE 5: Stripe Webhook Setup (Optional but Important) — 5 Minutes

### Step 1: Configure Webhook
- [ ] Go to https://dashboard.stripe.com
- [ ] Go to "Developers" → "Webhooks"
- [ ] Click "Add Endpoint"
- [ ] Endpoint URL: `https://cineworld-api.onrender.com/api/subscriptions/webhook`
- [ ] Events to send:
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`

### Step 2: Get Webhook Secret
- [ ] Copy webhook signing secret
- [ ] Go to Render env vars
- [ ] Add `STRIPE_WEBHOOK_SECRET` = your secret
- [ ] Save

- [ ] Webhook configured
- [ ] Secret added to env vars
- [ ] Service redeployed

**Status**: ✅ STRIPE WEBHOOKS READY

---

## 🔄 PHASE 6: Enable Automatic Deployment (Already Configured!)

### Render Auto-Deploy
- [x] `render.yaml` created
- [x] Auto-deploy enabled in config
- [x] Branch set to `main`

**How it works:**
- Push to GitHub main branch
- Render gets notification
- Render auto-builds and deploys
- Takes ~2-5 minutes

### Vercel Auto-Deploy
- [x] `vercel.json` created
- [x] Auto-deploy enabled by default
- [x] GitHub integration active

**How it works:**
- Push to GitHub main branch
- Vercel gets notification
- Vercel auto-builds and deploys
- Takes ~3-7 minutes

### GitHub CI Pipeline
- [x] `.github/workflows/ci.yml` configured
- [x] Runs on every push to main
- [x] Tests + builds automatically

**How it works:**
- Push to GitHub
- CI runs tests
- If passes → Render + Vercel deploy
- If fails → No deployment

---

## 🧪 PHASE 7: Final Verification (5 Minutes)

### Backend Verification
```bash
# 1. Health check
curl https://cineworld-api.onrender.com/health
# Expected: {"status":"ok","db":"connected"}

# 2. API endpoints
curl https://cineworld-api.onrender.com/api/search/genres
# Expected: List of genres

# 3. Check logs
# Go to Render dashboard → Service → Logs
# Should see: "Server running on port 8000"
```

- [ ] Backend health check works
- [ ] API endpoints respond
- [ ] No errors in logs

### Frontend Verification
```bash
# 1. Visit website
https://cineworld.vercel.app

# 2. Test features
- [ ] Page loads
- [ ] Can search movies
- [ ] Can create account
- [ ] Can add to watchlist
- [ ] Stripe button visible
- [ ] Dark mode works
```

- [ ] Frontend loads
- [ ] All features work
- [ ] No 404 errors
- [ ] Mobile responsive

### Integration Verification
```bash
# 1. Open DevTools (F12)
# 2. Go to Network tab
# 3. Search for a movie
# 4. Check API calls
# - Should see request to https://cineworld-api.onrender.com/api/...
# - Status should be 200 OK
```

- [ ] Frontend calls backend correctly
- [ ] API responses work
- [ ] Real-time features work

---

## 🚀 PHASE 8: Test Automatic Deployment

### Test the Auto-Deploy Pipeline

```bash
# 1. Make a test change
echo "// Auto-deploy test" >> server/index.js

# 2. Commit and push
git add server/index.js
git commit -m "test: verify auto-deploy pipeline"
git push origin main

# 3. Watch the magic:
# - Go to GitHub Actions (Actions tab)
#   → See CI pipeline running
#   → Tests should pass
# - Go to Render dashboard
#   → See "Deploying..." status
#   → Wait for "Live" status
# - Go to Vercel dashboard
#   → See building status
#   → Wait for "Ready" status

# 4. Verify it deployed:
# Both should auto-deploy in 5-10 minutes total
```

- [ ] GitHub Actions runs CI
- [ ] Render auto-deploys
- [ ] Vercel auto-deploys
- [ ] Both go live successfully

---

## ✅ DEPLOYMENT COMPLETE!

When all checkboxes are filled:

```
✅ Render backend deployed
✅ Vercel frontend deployed
✅ MongoDB connected
✅ Stripe webhooks configured
✅ Auto-deployment enabled
✅ All verifications passed
✅ Test deployment successful

🎉 Your production platform is LIVE!
```

---

## 📊 Quick Reference: What's Where

| Component | URL | Status |
|-----------|-----|--------|
| Frontend | https://cineworld.vercel.app | ✅ Live |
| Backend API | https://cineworld-api.onrender.com | ✅ Live |
| API Docs | https://cineworld-api.onrender.com/api/docs | ✅ Available |
| Health Check | https://cineworld-api.onrender.com/health | ✅ OK |
| GitHub Repo | https://github.com/chetanyasharma2003/cineworld | ✅ Main branch |

---

## 🔗 Important Links

- **GitHub**: https://github.com/chetanyasharma2003/cineworld
- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Stripe Dashboard**: https://dashboard.stripe.com

---

## 🆘 If Something Goes Wrong

### Render Deploy Failed
- [ ] Check Render logs for errors
- [ ] Verify all env vars are set
- [ ] Check DATABASE_URL is correct
- [ ] Manually redeploy: Dashboard → Service → Manual Deploy

### Vercel Deploy Failed
- [ ] Check Vercel build logs
- [ ] Verify VITE_API_URL is set
- [ ] Check client/package.json build script
- [ ] Manually redeploy: Dashboard → Deployments → Promote

### Frontend Can't Reach Backend
- [ ] Check VITE_API_URL env var in Vercel
- [ ] Should be `https://cineworld-api.onrender.com`
- [ ] Check CLIENT_ORIGIN env var in Render
- [ ] Should be `https://cineworld.vercel.app`

### Database Not Connecting
- [ ] Check DATABASE_URL format
- [ ] Verify MongoDB IP whitelist includes Render
- [ ] Check credentials are correct
- [ ] Test connection: `mongosh "$DATABASE_URL"`

---

## 🎉 You're Ready!

**Total Time to Production**: ~30 minutes  
**Auto-Deploy Configured**: ✅ YES  
**Monitoring Ready**: ✅ YES  
**Rollback Available**: ✅ YES

**Every time you push to main, your platform updates automatically!**

---

**Date**: 2026-11-13  
**Version**: 1.0.0 (Production Ready)  
**Status**: ✅ READY TO DEPLOY
