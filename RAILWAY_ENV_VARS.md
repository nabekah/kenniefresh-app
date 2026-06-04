# Railway Environment Variables — Kenniefresh.biz

Set these in your Railway project under **Variables** before deploying.

## Required Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | MySQL connection string (from Railway MySQL plugin) | `mysql://root:pass@host:3306/kenniefresh` |
| `JWT_SECRET` | Long random string for signing session cookies | `abc123...` (64+ chars) |
| `NODE_ENV` | Set to `production` | `production` |

## Optional Variables

| Variable | Description | Default |
|---|---|---|
| `UPLOAD_DIR` | Where product images are stored | `/app/uploads` |
| `PORT` | Server port (Railway sets this automatically) | `3000` |

## Generating a JWT Secret

Run this in your terminal to generate a secure random secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Railway MySQL Setup

1. In your Railway project, click **+ New** → **Database** → **MySQL**
2. Copy the `DATABASE_URL` from the MySQL service's **Variables** tab
3. Paste it into your app's Variables as `DATABASE_URL`

## First Login

After deploying, visit `https://your-app.railway.app/login` to create your admin account.
The first registered user is automatically made an **admin**.
