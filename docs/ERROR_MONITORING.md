# Error Monitoring & Sentry Integration

Comprehensive error logging, tracking, and monitoring system for CineWorld using Sentry for both frontend and backend.

## Overview

- **Backend**: Node/Express with Sentry error tracking, custom error classification, and monitoring service
- **Frontend**: React with Sentry error tracking, performance monitoring, and session replay
- **Monitoring**: In-memory error stats, Sentry dashboard, and custom `/error-stats` endpoint
- **Testing**: Development-only error simulation routes for testing

## Setup

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and sign up
2. Create a new organization
3. Create two projects:
   - **CineWorld Frontend** (React)
   - **CineWorld Backend** (Node.js)
4. Copy the DSN for each project

### 2. Configure Backend (.env)

Add to `/Users/chetanya/Documents/Cineworld/server/.env`:

```bash
SENTRY_DSN=https://[key]@[id].ingest.sentry.io/[projectid]
```

### 3. Configure Frontend (.env)

Add to `/Users/chetanya/Documents/Cineworld/client/.env`:

```bash
VITE_SENTRY_DSN=https://[key]@[id].ingest.sentry.io/[projectid]
```

## Architecture

### Backend Error Monitoring

**File**: `server/services/errorMonitoring.ts`

Components:
- **ErrorCategory**: Classifies errors (auth, database, external_api, validation, rate_limit, internal)
- **ErrorSeverity**: Severity levels (low, medium, high, critical)
- **reportError()**: Captures and reports errors with context
- **errorStats**: In-memory error tracking
- **Sentry Integration**: Automatic capture with custom scope and tags

Example usage:

```typescript
import { reportError, ErrorSeverity, ErrorCategory } from "../services/errorMonitoring.js";

try {
  // ... code
} catch (error) {
  const errorReport = reportError(error, {
    userId: req.user._id.toString(),
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    statusCode: 500,
    additionalContext: {
      movieId: req.params.movieId,
      action: "fetchMovieDetails",
    },
  });
}
```

### Frontend Error Monitoring

**File**: `client/src/lib/sentry.ts`

Functions:
- `initSentry()`: Initialize Sentry on app startup
- `captureException()`: Manually capture exceptions
- `captureMessage()`: Log messages
- `setSentryUser()`: Set user context
- `addBreadcrumb()`: Track user actions

Example usage:

```typescript
import { captureException, addBreadcrumb, setSentryUser } from "../lib/sentry";

// Set user context after login
setSentryUser({
  id: user._id,
  email: user.email,
  username: user.username,
});

// Track user actions
addBreadcrumb("User clicked search", "user-action", "info");

// Capture errors
try {
  await fetchMovies();
} catch (error) {
  captureException(error, { context: "movieSearch" });
}
```

## Monitoring Endpoints

### 1. Health Check
```bash
GET /health
```

Returns server status, database state, uptime.

### 2. Metrics Endpoint
```bash
GET /metrics
```

Returns:
- Total requests and errors
- Error rate percentage
- Response time percentiles (p50, p95, p99)
- Top routes by traffic
- Database connection state

Example response:
```json
{
  "uptime_seconds": 3600,
  "total_requests": 15420,
  "total_errors": 23,
  "error_rate": "0.0015",
  "response_time_ms": {
    "avg": 142,
    "p50": 95,
    "p95": 450,
    "p99": 1200
  },
  "top_routes": {
    "GET /api/movies/trending": 3450,
    "GET /api/tmdb/search": 2100,
    "POST /api/reviews": 1800
  },
  "db_state": "connected"
}
```

### 3. Error Monitoring Stats
```bash
GET /error-stats
```

Returns current error statistics and recent errors:
```json
{
  "summary": {
    "total": 45,
    "byCategory": {
      "external_api": 12,
      "database": 8,
      "validation": 15,
      "internal": 5,
      "auth": 5
    },
    "bySeverity": {
      "low": 20,
      "medium": 15,
      "high": 8,
      "critical": 2
    },
    "byStatusCode": {
      "400": 15,
      "429": 12,
      "500": 10,
      "503": 8
    },
    "criticalErrorsCount": 2,
    "highErrorsCount": 8
  },
  "recentErrors": [
    {
      "message": "Connection timeout to MongoDB",
      "category": "database",
      "severity": "high",
      "timestamp": "2024-01-15T10:30:45.123Z",
      "sentryId": "abc123def456"
    }
  ]
}
```

## Testing Error Tracking

**File**: `server/routes/errorTestRoutes.ts`

Available only in development mode. Test errors at:

