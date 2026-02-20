# How to Add DATABASE_URL – Step by Step

**What is DATABASE_URL?**  
It’s a connection string that tells your app how to reach a **PostgreSQL database**. Your app uses it to save and load stocks and alerts. Without it, the site works but nothing is saved.

**You need:** A free PostgreSQL database. This guide uses **Neon** (free, no credit card).

---

## Step 1: Create a free database at Neon

1. Open: **https://neon.tech**
2. Click **Sign up** (top right).  
   You can use **GitHub** or **Email**.
3. After sign-up, you’re on the **Neon Console**.
4. Click **New Project**.
5. Set:
   - **Project name:** e.g. `aktien`
   - **Region:** pick one close to you (e.g. EU Central, US East).
6. Click **Create project**.

---

## Step 2: Copy your connection string

1. On the project page you’ll see **Connection string**.
2. Make sure the tab is **Pooled connection** (recommended).
3. Copy the full string. It looks like:
   ```text
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep this secret (it contains your password). Don’t share it or put it in public code.

---

## Step 3: Add DATABASE_URL in Vercel

1. Open: **https://vercel.com** and log in.
2. Open your **Aktien** project (sitegen-studio/aktien).
3. Go to **Settings** (top menu).
4. In the left sidebar click **Environment Variables**.
5. Under **Key** type: `DATABASE_URL`
6. Under **Value** paste the connection string you copied from Neon (the whole line starting with `postgresql://...`).
7. Select **Production** (and **Preview** if you use preview deployments).
8. Click **Save**.

---

## Step 4: Redeploy so the app uses the new database

1. In the same Vercel project, open the **Deployments** tab.
2. Find the latest deployment.
3. Click the **three dots (⋮)** on the right.
4. Click **Redeploy**.
5. Confirm. Wait until the deployment is **Ready**.

---

## Step 5: Check that it works

1. Open your site: **https://aktien-six.vercel.app**
2. Add a stock (e.g. AAPL). It should add without error.
3. Refresh the page – the stock should still be there.  
   If it is, DATABASE_URL is set correctly and the app is using the database.

---

## Troubleshooting

| Problem | What to do |
|--------|------------|
| “Database not configured” banner still shows | Wait 1–2 minutes after redeploy, then hard-refresh (Ctrl+F5). If it’s still there, check that the variable name is exactly `DATABASE_URL` and that you redeployed **after** saving the variable. |
| Connection string doesn’t work | In Neon, make sure you copied the **Pooled** connection string and that it includes `?sslmode=require` at the end. |
| Add stock still fails | In Vercel → Settings → Environment Variables, confirm `DATABASE_URL` is there for **Production**, then redeploy again. |

---

## Summary

1. **Neon.tech** → Sign up → New Project → create project.  
2. Copy the **Pooled** connection string.  
3. **Vercel** → your project → Settings → Environment Variables → add `DATABASE_URL` = (paste string) → Save.  
4. **Deployments** → Redeploy latest.  
5. Open the site and add a stock to confirm it’s saved.

After this, your app will save stocks and alerts in your own PostgreSQL database.
