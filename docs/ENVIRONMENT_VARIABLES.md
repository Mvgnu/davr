# Environment Variables Documentation

## Overview

This document describes all environment variables used in the DAVR platform. Variables are organized by category and include descriptions, requirements, and example values.

---

## Required Variables

These variables **must** be set for the application to function.

### Database

#### `DATABASE_URL`
**Required**: Yes
**Type**: Connection String
**Description**: PostgreSQL database connection URL

**Format**:
```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

**Example**:
```env
# Development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/recycling_db

# Production (with SSL)
DATABASE_URL=postgresql://user:password@db.example.com:5432/davr_production?sslmode=require
```

**Note**: For Neon, Supabase, or other PostgreSQL providers, use their provided connection string.

---

### Authentication

####  `NEXTAUTH_SECRET`
**Required**: Yes
**Type**: Secret String (minimum 32 characters)
**Description**: Secret key for NextAuth.js session encryption and CSRF token signing

**Generate**:
```bash
openssl rand -base64 32
```

**Example**:
```env
NEXTAUTH_SECRET=your-secret-key-change-in-production-minimum-32-chars
```

**Security**: Never commit this to version control. Use different secrets for dev/staging/production.

#### `NEXTAUTH_URL`
**Required**: Yes
**Type**: URL
**Description**: The canonical URL of your application

**Example**:
```env
# Development
NEXTAUTH_URL=http://localhost:3000

# Production
NEXTAUTH_URL=https://davr.example.com
```

**Note**: Must match the domain where your app is hosted.

---

### Application

#### `NODE_ENV`
**Required**: Yes
**Type**: Enum (`development` | `production` | `test`)
**Description**: Node environment mode

**Example**:
```env
# Development
NODE_ENV=development

# Production
NODE_ENV=production
```

**Impact**:
- Enables/disables debug logging
- Controls cookie security settings
- Affects error message verbosity

#### `NEXT_PUBLIC_APP_URL`
**Required**: Yes
**Type**: URL
**Description**: Public-facing application URL (accessible from client-side)

**Example**:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## Optional Variables

These variables enhance functionality but are not required for basic operation.

### Security

#### `CSRF_SECRET`
**Required**: No (falls back to `NEXTAUTH_SECRET`)
**Type**: Secret String
**Description**: Dedicated secret for CSRF token signing

**Example**:
```env
CSRF_SECRET=different-secret-from-nextauth-for-extra-security
```

**Best Practice**: Use a separate secret from `NEXTAUTH_SECRET` for defense in depth.

---

### Rate Limiting

#### `UPSTASH_REDIS_REST_URL`
**Required**: No (uses in-memory store if not set)
**Type**: URL
**Description**: Upstash Redis REST API URL for distributed rate limiting

**Example**:
```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
```

**When to use**: Production deployments with multiple server instances.

#### `UPSTASH_REDIS_REST_TOKEN`
**Required**: No
**Type**: Secret Token
**Description**: Upstash Redis authentication token

**Example**:
```env
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

**Note**: Required if `UPSTASH_REDIS_REST_URL` is set.

---

### Billing & Premium

#### `STRIPE_SECRET_KEY`
**Required**: Yes (for premium upgrades)
**Type**: Secret String
**Description**: Server-side Stripe API key used to create Checkout Sessions.

**Example**:
```env
STRIPE_SECRET_KEY=sk_live_123
```

**Security**: Never expose via `NEXT_PUBLIC_` prefix.

#### `STRIPE_WEBHOOK_SECRET`
**Required**: Yes (for premium webhook processing)
**Type**: Secret String
**Description**: Stripe webhook signing secret used to validate subscription lifecycle callbacks.

**Example**:
```env
STRIPE_WEBHOOK_SECRET=whsec_123abc
```

**Security**: Store in server-side secrets manager only.

#### `STRIPE_PRICE_ID_PREMIUM`
**Required**: Yes (when Premium tier is available)
**Type**: String
**Description**: Stripe Price ID for the Premium subscription tier.

**Example**:
```env
STRIPE_PRICE_ID_PREMIUM=price_123premium
```

#### `STRIPE_PRICE_ID_CONCIERGE`
**Required**: Yes (when Concierge tier is available)
**Type**: String
**Description**: Stripe Price ID for the Concierge subscription tier.

**Example**:
```env
STRIPE_PRICE_ID_CONCIERGE=price_456concierge
```

#### `PREMIUM_STRIPE_TRIAL_DAYS`
**Required**: No (defaults to 14)
**Type**: Number
**Description**: Trial period length applied to Stripe subscriptions started via `START_TRIAL`.

**Example**:
```env
PREMIUM_STRIPE_TRIAL_DAYS=14
```

---

### Email (Future)

#### `SMTP_HOST`
**Required**: No
**Type**: Hostname
**Description**: SMTP server for sending emails

**Example**:
```env
SMTP_HOST=smtp.sendgrid.net
```

#### `SMTP_PORT`
**Required**: No
**Type**: Number
**Default**: 587
**Description**: SMTP server port

**Example**:
```env
SMTP_PORT=587
```

#### `SMTP_USER`
**Required**: No
**Type**: String
**Description**: SMTP authentication username

#### `SMTP_PASSWORD`
**Required**: No
**Type**: Secret String
**Description**: SMTP authentication password

#### `SMTP_FROM`
**Required**: No
**Type**: Email Address
**Description**: Default "from" email address

**Example**:
```env
SMTP_FROM=noreply@davr.example.com
```

---

### File Storage

