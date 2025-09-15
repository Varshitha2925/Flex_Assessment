import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { loadRawHostaway, normalizeHostawayReviews } from './lib/normalize.js';
import { loadApprovals, approveReview, unapproveReview } from './lib/approvals.js';

const app = express();
app.use(cors());
app.use(express.json());

function buildLiveUrl() {
    const accountId = process.env.HOSTAWAY_ACCOUNT_ID;
    if (!accountId) return null;
    const base = 'https://api.hostaway.com/v1/reviews';
    return `${base}?accountId=${encodeURIComponent(accountId)}&limit=100&page=1`;
}

async function fetchLiveReviewsStrict() {
    const accountId = process.env.HOSTAWAY_ACCOUNT_ID;
    const apiKey = process.env.HOSTAWAY_API_KEY;
    if (!accountId || !apiKey) throw new Error('MISSING_CREDENTIALS');
    const url = buildLiveUrl();
    const resp = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-Account-Id': accountId,
            'Accept': 'application/json'
        }
    });
    const text = await resp.text();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!resp.ok) {
        const e = new Error('UPSTREAM_STATUS_' + resp.status);
        e.detail = json;
        throw e;
    }
    const reviews = Array.isArray(json.result) ? json.result : (Array.isArray(json.reviews) ? json.reviews : []);
    return { reviews, mode: 'live', endpoint: url };
}

app.get('/api/reviews/hostaway', async (req, res) => {
    const approvals = loadApprovals();
    let payload;
    try {
        payload = await fetchLiveReviewsStrict();
    } catch (e) {
        if (e.message === 'MISSING_CREDENTIALS' || e.message.startsWith('UPSTREAM_STATUS_')) {
            // Fallback to mock
            const mock = loadRawHostaway();
            const normalizedMock = normalizeHostawayReviews(mock);
            Object.values(normalizedMock.listings).forEach(listing => {
                listing.reviews = listing.reviews.map(r => ({ ...r, approved: approvals.approvedReviewIds.includes(r.id) }));
            });
            return res.json({ status: 'success', mode: 'mock', endpoint: 'mock:hostawayReviews.json', ...normalizedMock, persistence: 'ephemeral' });
        }
        return res.status(500).json({ status: 'error', message: e.message, detail: e.detail });
    }
    const normalized = normalizeHostawayReviews(payload.reviews);
    Object.values(normalized.listings).forEach(listing => {
        listing.reviews = listing.reviews.map(r => ({ ...r, approved: approvals.approvedReviewIds.includes(r.id) }));
    });
    res.json({ status: 'success', mode: payload.mode, endpoint: payload.endpoint, ...normalized, persistence: 'ephemeral' });
});

// Google reviews route (strict live-only)
app.get('/api/reviews/google', async (req, res) => {
    const PLACE_IDS = [
        'ChIJN1t_tDeuEmsRUsoyG83frY4', // Sydney sample
        'ChIJE9on3F3HwoAR9AhGJW_fL-I', // Los Angeles City Hall
        'ChIJIQBpAG2ahYAR_6128GcTUEo', // San Francisco sample
        'ChIJOwg_06VPwokRYv534QaPC8g', // New York City
        'ChIJzxcfI6qAa4cR1jaKJ_j0jhE'  // Denver
    ];
    const PLACE_ID = PLACE_IDS[Math.floor(Math.random() * PLACE_IDS.length)];
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
        return res.status(400).json({ status: 'error', code: 'NO_API_KEY', message: 'GOOGLE_PLACES_API_KEY missing' });
    }
    const fields = ['rating','user_ratings_total','reviews'].join(',');
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(PLACE_ID)}&fields=${fields}&key=${apiKey}`;
    let json;
    try {
        const r = await fetch(url);
        const text = await r.text();
        try {
            json = JSON.parse(text);
        } catch (parseErr) {
            return res.status(502).json({ status: 'error', code: 'PARSE', message: 'Invalid JSON from Google Places', raw: text.slice(0,400) });
        }
        if (!r.ok) {
            return res.status(r.status).json({ status: 'error', code: 'HTTP_'+r.status, message: 'Non-200 from Google Places', upstream: json });
        }
        if (json.status !== 'OK') {
            return res.status(502).json({ status: 'error', code: json.status || 'GOOGLE_ERROR', message: json.error_message || 'Google Places returned non-OK status', upstream: json });
        }
    } catch (e) {
        return res.status(502).json({ status: 'error', code: 'NETWORK', message: 'Network error contacting Google Places', detail: e.message });
    }
    const result = json.result || {};
    const rating = result.rating ?? null;
    const userRatingsTotal = result.user_ratings_total ?? 0;
    const reviews = (result.reviews || []).map(rv => ({
        id: String(rv.time),
        author: rv.author_name,
        rating: rv.rating,
        time: rv.time,
        text: (rv.text || '').slice(0, 400)
    }));
    return res.json({ status: 'success', mode: 'live', placeId: PLACE_ID, rating, userRatingsTotal, reviews });
});

app.post('/api/reviews/approvals/:id', (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ status: 'error', message: 'Missing id' });
    const store = approveReview(String(id));
    res.json({ approvedReviewIds: store.approvedReviewIds, persistence: 'ephemeral' });
});

app.delete('/api/reviews/approvals/:id', (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ status: 'error', message: 'Missing id' });
    const store = unapproveReview(String(id));
    res.json({ approvedReviewIds: store.approvedReviewIds, persistence: 'ephemeral' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`[backend] listening on :${PORT}`));
