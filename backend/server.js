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