```bash
# Validation error (400)
GET /api/error-test/test/validation-error

# Database error (500)
GET /api/error-test/test/db-error

# Rate limit error (429)
GET /api/error-test/test/api-rate-limit

# Auth error (401)
GET /api/error-test/test/auth-error

# Promise rejection
GET /api/error-test/test/promise-rejection

# Uncaught exception
GET /api/error-test/test/uncaught-exception

# Fatal error (500)
GET /api/error-test/test/fatal-error

# Error with context
GET /api/error-test/test/error-with-context

# Capture custom message to Sentry
POST /api/error-test/test/sentry-capture
Content-Type: application/json

{
  "message": "Custom error message",
  "level": "warning"
}

# View error stats
GET /api/error-test/test/stats
```

## Sentry Alert Configuration

### Backend Alerts

1. **Critical Errors Alert**
   - Condition: Error rate > 1% over 5 minutes
   - Action: Email + Slack notification
   - Severity: Critical

2. **Database Connection Issues**
   - Condition: MongoDB connection errors > 3 in 10 minutes
   - Action: Email + PagerDuty
   - Severity: High

3. **Unhandled Rejections**
   - Condition: Any unhandled promise rejection
   - Action: Email
   - Severity: High

4. **Rate Limiting Exceeded**
   - Condition: Rate limit errors > 10 in 5 minutes
   - Action: Email + Slack
   - Severity: Medium

### Frontend Alerts

1. **High Error Volume**
   - Condition: Error events > 50 per hour
   - Action: Email + Slack
   - Severity: High

2. **Session Replay Issues**
   - Condition: Replay crashes or blank sessions
   - Action: Email
   - Severity: Medium

3. **Performance Degradation**
   - Condition: p95 response time > 2000ms
   - Action: Slack notification
   - Severity: Medium

## Setting Up Alerts in Sentry

### Via Sentry UI

1. Go to your project → Alerts → Create Alert Rule
2. Set condition (e.g., "Error rate is above")
3. Set filter (e.g., environment = production)
4. Add notification action (Email, Slack, Discord, PagerDuty)
5. Save

### Example: Critical Error Alert

```
When: Error rate is above 1% over 5 minutes
For events in: production environment
Alert should: Send an email & post to Slack
```

### Example: Database Error Alert

```
When: The issue is resolved
If: [error.value] contains "MongoDB"
Then: Send an email
```

## Integrating with Slack

1. In Sentry project settings → Integrations
2. Search for "Slack" and click "Install"
3. Authorize the Sentry app in your Slack workspace
4. Select channel for alerts (e.g., #errors or #devops)
5. In alert rules, select Slack as notification channel

## Key Metrics to Monitor

### Error Metrics
- Error rate (% of requests with errors)
- Top error messages
- Errors by category (auth, database, etc.)
- Errors by severity (critical, high, etc.)

### Performance Metrics
- Response time (avg, p50, p95, p99)
- Database query time
- External API call latency
- Frontend JS execution time

### System Metrics
- Database connection status
- Memory usage
- CPU usage
- Request volume by route

## Best Practices

1. **Always set user context** after authentication
   ```typescript
   setSentryUser({ id: user._id, email: user.email });
   ```

2. **Add breadcrumbs for complex actions**
   ```typescript
   addBreadcrumb("Started movie search", "user-action");
   ```

3. **Include context in error reports**
   ```typescript
   reportError(error, {
     userId: req.user._id,
     movieId: req.params.id,
     action: "watchlist-add",
   });
   ```

4. **Filter out known low-level errors**
   - Network timeouts in development
   - Quota exceeded errors
   - User aborted requests

5. **Set appropriate sample rates**
   - Production: 10-20% for transactions
   - Development: 50-100% for debugging
   - Adjust based on traffic volume

6. **Review Sentry dashboard regularly**
   - Weekly error reviews
   - Track error trends
   - Prioritize fixes by severity

## Troubleshooting

### Errors not showing in Sentry

1. Check DSN is configured correctly
2. Verify environment variable is set
3. Check browser console for errors
4. Ensure Sentry SDK is initialized before app code
5. Check Sentry project is active (not archived)

### Too many errors in Sentry

1. Review beforeSend filter
2. Adjust sample rate down
3. Add more filtering rules
4. Check for error loops (errors triggering more errors)

### Performance issues

1. Reduce tracesSampleRate
2. Disable session replay in low-traffic environments
3. Use error sampling with beforeSend
4. Monitor Sentry SDK bundle size

## Environment Variables

### Backend
```bash
SENTRY_DSN=https://key@id.ingest.sentry.io/project
NODE_ENV=production|development|staging
```

### Frontend
```bash
VITE_SENTRY_DSN=https://key@id.ingest.sentry.io/project
VITE_API_URL=http://localhost:8000/api
```

## Resources

- [Sentry Docs](https://docs.sentry.io)
- [Sentry Node.js SDK](https://docs.sentry.io/platforms/node)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react)
- [Error Monitoring Best Practices](https://docs.sentry.io/product/best-practices)
