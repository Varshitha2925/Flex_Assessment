import { approveReview } from '../../lib/approvals.js';

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "https://flex-frontend-five.vercel.app"); 
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
  
    // ✅ Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    
    const { id } = req.query;
    if (!id) return res.status(400).json({ status: 'error', message: 'Missing id' });

    const store = approveReview(String(id));
    res.status(200).json({ approvedReviewIds: store.approvedReviewIds, persistence: 'ephemeral' });
}
