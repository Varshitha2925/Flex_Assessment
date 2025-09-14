import { normalizeHostawayReviews, loadRawHostaway } from '../_lib/normalize.js';
import { loadApprovals } from '../_lib/approvals.js';

export default function handler(req, res) {
  // Basic CORS (adjust origin policy as needed)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  try {
    const raw = loadRawHostaway();
    const normalized = normalizeHostawayReviews(raw);
    const approvals = loadApprovals();
    Object.values(normalized.listings).forEach(listing => {
      listing.reviews = listing.reviews.map(r => ({ ...r, approved: approvals.approvedReviewIds.includes(r.id) }));
    });
    res.json({ status: 'success', ...normalized, persistence: 'ephemeral' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
}
