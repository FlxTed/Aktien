# Deployment guide (Vercel)

This app is ready to deploy on Vercel with PostgreSQL and optional cron for alerts.

## Deploy to Vercel (quick)

1. **Push your code** to GitHub (or GitLab/Bitbucket).
2. In [Vercel](https://vercel.com), click **Add New → Project** and import your repo.
3. **Environment variables**: In Project → Settings → Environment Variables, add:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `NEXTAUTH_URL` (e.g. `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET` (run `openssl rand -base64 32`)
   - `FINNHUB_API_KEY`
   - `OPENAI_API_KEY`
   - Optional: `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`
4. **Deploy**: Vercel builds on push. After first deploy, run **once** from your machine (with same `DATABASE_URL` in `.env`):
   ```bash
   npx prisma db push
   ```
   This applies the latest schema (holdings, cost basis, absolute alerts, etc.).
5. **Cron**: `vercel.json` includes a cron for `/api/cron/check-alerts`. To run every minute, change the schedule to `* * * * *` in `vercel.json` and set `CRON_SECRET` in Vercel.

---

## 1. Vercel project

1. Push the repo to GitHub/GitLab/Bitbucket.
2. In [Vercel](https://vercel.com), import the repository.
3. Framework preset: **Next.js** (auto-detected). Root directory: `./`. Build command: `npm run build` (default). Output: default.

## 2. Database (PostgreSQL)

Use a hosted Postgres (e.g. [Vercel Postgres](https://vercel.com/storage/postgres), [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app)).

- Create a database and copy the connection string.
- In Vercel project **Settings → Environment Variables**, add:
  - `DATABASE_URL` = your Postgres URL (e.g. `postgresql://user:pass@host:5432/db?sslmode=require`).

After first deploy, run migrations from your machine (or a one-off script):

```bash
npx prisma db push
# or
npx prisma migrate deploy
```

Use the same `DATABASE_URL` in your env when running Prisma.

## 3. Environment variables (Vercel)

In **Settings → Environment Variables** add (for Production, Preview, Development as needed):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | Full app URL, e.g. `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Yes | Random string, e.g. `openssl rand -base64 32` |
| `FINNHUB_API_KEY` | Yes | [Finnhub](https://finnhub.io) API key |
| `OPENAI_API_KEY` | Yes | OpenAI API key (for AI analysis) |
| `CRON_SECRET` | Optional | Secret for protecting `/api/cron/check-alerts` |
| `RESEND_API_KEY` | Optional | For email alerts (Resend) |
| `EMAIL_FROM` | Optional | Sender address for alerts |

## 4. Alert cron (Vercel Cron)

To run the alert checker every minute:

1. Create or edit `vercel.json` in the project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-alerts",
      "schedule": "* * * * *"
    }
  ]
}
```

2. In Vercel, **Settings → Environment Variables**, set `CRON_SECRET` to a long random string.
3. The Vercel Cron system will call your deployment with an internal auth; your route can also check `Authorization: Bearer <CRON_SECRET>` if you call it from an external cron.

If you use an external cron (e.g. cron-job.org), call:

```
GET https://your-app.vercel.app/api/cron/check-alerts
Authorization: Bearer YOUR_CRON_SECRET
```

## 5. Build and deploy

- Deploy from the Vercel dashboard (or push to the connected branch).
- Ensure `prisma generate` runs at build (it’s in `postinstall` in `package.json`).
- If you use Prisma Migrate, run `prisma migrate deploy` in a build step or a post-deploy script; for `prisma db push`, run it once from your machine after setting `DATABASE_URL`.

## 6. Post-deploy checks

- Visit `https://your-app.vercel.app` and register / log in.
- Add a stock and open the detail modal; run “Analyze with AI”.
- Set an alert; after a minute, check Vercel logs or your DB to confirm the cron ran (alerts are marked triggered when conditions are met).
- (Optional) Configure Resend and email sending in the alert checker script for real email notifications.

## 7. Optional: Web push

For browser push notifications on alert trigger, add a service worker and push subscription storage (e.g. in the User model or a separate table), and send pushes from the alert checker or a small push service. Not included in this baseline.

---

**Summary:** Connect repo → set `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `FINNHUB_API_KEY`, `OPENAI_API_KEY` → add `vercel.json` crons → deploy.
