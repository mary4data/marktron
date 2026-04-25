# marktron — closed-loop AI visibility agent for early-stage brands.

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Local setup

1. Clone repo
2. `npm install`
3. Fill `.env.local` (see ENV VARS section below)
4. Authenticate with Google Cloud: `gcloud auth application-default login --no-launch-browser`
5. `npm run dev`
6. Open `http://localhost:3000/api/seed` once to load demo data
7. Open `/brand/nothing-phone` and click "Run marktron Cycle"

## ENV VARS

```
PEEC_AI_API_KEY=          # peec.ai dashboard — mock fallback if empty
TAVILY_API_KEY=           # app.tavily.com — mock fallback if empty
GEMINI_API_KEY=           # aistudio.google.com — mock fallback if empty
ENTIRE_API_KEY=           # entire.io dashboard — mock fallback if empty
FIREBASE_PROJECT_ID=      # your Google Cloud project ID (required)
FIREBASE_CLIENT_EMAIL=    # leave empty when using ADC (gcloud auth)
FIREBASE_PRIVATE_KEY=     # leave empty when using ADC (gcloud auth)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

All APIs except Firestore have mock fallbacks — the demo works without real keys.

## Database

Uses **Google Cloud Firestore** (Native mode) via the Firebase Admin SDK.

**Local dev:** authenticates via Application Default Credentials (ADC) — no key file needed:
```bash
gcloud auth application-default login --no-launch-browser
gcloud auth application-default set-quota-project YOUR_PROJECT_ID
```

**Production (Vercel):** set `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` from a service account key, or use Workload Identity Federation.

Collections created automatically on first seed:
- `brands` — tracked brands and their competitors
- `visibility_snapshots` — Peec AI score snapshots per cycle
- `competitor_sources` — Tavily results per gap topic
- `content_drafts` — Gemini-generated content pending approval

## Tech stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Google Cloud Firestore (Native mode) via firebase-admin
- **APIs:**
  - [Peec AI](https://peec.ai) — brand AI visibility data
  - [Tavily](https://tavily.com) — competitor source discovery
  - [Google Gemini](https://aistudio.google.com) (`gemini-2.5-flash`) — content generation
  - [Entire](https://entire.io) — human-in-the-loop approval

## Demo brands

| Brand | Competitors |
|-------|------------|
| Nothing Phone | Apple, Samsung |
| Attio | Salesforce, HubSpot |
| BYD | Tesla, Legacy Automakers |

## The loop

```
measure (Peec) → find (Tavily) → draft (Gemini) → approve (Entire) → re-measure
```

## Deployment

Deploy to Vercel — set all env vars in Project Settings → Environment Variables.

```bash
vercel deploy
```

## MIT License

Copyright 2026 marktron contributors
