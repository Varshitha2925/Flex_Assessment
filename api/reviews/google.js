import 'dotenv/config';
// Google Reviews endpoint (strict mode).
// Returns explicit errors (no stub fallback). Caller must handle status==='error'.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY; // not used yet, placeholder
  if (apiKey) {
    console.log('[google endpoint] API key detected (len=%d, starts=%s...)', apiKey.length, apiKey.slice(0,5));
  } else {
    console.log('[google endpoint] No API key found in process.env');
  }
  const placeId = req.query.placeId || req.query.place_id; // allow either

  if (!apiKey) {
    return res.json({
      status: 'not-configured',
      message: 'Set GOOGLE_PLACES_API_KEY to enable live Google reviews',
      reviews: [],
      rating: null,
      userRatingsTotal: 0
    });
  }

  if (!placeId) {
    return res.status(400).json({ status: 'error', message: 'Missing placeId query parameter' });
  }

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
  return res.json({ status: 'success', mode: 'live', placeId, rating, userRatingsTotal, reviews });
}
