# BudgetFlow Deployment Guide

BudgetFlow is a full-stack application with a React frontend and Express backend. This guide covers deployment on **Cloudflare Pages**, **Render**, and the **Manus built-in hosting** (recommended).

---

## Option 1: Manus Built-in Hosting (Recommended) ⭐

**Advantages:**
- Zero configuration required
- Custom domain support included
- Automatic SSL/TLS certificates
- Built-in database and authentication
- Optimized for this exact stack

**Steps:**
1. Click the **Publish** button in the Manus Management UI
2. Configure your custom domain in Settings → Domains
3. Your app is live immediately

---

## Option 2: Render.com (Full-Stack Deployment)

Render is ideal for BudgetFlow because it supports both frontend and backend on a single service.

### Prerequisites
- Render account (free tier available)
- GitHub repository (already set up)
- Environment variables ready

### Deployment Steps

#### Step 1: Create a New Web Service on Render

1. Go to [render.com](https://render.com) and sign in
2. Click **New +** → **Web Service**
3. Select **Build and deploy from a Git repository**
4. Connect your GitHub account and select **Pen-123/BudgetFlow**
5. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | budgetflow |
| **Environment** | Node |
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `pnpm start` |
| **Instance Type** | Free (or Starter for production) |

#### Step 2: Add Environment Variables

In the Render dashboard, go to **Environment** and add:

```
DATABASE_URL=your_mysql_connection_string
JWT_SECRET=your_jwt_secret_key
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OWNER_OPEN_ID=your_owner_open_id
OWNER_NAME=Your Name
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

#### Step 3: Configure Port

The application uses `process.env.PORT` (defaults to 3000). Render automatically assigns a port via the `PORT` environment variable, which is already handled by the template.

#### Step 4: Deploy

1. Click **Create Web Service**
2. Render will automatically deploy from your GitHub repository
3. Your app will be available at `https://budgetflow.onrender.com` (or your custom domain)

#### Step 5: Set Custom Domain (Optional)

1. Go to your service settings
2. Click **Custom Domain**
3. Add your domain and follow DNS instructions

### Database Setup on Render

If you don't have a MySQL database yet:

1. In Render dashboard, click **New +** → **MySQL**
2. Configure the database
3. Copy the connection string to `DATABASE_URL`

---

## Option 3: Cloudflare Pages + Cloudflare Workers (Advanced)

**Note:** Cloudflare Pages is primarily for static sites. For BudgetFlow's full-stack needs, you'll need **Cloudflare Workers** for the backend.

### Option 3A: Cloudflare Pages (Frontend Only)

This deploys only the React frontend; you'll need a separate backend.

#### Step 1: Build the Frontend

```bash
cd client
pnpm build
```

#### Step 2: Deploy to Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select **Pages** → **Create a project**
3. Connect your GitHub repository (Pen-123/BudgetFlow)
4. Configure build settings:

| Setting | Value |
|---------|-------|
| **Framework** | Vite |
| **Build command** | `pnpm build` |
| **Build output directory** | `client/dist` |
| **Root directory** | `client` |

#### Step 3: Add Environment Variables

In Cloudflare Pages settings, add:

```
VITE_APP_ID=your_manus_app_id
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

#### Step 4: Deploy Backend to Cloudflare Workers

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Create a `wrangler.toml` in the project root:

```toml
name = "budgetflow-api"
main = "dist/index.js"
compatibility_date = "2024-01-01"

[env.production]
vars = { ENVIRONMENT = "production" }

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "budgetflow-storage"

[[d1_databases]]
binding = "DB"
database_name = "budgetflow"
database_id = "your_database_id"
```

3. Build and deploy:

```bash
pnpm build
wrangler deploy
```

**Limitations:** Cloudflare Workers has a 10-second timeout limit, which may be too short for LLM vision processing. This approach is **not recommended** for BudgetFlow.

---

## Option 3B: Cloudflare Pages + External Backend (Recommended if using Cloudflare)

Deploy frontend on Cloudflare Pages and backend on Render or another service.

### Frontend Deployment
Follow **Option 3A** above.

### Backend Deployment
Follow **Option 2 (Render)** for the backend, then update your frontend environment variables to point to the backend URL.

---

## Comparison Table

| Feature | Manus | Render | Cloudflare Pages |
|---------|-------|--------|------------------|
| **Full-Stack Support** | ✅ | ✅ | ❌ (needs Workers) |
| **Database Included** | ✅ | ✅ (add-on) | ❌ |
| **LLM Processing** | ✅ | ✅ | ⚠️ (10s timeout) |
| **Custom Domain** | ✅ | ✅ | ✅ |
| **Free Tier** | ✅ | ✅ | ✅ |
| **Setup Time** | 2 min | 10 min | 15 min |
| **Recommended** | ⭐⭐⭐ | ⭐⭐ | ⚠️ |

---

## Troubleshooting

### "Build failed" on Render
- Ensure `pnpm` is installed: `pnpm install`
- Check that `package.json` scripts are correct
- Verify all environment variables are set

### "Cannot find module" errors
- Run `pnpm install` locally first
- Check that all dependencies are in `package.json`
- Ensure `node_modules` is in `.gitignore`

### Database connection errors
- Verify `DATABASE_URL` format: `mysql://user:password@host:port/database`
- Ensure database is accessible from your deployment region
- Check firewall rules allow connections from your deployment service

### LLM vision processing timeout
- Increase timeout on Render (default is sufficient)
- Avoid using Cloudflare Workers (10s limit)
- Consider async processing for large images

### OAuth redirect URI mismatch
- Update OAuth redirect URIs in Manus dashboard to match your deployment domain
- Format: `https://yourdomain.com/api/oauth/callback`

---

## Production Checklist

Before deploying to production:

- [ ] All environment variables are set correctly
- [ ] Database is backed up and secured
- [ ] HTTPS is enabled (automatic on all platforms)
- [ ] Custom domain is configured
- [ ] OAuth redirect URIs are updated
- [ ] Tests pass locally: `pnpm test`
- [ ] Build succeeds locally: `pnpm build`
- [ ] Environment-specific configs are correct
- [ ] Monitoring/logging is configured
- [ ] Rate limiting is enabled on API routes

---

## Quick Start Commands

### Local Development
```bash
pnpm install
pnpm dev
```

### Build for Production
```bash
pnpm build
```

### Run Production Build Locally
```bash
pnpm start
```

### Run Tests
```bash
pnpm test
```

---

## Support

- **Manus Issues:** Contact support@manus.im
- **Render Issues:** https://render.com/docs
- **Cloudflare Issues:** https://developers.cloudflare.com

For BudgetFlow-specific questions, refer to the README.md in the GitHub repository.
