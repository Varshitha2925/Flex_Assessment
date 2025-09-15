import 'dotenv/config';
import fetch from 'node-fetch';
import { loadRawHostaway, normalizeHostawayReviews } from '../../lib/normalize.js';
import { loadApprovals } from '../../lib/approvals.js';

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "https://flex-frontend-five.vercel.app"); 
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
  
    // ✅ Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    const approvals = loadApprovals();
    let payload;

    const accountId = process.env.HOSTAWAY_ACCOUNT_ID;
    const apiKey = process.env.HOSTAWAY_API_KEY;

    function buildLiveUrl() {
        if (!accountId) return null;
        const base = 'https://api.hostaway.com/v1/reviews';
        return `${base}?accountId=${encodeURIComponent(accountId)}&limit=100&page=1`;
    }

    async function fetchLiveReviewsStrict() {
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

    try {
        payload = await fetchLiveReviewsStrict();
    } catch (e) {
        if (e.message === 'MISSING_CREDENTIALS' || e.message.startsWith('UPSTREAM_STATUS_')) {
            const mock = loadRawHostaway();
            const normalizedMock = normalizeHostawayReviews(mock);
            Object.values(normalizedMock.listings).forEach(listing => {
                listing.reviews = listing.reviews.map(r => ({ ...r, approved: approvals.approvedReviewIds.includes(r.id) }));
            });
            return res.status(200).json({ status: 'success', mode: 'mock', endpoint: 'mock:hostawayReviews.json', ...normalizedMock, persistence: 'ephemeral' });
        }
        return res.status(500).json({ status: 'error', message: e.message, detail: e.detail });
    }

    const normalized = normalizeHostawayReviews(payload.reviews);
    Object.values(normalized.listings).forEach(listing => {
        listing.reviews = listing.reviews.map(r => ({ ...r, approved: approvals.approvedReviewIds.includes(r.id) }));
    });
    res.status(200).json({ status: 'success', mode: payload.mode, endpoint: payload.endpoint, ...normalized, persistence: 'ephemeral' });
}
