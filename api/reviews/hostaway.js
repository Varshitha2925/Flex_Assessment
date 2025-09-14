import { normalizeHostawayReviews } from '../_lib/normalize.js';
import { loadApprovals } from '../_lib/approvals.js';

async function fetchLiveStrict() {
  const accountId = process.env.HOSTAWAY_ACCOUNT_ID;
  const apiKey = process.env.HOSTAWAY_API_KEY;
  if (!accountId || !apiKey) throw new Error('MISSING_CREDENTIALS');
  const url = process.env.HOSTAWAY_REVIEWS_URL || `https://api.hostaway.com/v1/reviews?accountId=${encodeURIComponent(accountId)}`;
  const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' } });
  if (!resp.ok) throw new Error('UPSTREAM_STATUS_' + resp.status);
  const json = await resp.json();
  const reviews = Array.isArray(json.result) ? json.result : json.reviews || [];
  return { reviews, endpoint: url };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  try {
    const { reviews, endpoint } = await fetchLiveStrict();
    const normalized = normalizeHostawayReviews(reviews);
    const approvals = loadApprovals();
    Object.values(normalized.listings).forEach(listing => {
      listing.reviews = listing.reviews.map(r => ({ ...r, approved: approvals.approvedReviewIds.includes(r.id) }));
    });
    res.json({ status:'success', mode:'live', endpoint, ...normalized, persistence:'ephemeral' });
  } catch (e) {
    let statusCode = 500; let code = 'INTERNAL_ERROR';
    if (e.message === 'MISSING_CREDENTIALS') { statusCode = 400; code = 'MISSING_CREDENTIALS'; }
    else if (e.message.startsWith('UPSTREAM_STATUS_')) { statusCode = 502; code = e.message; }
    res.status(statusCode).json({ status:'error', code, message:e.message });
  }
}
