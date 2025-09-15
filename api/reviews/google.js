import 'dotenv/config';

const PLACE_IDS = [
  'ChIJN1t_tDeuEmsRUsoyG83frY4', // Sydney sample
  'ChIJE9on3F3HwoAR9AhGJW_fL-I', // Los Angeles City Hall
  'ChIJIQBpAG2ahYAR_6128GcTUEo', // San Francisco
  'ChIJOwg_06VPwokRYv534QaPC8g', // New York City
  'ChIJzxcfI6qAa4cR1jaKJ_j0jhE'  // Denver
];

function pickPlaceId() {
  return PLACE_IDS[Math.floor(Math.random() * PLACE_IDS.length)];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const PLACE_ID = pickPlaceId();
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
}
