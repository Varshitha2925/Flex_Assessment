import { approveReview, unapproveReview, loadApprovals } from '../../_lib/approvals.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ status: 'error', message: 'Missing id' });

  if (req.method === 'POST') {
    const store = approveReview(String(id));
    return res.json({ approvedReviewIds: store.approvedReviewIds, persistence: 'ephemeral' });
  }
  if (req.method === 'DELETE') {
    const store = unapproveReview(String(id));
    return res.json({ approvedReviewIds: store.approvedReviewIds, persistence: 'ephemeral' });
  }
  return res.status(405).json({ status: 'error', message: 'Method not allowed' });
}
