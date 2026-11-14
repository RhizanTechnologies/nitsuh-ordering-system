# Deploying Nitsuh Cafe Web Frontend (@cafe/web) to Vercel

The frontend is built with **Next.js 14 (App Router)**, which is Vercel's native framework. It requires zero custom server adapters or configuration files to deploy on Vercel.

---

## Architecture Overview

- **Framework:** Next.js 14.2 (App Router) + React 18 + Tailwind CSS
- **API Connection:** Configured via `NEXT_PUBLIC_API_URL` in [`apps/web/lib/api.ts`](file:///home/nebiyu/Desktop/Noorcent/Nitsuh-ordering/apps/web/lib/api.ts)
- **Image Optimization:** Enabled with support for Unsplash and external secure CDNs in [`apps/web/next.config.mjs`](file:///home/nebiyu/Desktop/Noorcent/Nitsuh-ordering/apps/web/next.config.mjs)

---

## Step-by-Step Vercel Setup

### 1. Create a New Project on Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import the repository: `RhizanTechnologies/nitsuh-ordering-system`.

### 2. Configure Project Settings
In the **Configure Project** screen:

1. **Project Name:** `nitsuh-web` (or your preferred name)
2. **Framework Preset:** **Next.js** (detected automatically)
3. **Root Directory:** Click **Edit** and select:
   ```
   apps/web
   ```
4. **Build and Output Settings:** Leave default (Next.js automatically uses `next build`).

### 3. Set Environment Variable
Under the **Environment Variables** section, add:

| Variable | Value | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://nitsuh-api.vercel.app` | The public URL of your deployed backend API (without trailing slash) |

> [!TIP]
> If you haven't deployed the backend yet, deploy `apps/api` first to get its URL, or deploy the web frontend first and add `NEXT_PUBLIC_API_URL` under **Project Settings -> Environment Variables**, then trigger a redeploy.

### 4. Deploy
Click **Deploy**. Vercel will build all static pages and deploy the application to Vercel's global edge network.

---

## Summary of the Full Monorepo on Vercel

In Vercel, you will have **two distinct projects** linked to this single GitHub monorepo:

| Project | Root Directory | Framework Preset | Required Env Vars |
|---|---|---|---|
| **Backend API** (`nitsuh-api`) | `apps/api` | Other | `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production` |
| **Frontend Web** (`nitsuh-web`) | `apps/web` | Next.js | `NEXT_PUBLIC_API_URL` |
