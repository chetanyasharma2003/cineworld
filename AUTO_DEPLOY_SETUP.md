# 🚀 Automatic Deployment Setup (Render + Vercel)

**Enable One-Click Deployment**: Push to GitHub → Automatically deploy to Render + Vercel

---

## 🎯 What's Included

- ✅ **CI/CD Pipeline** (GitHub Actions)
- ✅ **Vercel Auto-Deploy** Config
- ✅ **Render Auto-Deploy** Config
- ✅ **Environment Management**

---

## 📋 Setup Instructions

### Step 1: Setup Render Auto-Deploy

**Option A: Using render.yaml (RECOMMENDED)**

Render supports `render.yaml` for infrastructure-as-code:

```bash
# File already created: render.yaml
# It includes:
# - Backend API service config
# - Auto-deploy on push to main
# - Health check configuration
# - Environment variables template
```

**To connect:**

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Select GitHub repository
4. Choose "Use render.yaml configuration"
5. Fill in environment variables (DATABASE_URL, API keys, etc.)
6. Deploy!

**That's it!** From now on, every push to `main` will auto-deploy.

---

### Step 2: Setup Vercel Auto-Deploy

**Vercel automatically detects vercel.json:**

```bash
# File already created: vercel.json
# It includes:
# - Framework: Vite
# - Build command configured
# - Output directory specified
# - API proxy to Render backend
# - Cache headers for static assets
```

**To connect:**

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Select GitHub repository
4. Vercel will auto-detect the config
5. Add environment variables:
   - `VITE_API_URL` = Your Render backend URL
   - `VITE_STRIPE_PUBLIC_KEY` = Your Stripe key
6. Deploy!

**That's it!** Every push to `main` will auto-deploy.

---

### Step 3: Setup GitHub Actions CI/CD

**CI Pipeline already configured (`.github/workflows/ci.yml`):**

```yaml
On every push to main:
✅ Install server dependencies
✅ Run server tests
✅ Check server lint
✅ Install client dependencies
✅ Lint client code
✅ Build client (Vite)
✅ Run security audits
✅ Upload build artifacts
```

**No setup needed** — It runs automatically!

---

## ⚙️ How Automatic Deployment Works

```
1️⃣ Push code to GitHub (main branch)
   ↓
2️⃣ GitHub Actions runs CI pipeline
   ├─ Server tests ✅
   ├─ Client build ✅
   └─ Security audit ✅
   ↓
3️⃣ CI passes → Webhook triggered
   ↓
4️⃣ Render auto-deploys backend
   └─ Pulls from GitHub
   └─ Installs dependencies
   └─ Runs `npm start`
   └─ Health check passes
   ↓
5️⃣ Vercel auto-deploys frontend
   └─ Pulls from GitHub
   └─ Builds with Vite
   └─ Deploys to CDN
   ↓
6️⃣ Production updated!
   Total time: ~5-10 minutes
```

---

## 🔐 Environment Variables Setup

### Render Backend

1. Go to Service Settings → Environment
2. Add these from `.env.example`:

```env
DATABASE_URL=mongodb+srv://...
JWT_SECRET=<your_secret>
TMDB_API_KEY=<your_key>
GROQ_API_KEY=gsk_<your_key>
STRIPE_SECRET_KEY=sk_test_<your_key>
STRIPE_WEBHOOK_SECRET=whsec_<your_secret>
EMAIL_USER=<gmail@gmail.com>
EMAIL_PASS=<app_password>
SENTRY_DSN=<optional>
NODE_ENV=production
CLIENT_ORIGIN=https://cineworld.vercel.app
```

### Vercel Frontend

1. Go to Project Settings → Environment Variables
2. Add these:

```env
VITE_API_URL=https://cineworld-api.onrender.com
VITE_STRIPE_PUBLIC_KEY=pk_test_<your_key>
```

---

## ✨ Features of Automatic Deployment

### 1. **Auto-Revert on Failure**
```
If deployment fails:
- Render: Previous version stays live
- Vercel: Previous version stays live
✅ No broken production!
```

### 2. **Preview Deployments**
```
On every pull request:
- Vercel creates preview URL
- Test changes before merging
- Share preview link with team
```

### 3. **Automated Rollback**
```
In case of issues:
Render: Click "Redeploy" on previous version
Vercel: Click deployment history, promote previous
```

### 4. **Production/Preview Branch**
```
main → Production (auto-deploy)
staging → Staging (auto-deploy to staging)
preview/* → Preview (auto-deploy to preview)
```

---

## 🧪 Testing Automatic Deployment

### Test Backend Auto-Deploy

```bash
# 1. Make a small change to server/index.js
echo "// test" >> server/index.js

# 2. Commit and push
git add server/index.js
git commit -m "test: verify auto-deploy"
git push origin main

# 3. Watch the magic:
# → GitHub Actions starts
# → Render gets notification
# → Render deploys automatically
# → Check https://cineworld-api.onrender.com/health

# 4. Verify it works:
curl https://cineworld-api.onrender.com/health
```

### Test Frontend Auto-Deploy

