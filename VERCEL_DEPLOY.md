# Deploy Aktien on Vercel

Follow these steps to publish the app on Vercel.

## 1. Use a PostgreSQL database

Vercel's serverless environment does not support SQLite. Use one of:

- **[Neon](https://neon.tech)** (free tier, recommended): sign up, create a project, copy the connection string.
- **Vercel Postgres**: in your Vercel project, Storage → Create Database → Postgres, then connect to get `DATABASE_URL`.

You need a connection string like:

`postgresql://user:password@host/dbname?sslmode=require`

## 2. Push the repo to GitHub

If you haven’t already:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 3. Import the project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. Click **Add New** → **Project**.
3. Import your GitHub repository.
4. Leave **Framework Preset** as Next.js and **Root Directory** as `.` (or your app root).

## 4. Set environment variables

In the Vercel project, go to **Settings** → **Environment Variables** and add:

| Name | Value | Notes |
|------|--------|--------|
| `DATABASE_URL` | `postgresql://...` | From Neon or Vercel Postgres |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your Vercel app URL (update after first deploy) |
| `NEXTAUTH_SECRET` | Random string | e.g. `openssl rand -base64 32` |
| `FINNHUB_API_KEY` | Your key | [Finnhub](https://finnhub.io) |
| `OPENAI_API_KEY` | Your key | For AI portfolio analysis (optional) |
| `CRON_SECRET` | Random string | Optional; secures `/api/cron/check-alerts` |

Apply to **Production** (and Preview if you want).

## 5. Deploy

1. Click **Deploy**. Vercel will run `prisma generate`, `prisma migrate deploy`, and `next build`.
2. After the first deploy, set **NEXTAUTH_URL** to your real URL (e.g. `https://your-project.vercel.app`) and redeploy if needed.

## 6. Cron (alerts)

The app has a cron that hits `/api/cron/check-alerts` every minute (see `vercel.json`). It only runs on **Vercel Pro**. If you use it:

- Set `CRON_SECRET` in env.
- In Vercel: **Settings** → **Cron Jobs** and confirm the job is listed.

## Local development with PostgreSQL

- **Neon**: create a second branch for dev and use its connection string in `.env` as `DATABASE_URL`.
- Run once: `npx prisma migrate deploy` (or `npx prisma db push`).
- Then: `npm run dev`.

Your app will be live at `https://your-project.vercel.app`.
