# HackShastra Live Quiz ⚡

A Kahoot-style live quiz platform for HackShastra hackathon mentee sessions. Players scan a QR code on the big screen with their phones, pick an optional nickname, get an avatar instantly, and compete through 20 coding & hackathon trivia questions with real-time sync, speed-decay scoring, streaks, and an animated podium reveal.

Designed with a clean, high-performance **HackShastra Minimalist** aesthetic using **League Spartan** (display/numbers), **Inter** (body), and `#C41111` Crimson branding.

---

## Architecture & Neon Serverless Backend

- **Database**: [Neon](https://neon.tech) Serverless PostgreSQL with connection pooling.
- **Serverless API**: Vercel Serverless Functions (`/api/*.ts`) handling room creation, player joins, answer evaluation with server timestamps (anti-cheat), and real-time state polling.
- **Local Dev Server**: Vite dev server with custom SSR API middleware so that `npm run dev` directly executes the `/api` endpoints with your Neon database without needing extra proxy setups.
- **Fallback / Demo Mode**: Can run in offline/demo mode via browser `BroadcastChannel` if `VITE_USE_DB` is not set.

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Run DB schema setup if using a new database
node --env-file=.env.local scripts/setup-db.mjs

# 3. Start local dev server
npm run dev
```

Open `http://localhost:5173`:
- **Host Screen**: `http://localhost:5173/?host` (big screen / projector)
- **Player Screen**: Scan the QR code or visit `http://localhost:5173/?join=ROOMCODE` (mobile / participant)

---

## Deploying to Vercel (Production)

### Method 1: Vercel CLI (Fastest)

```bash
npm install -g vercel
vercel
```
When prompted:
1. Link to your Vercel account.
2. Accept the default project settings (framework: Vite).
3. Once deployed, add Environment Variables in Vercel Dashboard (or via CLI):
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_XQLsv6Ipz1ir@ep-young-cherry-b5gzds1s-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   - `VITE_USE_DB`: `true`
4. Deploy to production:
   ```bash
   vercel --prod
   ```

### Method 2: Git Repository / GitHub Import

1. Push your repository to GitHub / GitLab:
   ```bash
   git add .
   git commit -m "feat: HackShastra live quiz with Neon serverless backend"
   git push origin main
   ```
2. In [Vercel Dashboard](https://vercel.com/new):
   - Click **"Add New"** → **"Project"**.
   - Import your repository.
   - Framework preset: **Vite**.
   - Under **Environment Variables**, add:
     - `DATABASE_URL` = `postgresql://neondb_owner:npg_XQLsv6Ipz1ir@ep-young-cherry-b5gzds1s-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
     - `VITE_USE_DB` = `true`
   - Click **Deploy**.

---

## Environment Variables Reference

| Variable | Target | Description |
|---|---|---|
| `DATABASE_URL` | **Server-side only** | Neon PostgreSQL connection string (pooled connection). Never exposed to browser. |
| `VITE_USE_DB` | **Frontend (Vite)** | Set to `true` to enable Neon DB mode. If empty/false, app runs in local Demo Mode. |

---

## Verification & Typecheck

```bash
# Type check and build bundle
npm run build
```
Build runs `tsc -b && vite build` and generates the optimized production bundle in `/dist`.