```bash
# 1. Make a small change to client/src/App.jsx
# 2. Commit and push
git add client/src/App.jsx
git commit -m "test: verify vercel auto-deploy"
git push origin main

# 3. Watch the magic:
# → Vercel detects change
# → Vercel builds project
# → Vercel deploys to production
# → Check https://cineworld.vercel.app

# 4. Verify change is live
```

---

## 📊 Deployment Pipeline Status

Check status anytime:

```bash
# GitHub Actions
https://github.com/chetanyasharma2003/cineworld/actions

# Render Deployments
https://dashboard.render.com (look for cineworld-api service)

# Vercel Deployments
https://vercel.com/dashboard (look for cineworld project)
```

---

## 🚨 Troubleshooting Auto-Deploy

### Render Deploy Failed

```bash
# Check logs:
1. Go to Render dashboard
2. Click service "cineworld-api"
3. View "Runtime logs"
4. Check for errors

Common issues:
- DATABASE_URL missing → Add to env vars
- npm install fails → Check package.json syntax
- Build script error → Check server/package.json "start" script
```

### Vercel Deploy Failed

```bash
# Check logs:
1. Go to Vercel dashboard
2. Click project "cineworld"
3. Click latest deployment
4. View build logs

Common issues:
- VITE_API_URL missing → Add to env vars
- Build fails → Check client/package.json scripts
- 404 errors → Check root directory config
```

### GitHub Actions Failed

```bash
# Check CI:
1. Go to GitHub repo
2. Click "Actions" tab
3. View latest workflow run
4. Check failed step

Common issues:
- Dependencies not installed → Check package-lock.json
- Tests fail → Fix failing tests
- Lint errors → Fix code style
```

---

## 🔄 Manual Deployment (If Auto-Deploy Fails)

### Redeploy on Render

```bash
# Via Dashboard:
1. Go to https://dashboard.render.com
2. Click "cineworld-api" service
3. Click "Manual Deploy"
4. Select branch "main"
5. Click "Deploy"

# Via CLI:
# Render doesn't have direct CLI, use dashboard
```

### Redeploy on Vercel

```bash
# Via Dashboard:
1. Go to https://vercel.com/dashboard
2. Click "cineworld" project
3. Click deployment history
4. Select previous version
5. Click "Promote to Production"

# Via CLI:
vercel --prod
```

---

## 📈 Monitoring Deployments

### Real-Time Monitoring

```bash
# Monitor Render logs:
tail -f render_logs.txt

# Monitor Vercel deploys:
vercel logs --function api

# Monitor GitHub Actions:
gh run list
```

### Webhooks for Notifications

Set up Slack/Discord notifications:

1. **GitHub Actions**:
   - Add Slack app to GitHub
   - Notify on workflow failures

2. **Render**:
   - Add webhook to Slack
   - Notify on deploy success/failure

3. **Vercel**:
   - Vercel → Integrations → Add Slack
   - Get deployment notifications

---

## 🎯 Best Practices

1. **Always Test Locally First**
   ```bash
   npm run dev     # Frontend
   npm start       # Backend
   ```

2. **Push to Feature Branch First**
   ```bash
   git checkout -b feature/my-feature
   git push origin feature/my-feature
   # Creates PR, builds preview on Vercel
   ```

3. **Review CI Pipeline**
   ```bash
   # Before merging, check:
   - GitHub Actions passed ✅
   - Vercel preview works ✅
   - Code review approved ✅
   ```

4. **Merge to Main**
   ```bash
   # Merging to main triggers:
   - Full CI pipeline
   - Auto-deploy to Render
   - Auto-deploy to Vercel
   ```

5. **Monitor Production**
   ```bash
   # After deployment:
   - Check health endpoint
   - Monitor error logs
   - Watch performance metrics
   ```

---

## 🚀 Quick Reference

| Event | Action | Time |
|-------|--------|------|
| Push to `main` | Render auto-deploys | 2-5 min |
| Push to `main` | Vercel auto-deploys | 3-7 min |
| Push to PR branch | Vercel preview | 2-5 min |
| CI pipeline fails | No deploy | N/A |
| Deploy fails | Rollback auto | Instant |

---

## 📞 Support

### If Auto-Deploy Not Working:

1. **Check GitHub Actions**
   - Repo → Actions → View latest run
   - Look for failed steps

2. **Check Render**
   - Dashboard → Service logs
   - Look for deployment errors

3. **Check Vercel**
   - Project → Deployments → View build logs
   - Look for build errors

4. **Manual Redeploy**
   - Use dashboard to manually trigger
   - Or use CLI tools

---

## ✅ Configuration Checklist

- [x] `.github/workflows/ci.yml` — CI pipeline configured
- [x] `render.yaml` — Render auto-deploy configured
- [x] `vercel.json` — Vercel auto-deploy configured
- [ ] Connect GitHub repo to Render
- [ ] Connect GitHub repo to Vercel
- [ ] Add environment variables to Render
- [ ] Add environment variables to Vercel
- [ ] Test auto-deployment with a push

---

**You're all set for automatic deployment!** 🎉

Every push to `main` will now automatically deploy to both Render and Vercel!

---

**Last Updated**: 2026-11-13  
**Status**: Ready for production CI/CD