#### `AWS_S3_BUCKET`
**Required**: No
**Type**: String
**Description**: AWS S3 bucket name for file uploads

**Example**:
```env
AWS_S3_BUCKET=davr-uploads-production
```

#### `AWS_S3_REGION`
**Required**: No
**Type**: AWS Region
**Description**: AWS region for S3 bucket

**Example**:
```env
AWS_S3_REGION=eu-central-1
```

#### `AWS_ACCESS_KEY_ID`
**Required**: No
**Type**: Secret String
**Description**: AWS IAM access key

#### `AWS_SECRET_ACCESS_KEY`
**Required**: No
**Type**: Secret String
**Description**: AWS IAM secret key

---

### Analytics & Monitoring

#### `NEXT_PUBLIC_GA_ID`
**Required**: No
**Type**: Google Analytics ID
**Description**: Google Analytics measurement ID

**Example**:
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### `SENTRY_DSN`
**Required**: No
**Type**: URL
**Description**: Sentry error tracking DSN

**Example**:
```env
SENTRY_DSN=https://abc123@sentry.io/123456
```

---

## Environment-Specific Configurations

### Development (.env.local)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/recycling_db

# Auth
NEXTAUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000

# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: CSRF (uses NEXTAUTH_SECRET if not set)
# CSRF_SECRET=dev-csrf-secret
```

### Production (.env.production)

```env
# Database (use production credentials)
DATABASE_URL=postgresql://user:password@prod-db.example.com:5432/davr?sslmode=require

# Auth (use strong, unique secrets)
NEXTAUTH_SECRET=<GENERATE_WITH_openssl_rand_-base64_32>
NEXTAUTH_URL=https://davr.example.com
CSRF_SECRET=<GENERATE_WITH_openssl_rand_-base64_32>

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://davr.example.com

# Rate Limiting (recommended for production)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<your-smtp-password>
SMTP_FROM=noreply@davr.example.com

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=https://abc@sentry.io/123456
```

---

## Security Best Practices

### DO

✅ Use different secrets for each environment
✅ Generate secrets with `openssl rand -base64 32`
✅ Store secrets in secure vaults (AWS Secrets Manager, Vercel Env Vars)
✅ Rotate secrets regularly (quarterly recommended)
✅ Use `.env.local` for local development (gitignored)
✅ Document required vs optional variables
✅ Validate environment variables on startup

### DON'T

❌ Commit `.env` files to git
❌ Use weak or default secrets in production
❌ Share secrets in plaintext (Slack, email, etc.)
❌ Reuse secrets across environments
❌ Expose secret variables with `NEXT_PUBLIC_` prefix
❌ Hard-code secrets in application code

---

## Validation

### Runtime Validation

The application validates required environment variables on startup:

```typescript
// lib/env.ts (to be created)
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  // Optional variables
  CSRF_SECRET: z.string().min(32).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

### Startup Check

Add to `next.config.js`:

```javascript
// Validate environment variables at build time
const { env } = require('./lib/env');

console.log('✅ Environment variables validated');
```

---

## Deployment Platforms

### Vercel

1. Go to Project Settings → Environment Variables
2. Add variables for Production, Preview, Development
3. Redeploy to apply changes

**CLI**:
```bash
vercel env add NEXTAUTH_SECRET production
vercel env add DATABASE_URL production
```

### Docker

**Dockerfile**:
```dockerfile
# Don't include secrets in image
ENV NODE_ENV=production
```

**docker-compose.yml**:
```yaml
services:
  app:
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    env_file:
      - .env.production
```

### AWS / Cloud Platforms

Use platform-specific secret management:
- **AWS**: AWS Secrets Manager + Parameter Store
- **GCP**: Secret Manager
- **Azure**: Key Vault

---

## Troubleshooting

### Common Issues

#### "Cannot connect to database"

**Check**:
1. `DATABASE_URL` format is correct
2. Database server is running
3. Network allows connection
4. Credentials are valid

#### "Invalid or missing NEXTAUTH_SECRET"

**Solutions**:
1. Generate new secret: `openssl rand -base64 32`
2. Ensure secret is at least 32 characters
3. Check `.env.local` file exists and is loaded

#### "CSRF token validation failed"

**Check**:
1. `CSRF_SECRET` or `NEXTAUTH_SECRET` is set
2. Same secret used across all server instances
3. Cookies are enabled in browser

---

## Migration Guide

### Adding New Variables

1. **Add to this documentation**
2. **Add to `.env.example`** (with placeholder values)
3. **Update validation schema** (if required)
4. **Notify team** of new requirements
5. **Update deployment configs** (Vercel, Docker, etc.)

### Updating Existing Variables

1. **Update documentation** with new format/requirements
2. **Provide migration guide** if format changes
3. **Support old format** temporarily (backwards compatibility)
4. **Deprecation notice** if removing variable

---

## Example Files

### `.env.example`

```env
# Required Variables
DATABASE_URL=postgresql://user:password@localhost:5432/database
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional Variables
CSRF_SECRET=different-secret-for-csrf
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Email (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-user
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@example.com
```

### `.env.local` (Development)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/recycling_db
NEXTAUTH_SECRET=dev-secret-not-for-production
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Support

For environment variable issues:

1. Check this documentation
2. Verify `.env.local` exists and is correct
3. Restart dev server after changes
4. Check Next.js environment variable docs
5. Open issue in project repository

---

**Document Version:** 1.0
**Last Updated:** 2025-10-16
**Author:** Claude Code
**Status:** ✅ Complete
