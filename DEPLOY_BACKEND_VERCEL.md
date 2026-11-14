# Deploying Nitsuh Cafe Backend (@cafe/api) to Vercel

This guide outlines how to deploy the NestJS API backend to Vercel as a Serverless function.

---

## Architecture Overview

- **Framework:** NestJS + Express (compiled for Vercel Serverless)
- **Database ORM:** Prisma with PostgreSQL (Neon, Supabase, AWS RDS, Railway, etc.)
- **Entrypoint:** [`apps/api/api/index.ts`](file:///home/nebiyu/Desktop/Noorcent/Nitsuh-ordering/apps/api/api/index.ts) routes incoming requests through the cached NestJS Express adapter [`apps/api/src/serverless.ts`](file:///home/nebiyu/Desktop/Noorcent/Nitsuh-ordering/apps/api/src/serverless.ts).
- **Vercel Routing:** [`apps/api/vercel.json`](file:///home/nebiyu/Desktop/Noorcent/Nitsuh-ordering/apps/api/vercel.json) rewrites all incoming routes to `/api`.

---

## Step-by-Step Vercel Setup

### 1. Create a New Project on Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: `RhizanTechnologies/nitsuh-ordering-system`.

### 2. Configure Project Settings
In the **Configure Project** screen:

1. **Project Name:** e.g. `nitsuh-api`
2. **Framework Preset:** Select **Other** (or leave as auto-detected).
3. **Root Directory:** Click **Edit** and select:
   ```
   apps/api
   ```
4. **Build and Output Settings:**
   - **Build Command:** Leave default (it automatically runs `pnpm run build`, which executes `prisma generate && nest build`).
   - **Install Command:** Leave default (Vercel automatically detects `pnpm`).

### 3. Add Environment Variables
Under the **Environment Variables** section, add:

| Variable | Description | Example / Recommended |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string with pooling | `postgres://user:pass@ep-xxx-pooler.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Secret key for JWT auth tokens | Any secure string |
| `NODE_ENV` | Environment mode | `production` |

> [!TIP]
> **Database Connection Pooling for Serverless:**
> When using serverless backends on Vercel, it is strongly recommended to use a managed connection pooler (such as **Neon** with `-pooler` or **Supabase** transaction pooler port `6543`), so serverless instances don't exhaust PostgreSQL connection limits.

### 4. Deploy
Click **Deploy**. Vercel will:
1. Install monorepo dependencies with `pnpm`.
2. Run `prisma generate` to generate the Prisma Client for the Vercel Linux environment.
3. Build the NestJS backend and bundle the serverless entrypoint `api/index.ts`.
4. Assign a production URL (e.g. `https://nitsuh-api.vercel.app`).

---

## Testing Your Deployed API

- **Root Health Check:**
  `GET https://nitsuh-api.vercel.app/`
  Returns:
  ```json
  {
    "status": "ok",
    "service": "Nitsuh Cafe API",
    "message": "☕ Nitsuh Cafe API is running on Vercel Serverless"
  }
  ```
- **Staff List:**
  `GET https://nitsuh-api.vercel.app/auth/staff`

---

## Connecting the Frontend (@cafe/web)

In your Frontend Vercel Project (or `.env.local` for local development):
Set the environment variable:
```env
NEXT_PUBLIC_API_URL="https://nitsuh-api.vercel.app"
```
Re-deploy the frontend, and all POS, Waiter Pad, and Owner Dashboard requests will automatically route to your Vercel-hosted backend.
