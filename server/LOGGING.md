# CineWorld Logging Framework

## Overview

CineWorld uses **Winston** for structured logging. This document explains the logging framework, how to use it, and how it's configured.

## Features

### 1. Structured Logging
Logs are structured with metadata, making them parseable and queryable:

```javascript
logger.info("API request completed", {
  statusCode: 200,
  duration: 145,
  userId: "user_123",
});
```

Output (dev):
```
23:45:12.345 [info] [user:user_123 145ms] API request completed
```

### 2. Multiple Log Levels
- **debug**: Detailed diagnostic info (dev only)
- **info**: General informational messages
- **warn**: Warning messages about potential issues
- **error**: Error messages with stack traces

### 3. Request Context Tracking
Every log within a request automatically includes:
- Request ID (`req.requestId`)
- User ID (`req.user._id`)
- HTTP method and path
- Duration (for response logs)

### 4. Environment-Specific Formatting
- **Development**: Colorized console output with readable timestamps
- **Production**: JSON format for structured parsing, file-based persistence

### 5. File Logging (Production)
In production, logs are written to:
- `logs/combined.log` — all logs
- `logs/errors.log` — errors only
- `logs/exceptions.log` — uncaught exceptions
- `logs/rejections.log` — unhandled promise rejections

Max file size: 10MB with 5-10 rolling files retained.

## Usage

### Basic Logging

```javascript
import logger from "./utils/logger.js";

// Info level
logger.info("Server started", { port: 8000 });

// Warning level
logger.warn("High memory usage", { percentage: 85 });

// Error level
logger.error("Database connection failed", {
  error: err.message,
  code: err.code,
  retry: true,
});

// Debug level
logger.debug("Cache hit", { key: "movie:12345", ttl: 3600 });
```

### With Request Context

Within Express route handlers, use `req.logger` to automatically include request context:

```javascript
router.get("/api/movies/:id", (req, res) => {
  req.logger.info("Fetching movie", { movieId: req.params.id });

  try {
    const movie = await Movie.findById(req.params.id);
    req.logger.info("Movie retrieved", { title: movie.title });
    res.json(movie);
  } catch (err) {
    req.logger.error("Failed to fetch movie", {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Failed to fetch movie" });
  }
});
```

The logger will automatically include:
```json
{
  "requestId": "a1b2c3d4",
  "userId": "user_123",
  "method": "GET",
  "path": "/api/movies/12345",
  "movieId": "12345",
  "title": "Inception"
}
```

### Error Handling

Always log errors with full context:

```javascript
try {
  await performAsyncOperation();
} catch (err) {
  logger.error("Operation failed", {
    error: err.message,
    stack: err.stack,
    retryable: true,
    context: "userData",
  });
}
```

## Configuration

### Winston Configuration
Located in: `server/utils/logger.js`

### Log Levels (by environment)
- **Development**: `debug` and above
- **Production**: `info` and above

### Transports
- **Console**: Always enabled for real-time monitoring
- **File** (prod only): `logs/combined.log`, `logs/errors.log`

### Format
Each log entry includes:
- **Timestamp**: ISO format in production, HH:mm:ss in development
- **Level**: debug, info, warn, error
- **Service**: "cineworld-api"
- **Request Context**: ID, user, method, path (when applicable)
- **Metadata**: Custom key-value pairs

## Best Practices

1. **Use appropriate log levels**
   - `debug`: Development/diagnostic info
   - `info`: Normal operations (server start, request completion)
   - `warn`: Recoverable issues (cache miss, retry)
   - `error`: Failures requiring action (DB error, API failure)

2. **Include context metadata**
   ```javascript
   logger.info("User login", {
     userId: user._id,
     email: user.email,
     method: "password", // or "google", "github"
     ip: req.ip,
   });
   ```

3. **Log at request boundaries**
   ```javascript
   logger.info("Request started", { endpoint: req.path });
   // ... process request
   logger.info("Request completed", { duration: elapsedMs, status: res.statusCode });
   ```

4. **Never log sensitive data**
   - Tokens, passwords, API keys
   - Full email addresses (hash or mask)
   - Credit card numbers
   - Personal health info

5. **Use structured fields for filtering**
   ```javascript
   // Good — queryable by userId
   logger.warn("Rate limit exceeded", { userId: user._id });

   // Avoid — buried in message
   logger.warn(`Rate limit exceeded for user ${user._id}`);
   ```

## Monitoring & Debugging

### View Live Logs
**Development**:
```bash
cd server && npm run dev
```
Logs appear in terminal with colors.

**Production**:
```bash
tail -f logs/combined.log      # All logs
tail -f logs/errors.log        # Errors only
grep "userId:user_123" logs/combined.log  # Filter by user
```

### Parse JSON Logs (Production)
```bash
# Pretty-print JSON logs
cat logs/combined.log | jq '.'

# Filter by level
cat logs/combined.log | jq 'select(.level == "error")'

# Filter by request ID
cat logs/combined.log | jq 'select(.requestId == "a1b2c3d4")'
```

### Key Metrics from Logs
- Request latency: `duration` field
- Error rate: Count `level == "error"` entries
- User activity: Filter by `userId`
- API performance: Group by `path` and calculate avg `duration`

## Migration Guide

### From console.log to logger

**Before**:
```javascript
console.log("Server started on port 8000");
```

**After**:
```javascript
logger.info("Server started", { port: 8000 });
```

### In Exception Handlers

**Before**:
```javascript
catch (err) {
  console.error("Error:", err.message);
}
```

**After**:
```javascript
catch (err) {
  logger.error("Operation failed", {
    error: err.message,
    stack: err.stack,
  });
}
```

## Performance Considerations

- Winston is async by default (non-blocking)
- Log levels are checked before formatting (debug logs skipped in production)
- File writes are buffered and flushed periodically
- Old log files are automatically rotated to prevent disk bloat

## Troubleshooting

### Logs not appearing in files (production)
1. Check `logs/` directory exists and is writable: `ls -la logs/`
2. Verify `NODE_ENV=production` is set: `echo $NODE_ENV`
3. Check disk space: `df -h`

### Too many log files
- Old files are automatically deleted (max 5-10 per type)
- Manual cleanup: `rm logs/*.log.N`

### Performance issues
- Reduce log level in production from `debug` to `info`
- Check file I/O: `iotop` or `iostat`
- Consider centralized logging (e.g., ELK stack, DataDog) for high volume

## Integration with Error Monitoring

Winston integrates with Sentry for error tracking:
```javascript
// In index.js
import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

logger.error("Critical error", { error: err.message, stack: err.stack });
Sentry.captureException(err);  // Also send to Sentry
```

## Related Files

- **Logger configuration**: `server/utils/logger.js`
- **Request logging middleware**: Lines 152-172 in `server/index.js`
- **Request context middleware**: `server/utils/logger.js` → `withRequestContext()`
- **Error handling**: Lines 254-258 in `server/index.js`

## Next Steps

- Set up centralized logging (DataDog, ELK, Loggly) for production
- Create log dashboards for monitoring key metrics
- Set up alerts for critical errors
- Archive old logs to S3/cloud storage for long-term retention
