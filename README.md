# AniBlossom — Static GitHub Pages Export

A beautiful anime streaming site built with Next.js, exported as a fully static site for GitHub Pages hosting.

## 🚀 Deploy to GitHub Pages

### Option A: Automatic (GitHub Actions)

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Under **Source**, select **GitHub Actions**
4. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys automatically

### Option B: Manual

```bash
npm install
npm run build
# The static site is in the `out/` folder
```

Upload the `out/` folder contents to any static host (Netlify, Vercel static, Cloudflare Pages, etc.).

## ⚙️ Configuration

| File | Purpose |
|------|---------|
| `src/lib/firebase.ts` | Firebase config (auth, Firestore) |
| `src/lib/api.ts` | Anime streaming API base URL |
| `next.config.mjs` | Static export settings |

The site uses:
- **AniList GraphQL API** for all anime metadata (trending, popular, search, details)
- **Firebase** for user auth and bookmarks
- **Miruro API** (`api.miruro.tv`) for episode/stream data

## 🛠️ Local Development

```bash
npm install
npm run dev
```

## 📁 Key Structure

```
src/
├── app/           # Next.js pages (App Router)
├── components/    # React components
├── query/         # Data fetching (AniList + API)
├── lib/           # Firebase, AniList client, cache
├── hooks/         # Custom React hooks
└── store/         # Zustand state (auth, anime)
```
