# Deploying Kenniefresh.biz to Railway

## Prerequisites

- A [Railway](https://railway.app) account (free tier available)
- A [GitHub](https://github.com) account (to push the code)

---

## Step 1 — Export Code to GitHub

1. In the Manus Management UI, click the **⋯ More** button (top-right)
2. Select **GitHub** → **Export to GitHub**
3. Choose a repository name (e.g., `kenniefresh-app`) and click **Export**
4. Your code is now on GitHub

---

## Step 2 — Create a Railway Project

1. Go to [railway.app](https://railway.app) and log in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `kenniefresh-app` repository
4. Railway will auto-detect the `nixpacks.toml` and start building

---

## Step 3 — Add a MySQL Database

1. In your Railway project, click **+ New** → **Database** → **MySQL**
2. Wait for the database to provision
3. Click the MySQL service → **Variables** tab
4. Copy the `DATABASE_URL` value

---

## Step 4 — Set Environment Variables

In your Railway app service, go to **Variables** and add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Paste the MySQL URL from Step 3 |
| `JWT_SECRET` | A long random string (see below) |
| `NODE_ENV` | `production` |
| `UPLOAD_DIR` | `/app/uploads` |

**Generate a JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Step 5 — Deploy

1. Railway will automatically redeploy when you push to GitHub
2. Wait for the build to complete (2–3 minutes)
3. Click **View Logs** to monitor the deployment
4. Once live, click the generated URL (e.g., `kenniefresh-app.up.railway.app`)

---

## Step 6 — Create Your Admin Account

1. Visit `https://your-app.up.railway.app/login`
2. Click **Register** and create your account
3. The **first registered user** is automatically made an **admin**
4. Log in and you will see the full admin dashboard

---

## Step 7 — Custom Domain (kenniefresh.biz)

1. In Railway, go to your app service → **Settings** → **Domains**
2. Click **Add Custom Domain** → enter `kenniefresh.biz`
3. Railway will give you a CNAME record to add at your domain registrar
4. Add the CNAME record and wait for DNS propagation (up to 24 hours)

---

## Important Notes

- **Product images** uploaded via the admin panel are stored in `/app/uploads` on Railway's filesystem. These are **ephemeral** — they will be lost on redeploy. For permanent image storage, consider upgrading to a Railway Volume or using an external image host.
- **Inventory data** (products, sales, expenses) is stored in **localStorage** on each user's browser. To migrate to a full database-backed system, let your developer know.
- The **daily 8 AM stock report** runs automatically via node-cron inside the server process.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Build fails | Check that `pnpm-lock.yaml` is committed to GitHub |
| Database connection error | Verify `DATABASE_URL` is set correctly in Railway Variables |
| App shows blank page | Check Railway logs for server errors |
| Images not showing | Re-upload product images after each redeploy |
