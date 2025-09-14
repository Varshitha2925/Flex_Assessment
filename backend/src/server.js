import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { loadRawHostaway, normalizeHostawayReviews } from './normalize.js';

const app = express();
app.use(cors());
app.use(express.json());

// Placeholder in-memory approvals (will swap to simple JSON persistence)
const approvalsFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'mock', 'approvals.json');
if (!fs.existsSync(approvalsFile)) {
  fs.writeFileSync(approvalsFile, JSON.stringify({ approvedReviewIds: [] }, null, 2));
}

function loadApprovals() {
  return JSON.parse(fs.readFileSync(approvalsFile, 'utf-8'));
}

function saveApprovals(data) {
  fs.writeFileSync(approvalsFile, JSON.stringify(data, null, 2));
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/reviews/hostaway', (req, res) => {
  try {
    const raw = loadRawHostaway();
    const normalized = normalizeHostawayReviews(raw);
    const approvals = loadApprovals();
    // add approved flag to each review
    Object.values(normalized.listings).forEach(listing => {
      listing.reviews = listing.reviews.map(r => ({ ...r, approved: approvals.approvedReviewIds.includes(r.id) }));
    });
    res.json({ status: 'success', ...normalized });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// Google reviews stub (mirrors serverless version). For real integration add API key logic here.
app.get('/api/reviews/google', async (req, res) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = req.query.placeId || req.query.place_id;
  if (!apiKey) {
    return res.json({
      status: 'not-configured',
      message: 'Set GOOGLE_PLACES_API_KEY to enable live Google reviews',
      reviews: [],
      rating: null,
      userRatingsTotal: 0
    });
  }
  if (!placeId) return res.status(400).json({ status: 'error', code: 'MISSING_PLACE_ID', message: 'Missing placeId query parameter' });
  console.log('[express google] key len=%d start=%s placeId=%s', apiKey.length, apiKey.slice(0,5), placeId);
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=rating,user_ratings_total,reviews&key=${apiKey}`;
  let data;
  try {
    const resp = await fetch(url);
    data = await resp.json();
  } catch (networkErr) {
    return res.status(502).json({ status: 'error', code: 'NETWORK_ERROR', message: 'Failed to reach Google Places API', detail: networkErr.message });
  }
  if (!data || data.status !== 'OK') {
    return res.status(502).json({ status: 'error', code: data?.status || 'UNKNOWN', message: data?.error_message || 'Google Places API returned non-OK status' });
  }
  const result = data.result || {};
  const rating = result.rating ?? null;
  const userRatingsTotal = result.user_ratings_total ?? 0;
  const reviews = (result.reviews || []).map(r => ({
    id: String(r.time),
    author: r.author_name,
    rating: r.rating,
    time: r.time,
    text: (r.text || '').slice(0, 400)
  }));
  res.json({ status: 'success', mode: 'live', placeId, rating, userRatingsTotal, reviews });
});

app.post('/api/reviews/approvals/:id', (req, res) => {
  const { id } = req.params;
  const approvals = loadApprovals();
  if (!approvals.approvedReviewIds.includes(id)) {
    approvals.approvedReviewIds.push(id);
    saveApprovals(approvals);
  }
  res.json({ approvedReviewIds: approvals.approvedReviewIds });
});

app.delete('/api/reviews/approvals/:id', (req, res) => {
  const { id } = req.params;
  const approvals = loadApprovals();
  approvals.approvedReviewIds = approvals.approvedReviewIds.filter(rid => rid !== id);
  saveApprovals(approvals);
  res.json({ approvedReviewIds: approvals.approvedReviewIds });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`);
});
