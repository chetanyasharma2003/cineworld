# 🚨 SECRETS POLICY - ABSOLUTE RULE

**NEVER commit secrets to GitHub. EVER.**

---

## ❌ FORBIDDEN - NEVER DO THIS

```bash
# ❌ DON'T commit API keys
STRIPE_KEY=sk_live_abc123xyz
GROQ_API_KEY=gsk_abc123
TMDB_API_KEY=abc123def456

# ❌ DON'T commit database credentials
DATABASE_URL=mongodb+srv://user:password@cluster.net/db
MONGO_USER=admin
MONGO_PASS=mypassword123

# ❌ DON'T commit email passwords
EMAIL_PASS=myGmailPassword123

# ❌ DON'T commit JWT secrets
JWT_SECRET=my_super_secret_key_12345678

# ❌ DON'T commit AWS/cloud credentials
AWS_SECRET_ACCESS_KEY=aws...
AZURE_KEY=azure...

# ❌ DON'T commit OAuth tokens
GITHUB_TOKEN=ghp_...
GOOGLE_OAUTH_SECRET=...
```

---

## ✅ CORRECT WAY - ALWAYS DO THIS

### In Code (Commit This)
```bash
# ✅ Use environment variables
const apiKey = process.env.GROQ_API_KEY;
const dbUrl = process.env.DATABASE_URL;

# ✅ Use placeholders in docs
DATABASE_URL=<your_mongodb_connection_string>
API_KEY=<your_api_key>
STRIPE_KEY=<your_stripe_secret>
```

### In `.env.example` (Commit This)
```env
# ✅ Template only - NO real values
DATABASE_URL=<your_connection_string>
JWT_SECRET=<generate 32+ char random string>
GROQ_API_KEY=<get from console.groq.com>
STRIPE_SECRET_KEY=<get from Stripe dashboard>
EMAIL_PASS=<Gmail app password>
```

### In Dashboards (NEVER Commit)
```
Render Dashboard → Environment Variables → Store here
Vercel Dashboard → Environment Variables → Store here
MongoDB Atlas → Connection Strings → Store here
Stripe Dashboard → API Keys → Store here
Gmail → App Passwords → Store here
```

---

## 📋 BEFORE COMMITTING - CHECKLIST

Before every `git commit`:

```bash
# 1. Check for secrets
git diff --staged | grep -i "secret\|password\|key\|token\|credential"

# 2. If anything found - DO NOT COMMIT
# 3. Remove it and use env var instead

# 4. Check .env is gitignored
cat .gitignore | grep "^\.env"
# Should show: .env

# 5. Check .env.example has NO real values
cat .env.example | grep -E "sk_|pk_|mongodb\+srv|password|secret"
# Should return NOTHING

# 6. Only then commit
git commit -m "message"
```

---

## 🔐 IF SECRETS GET COMMITTED (Emergency)

**If you accidentally commit a secret:**

1. **IMMEDIATELY REVOKE THE SECRET**
   ```bash
   # If MongoDB:
   - Go to MongoDB Atlas → Security → Database Access
   - Delete compromised user
   - Create new user with new password
   
   # If Stripe:
   - Go to Stripe Dashboard
   - Revoke exposed API key
   - Generate new key
   
   # If GitHub token:
   - Go to GitHub Settings → Developer settings
   - Delete compromised token
   - Generate new token
   
   # If API key:
   - Go to service dashboard
   - Deactivate exposed key
   - Generate new key
   ```

2. **REMOVE FROM GIT HISTORY**
   ```bash
   # This is permanent - no going back!
   git filter-branch --tree-filter 'rm .env' HEAD
   git push origin main --force
   # ⚠️ Force push is ONLY for this emergency!
   ```

3. **NOTIFY TEAM** - Tell everyone to pull new changes

---

## 🛡️ AUTOMATED PROTECTION

### GitHub Secret Scanning
- GitHub automatically scans for exposed secrets
- ⚠️ If found, secret is already exposed to internet
- Must revoke immediately

### Pre-commit Hook (Optional)
```bash
# Add to .git/hooks/pre-commit to auto-block secrets
#!/bin/bash
if git diff --cached | grep -E "sk_|pk_|mongodb\+srv|password|secret"; then
    echo "🚨 BLOCKED: Secrets detected in commit!"
    exit 1
fi
```

---

## 📝 GIT COMMANDS THAT ARE SAFE

```bash
✅ git add .           # Safe if .gitignore is set
✅ git commit -m "msg" # Safe if no secrets staged
✅ git push origin main # Safe if commit is clean
✅ git log             # Safe - just shows commit history
✅ git status          # Safe - shows file status
```

---

## 🚫 GIT COMMANDS THAT CAN EXPOSE SECRETS

```bash
❌ git add .env        # NEVER - Would commit secrets!
❌ git add .env.prod   # NEVER - Would commit secrets!
❌ git commit -m "API_KEY=sk_..." # NEVER - Message shows key!
❌ git push --force    # Only in emergencies with revoked secrets!
```

---

## ✅ SAFE WORKFLOW EXAMPLE

```bash
# 1. Create .env with real secrets (NOT committed)
echo "DATABASE_URL=mongodb+srv://user:pass@cluster.net/db" > .env

# 2. Create .env.example with PLACEHOLDERS (committed)
echo "DATABASE_URL=<your_connection_string>" > .env.example

# 3. Add to .gitignore (ensure it exists)
# .env is already in .gitignore ✅

# 4. Develop with real secrets locally
npm start

# 5. Commit only safe files
git add .env.example README.md src/
git commit -m "Add features"
git push origin main

# 6. In deployment (Render/Vercel):
# - Use env var dashboards to set real secrets
# - NEVER in code files
```

---

## 🎯 REMEMBER

| What | Where | Status |
|------|-------|--------|
| Real secrets | Render/Vercel env vars | ✅ Safe |
| Real secrets | Local `.env` file | ✅ Safe (not committed) |
| Placeholder values | `.env.example` | ✅ Safe (can commit) |
| Placeholder values | Docs/README | ✅ Safe (can commit) |
| Real secrets | GitHub commits | ❌ NEVER! |
| Real secrets | GitHub PRs | ❌ NEVER! |
| Real secrets | GitHub issues | ❌ NEVER! |
| Real secrets | Anywhere public | ❌ NEVER! |

---

## 🆘 IF YOU'RE NOT SURE

**ALWAYS ASK:**
- Is this a real secret/credential/API key?
- Could it be used to access production systems?
- Would exposing it compromise security?

**If YES to any:** 
- ❌ DO NOT COMMIT IT
- ✅ USE ENVIRONMENT VARIABLE INSTEAD

---

**GOLDEN RULE**: 
# 🔐 **SECRETS = ENV VARS ONLY**
# 🚫 **NEVER IN CODE, NEVER IN GIT, NEVER ANYWHERE PUBLIC**

---

**Status**: STRICT POLICY IN EFFECT  
**Enforcement**: 100% - NO EXCEPTIONS  
**Team Agreement**: SIGNED SEALED DELIVERED ✅
