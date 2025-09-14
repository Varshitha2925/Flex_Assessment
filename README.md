# Flex Living Reviews Dashboard

## Overview
A full-stack prototype enabling managers to inspect property review performance, approve reviews for public display, and explore potential Google Reviews integration.

## Tech Stack
- Backend: Node.js + Express (ES Modules)
- Frontend: React + Vite + React Router
- Data: Live Hostaway Reviews API (no mock fallback), in-memory approvals (prototype only)
- Tooling: ESLint, Jest

## Key Design Decisions
- Normalization groups reviews by `listingName` to simplify aggregation and UI grouping.
- Aggregates precomputed server-side: average overall rating, per-category averages.
- Approval persistence via lightweight in-memory store (prototype only).
- API route `/api/reviews/hostaway` returns normalized structure quickly consumable by the dashboard.
- Simple CSS-in-JS inline styles for speed; can be replaced with a design system later.

## API Endpoints
- `GET /api/reviews/hostaway`
  - Response: `{ status: 'success', listings: { [listingName]: { listingName, reviews:[{ id, rating, channel, approved, ... }], aggregates:{ avgOverall, totalReviews, categories:{cat:{avg,count}} } } }, meta:{ listingCount, reviewCount, generatedAt } }`
- `POST /api/reviews/approvals/:id` – approve a review
- `DELETE /api/reviews/approvals/:id` – unapprove a review
- `GET /health` – service health check

## Running Locally
Install dependencies:
```bash
cd backend && npm install
cd ../frontend && npm install
```
Run backend (port 4000):
```bash
cd backend
npm run dev # listens on :4000
```
Run frontend (in new terminal):
```bash
cd frontend
npm run dev
```
Visit: http://localhost:5173

## Deploying on Vercel
This repository now includes serverless API functions under `api/` so you can deploy directly on Vercel:

1. Connect the repo in Vercel.
2. Ensure the root project is selected (monorepo workspaces are fine).
3. Vercel will run `npm install` then `npm run build` (builds the frontend into `frontend/dist`).
4. Static assets are served from that dist output; API routes are served from `/api/*` serverless functions.

Endpoint parity:
- `GET /api/reviews/hostaway` (serverless) – adds `persistence: 'ephemeral'` field.
- `POST /api/reviews/approvals/:id` – ephemeral approvals (in-memory only).
- `DELETE /api/reviews/approvals/:id` – ephemeral approvals.

Important: Approvals are NOT persistent in the serverless version (each cold start resets). For production, replace with a database (Redis, Postgres, DynamoDB, etc.) and adapt the functions in `api/_lib/approvals.js`.

### Local Serverless Simulation
You can still run the original Express backend for richer local dev. The serverless functions mirror its logic for deployment convenience.

## Persistence Notes
Because Vercel functions have read-only filesystem (except temporary `/tmp`) and no shared memory across regions/cold starts, file-based JSON storage is unsuitable in production. This prototype uses an in-memory global to illustrate the API shape only.


## Normalization Logic
See `backend/src/normalize.js`. Transforms raw Hostaway JSON into grouped listings with aggregate metrics for efficient frontend rendering.

## Google Reviews Exploration
Potential integration via Google Places API `Place Details` or `Place Reviews` (new APIs may restrict review access). Requires API key + Place ID per property. Not implemented in prototype. Consider caching responses and respecting quota/exponential backoff.

## Future Enhancements
- Add authentication for approvals
- More robust persistence (SQLite or Postgres)
- Trend charts (time-series graphs per category)
- Batch approval workflows
- Google Reviews merging & channel weighting

## Testing
Run backend tests:
```bash
cd backend
npm test
```

## License
Prototype – internal assessment use.

## Hostaway Live Reviews Integration (Strict Mode)

Live Hostaway API is now REQUIRED. Mock fallback removed.

Environment variables (root `.env` and Vercel project settings):
```
HOSTAWAY_ACCOUNT_ID=61148
HOSTAWAY_API_KEY=your_real_rotated_api_key_here
```

Behavior (strict):
- If credentials missing -> 400 `{ status: 'error', message: 'MISSING_CREDENTIALS' }`.
- If upstream non-200 -> 502 `{ status: 'error', message: 'UPSTREAM_STATUS_<code>' }`.
- On success -> `{ status:'success', mode:'live', listings, meta }`.

No more `mode: mock` responses.

Troubleshooting quick table:
- 400 MISSING_CREDENTIALS: add env vars & restart / redeploy.
- 502 UPSTREAM_STATUS_401: invalid/expired API key.
- 502 UPSTREAM_STATUS_5xx: Hostaway server issue; retry later.

Security:
- Do not commit the API key.
- Rotate if exposed.

### Express Strict Endpoint (This Repo Backend/server.js)

If you use the local Express backend (`backend/server.js`), the route now operates in strict mode without any mock fallback:

`GET http://localhost:3001/api/reviews/hostaway`

Success (even if zero reviews):
```
{
  "status": "success",
  "count": 0,
  "reviews": []
}
```

Upstream non-OK (example 403):
```
{
  "status": "error",
  "message": "Upstream Hostaway error",
  "upstreamStatus": 403
}
```

Network / fetch failure:
```
{
  "status": "error",
  "message": "Failed to fetch Hostaway reviews",
  "detail": "<error message>"
}
```

Returned review objects shape (per requirement):
```
{
  listingName: string,
  guestName: string | null,
  submittedAt: ISODate | null,
  type: 'host-to-guest' | 'guest-to-host',
  channel: string,
  rating: number | null,
  reviewCategory: [{ category: string, rating: number }],
  publicReview: string
}
```
