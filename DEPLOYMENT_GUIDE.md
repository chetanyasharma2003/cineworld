# CineWorld Deployment Guide

Complete instructions for deploying to Render (backend) and Vercel (frontend).

## Prerequisites
- GitHub account with cineworld repository
- MongoDB Atlas cluster
- Render.com account
- Vercel account
- Stripe account (for monetization)
- Gmail account with app password (for emails)
- TMDB API key
- Groq API key

## Backend Deployment (Render)

### 1. Create Render Web Service

1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect GitHub repository (cineworld)
4. Configure:
   - **Name**: cineworld-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `cd server && npm start`
   - **Region**: Choose closest to your users

### 2. Set Environment Variables on Render

Go to Settings → Environment Variables and add:

```
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/cineworld
JWT_SECRET=<32+ character random string>
TMDB_API_KEY=<your_tmdb_key>
GROQ_API_KEY=gsk_<your_groq_key>
STRIPE_SECRET_KEY=sk_test_<your_stripe_key>
STRIPE_WEBHOOK_SECRET=whsec_<your_webhook_secret>
EMAIL_USER=<your_gmail@gmail.com>
EMAIL_PASS=<your_app_password>
SENTRY_DSN=<your_sentry_dsn>
CLIENT_ORIGIN=https://cineworld.vercel.app
NODE_ENV=production
```

### 3. Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Note the URL: `https://cineworld-api.onrender.com`

### 4. Verify Deployment

```bash
curl https://cineworld-api.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "db": "connected",
  "env": "production"
}
```

## Frontend Deployment (Vercel)

### 1. Configure Client Environment

Create `client/.env.production`:

```
VITE_API_URL=https://cineworld-api.onrender.com
VITE_STRIPE_PUBLIC_KEY=pk_test_<your_stripe_key>
```

### 2. Deploy to Vercel

**Option A: Via GitHub (Recommended)**

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import GitHub repository
4. Configure:
   - **Framework**: Vite
   - **Root Directory**: `./client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:
   ```
   VITE_API_URL=https://cineworld-api.onrender.com
   VITE_STRIPE_PUBLIC_KEY=pk_test_<key>
   ```

6. Click "Deploy"

**Option B: Via CLI**

```bash
npm install -g vercel
cd client
vercel --prod
```

### 3. Verify Frontend

Visit `https://cineworld.vercel.app` and check that:
- Page loads
- Can make API calls to backend
- Stripe buttons appear

## Database Setup (MongoDB Atlas)

### 1. Create Cluster

1. Go to [mongodb.com/cloud](https://mongodb.com/cloud)
2. Create new project
3. Create cluster (M0 free tier recommended for testing)
4. Create database user with username/password
5. Add IP whitelist (Allow access from anywhere for Render)

### 2. Get Connection String

1. Click "Connect" on cluster
2. Choose "Connect your application"
3. Copy connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/cineworld
   ```

## Stripe Webhook Setup

### 1. Create Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add Endpoint"
3. Enter webhook URL:
   ```
   https://cineworld-api.onrender.com/api/subscriptions/webhook
   ```

4. Select events:
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copy webhook secret and add to environment variables

### 2. Test Webhook

```bash
curl -X POST https://cineworld-api.onrender.com/api/subscriptions/webhook \
  -H "stripe-signature: test_signature" \
  -d '{"type":"customer.subscription.updated"}'
```

## Post-Deployment Checklist

### Backend
- [ ] Health check returns `ok`
- [ ] Database is connected
- [ ] All environment variables are set
- [ ] API endpoints are accessible
- [ ] Error logging to Sentry works
- [ ] Stripe webhooks are receiving events
- [ ] Email sending works (test with /forgot-password)

### Frontend
- [ ] Page loads without 404 errors
- [ ] API calls work (check Network tab)
- [ ] Authentication flow works
- [ ] Stripe integration works
- [ ] Mobile responsiveness verified
- [ ] Dark mode works

### Monitoring
- [ ] Set up Sentry error tracking
- [ ] Configure Render logs
- [ ] Set up Stripe webhook alerts
- [ ] Enable monitoring for critical endpoints

## Database Migration (Production)

### Backup Before Migrating

```bash
# Export all collections
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/cineworld" \
  --out ./backup
```

### Create Indexes

Run on production database:

```javascript
// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ role: 1 });

// Review indexes
db.reviews.createIndex({ movieId: 1, user: 1 }, { unique: true });
db.reviews.createIndex({ createdAt: -1 });

// Analytics indexes
db.analytics.createIndex({ userId: 1, timestamp: -1 });
db.analytics.createIndex({ event: 1 });

// SharedList indexes
db.sharedlists.createIndex({ shareToken: 1 }, { unique: true });
```

## Troubleshooting

### Backend Not Connected to Database

```bash
# Check connection string
echo $DATABASE_URL

# Test connection
mongosh "$DATABASE_URL"
```

### Frontend API Calls Failing

1. Check VITE_API_URL is correct
2. Verify CORS is enabled in backend
3. Check browser console for CORS errors

### Stripe Webhooks Not Firing

1. Verify webhook URL is public
2. Check webhook signature validation
3. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to https://cineworld-api.onrender.com/api/subscriptions/webhook
   stripe trigger customer.subscription.updated
   ```

### Database Performance Issues

- Check indexes with `db.collection.getIndexes()`
- Monitor query performance in MongoDB Atlas dashboard
- Enable slow query logging

## Scaling for Production

### When You Need More Resources

1. **Database**: Upgrade MongoDB tier (M1 → M2 → M5)
2. **Backend**: Upgrade Render plan or add multiple instances
3. **Frontend**: Vercel automatically scales with traffic
4. **Caching**: Add Redis for session/cache storage
5. **CDN**: Enable Vercel edge caching

### Performance Optimization

- Enable gzip compression ✓ (already done)
- Optimize images with TMDB poster URLs
- Cache static assets (30 days for production)
- Use Connection pooling ✓ (already done)
- Request deduplication ✓ (already done)

## Continuous Deployment

### Auto-Deploy on Push

Both Render and Vercel support auto-deployment:

1. **Render**: Automatically deploys on push to main
2. **Vercel**: Automatically deploys on push to main

### Preview Deployments

Vercel creates preview URLs for every pull request (useful for testing).

## Environment-Specific Configs

### Development
```env
NODE_ENV=development
DEBUG=true
```

### Staging
```env
NODE_ENV=staging
SENTRY_ENABLED=true
```

### Production
```env
NODE_ENV=production
SENTRY_ENABLED=true
```

## Support & Monitoring

### Health Checks

Setup monitoring on:
- `https://cineworld-api.onrender.com/health` (every 5 min)
- `https://cineworld.vercel.app` (every 10 min)

### Error Tracking

All errors automatically sent to Sentry:
- Set up alerts for 10+ errors in 5 minutes
- Create custom dashboards for key metrics

### Logs

- **Render**: View logs in dashboard
- **Vercel**: View logs in deployment details
- **Both**: Centralized logging via Winston (writes to files + Sentry)

## Rollback Procedure

### If Deployment Breaks Production

**Render**:
1. Go to Deployments
2. Click "Redeploy" on previous working deployment

**Vercel**:
1. Go to Deployments
2. Click "..." on previous version
3. Click "Promote to Production"

---

**Deployment Date**: 2026-11-13
**Last Updated**: 2026-11-13
**Status**: Ready for production
