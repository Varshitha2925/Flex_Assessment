// Serverless normalization utilities (extracted from backend/src/normalize.js)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export function loadRawHostaway() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const candidatePaths = [
    path.join(__dirname, '..', '..', '..', 'backend', 'mock', 'hostawayReviews.json'),
    path.join(__dirname, '..', 'mock', 'hostawayReviews.json')
  ];
  const file = candidatePaths.find(p => fs.existsSync(p));
  if (!file) { console.warn('[mock] serverless hostawayReviews.json missing'); return []; }
  let text='';
  try { text = fs.readFileSync(file, 'utf-8'); } catch (e) { console.warn('[mock] read error', e.message); return []; }
  if (!text.trim()) { console.warn('[mock] empty hostawayReviews.json'); return []; }
  try {
    const raw = JSON.parse(text);
    if (Array.isArray(raw.result)) return raw.result;
    if (Array.isArray(raw)) return raw;
    return [];
  } catch (e) {
    console.warn('[mock] parse error', e.message); return []; }
}

export function normalizeHostawayReviews(reviews) {
  const listings = {};
  for (const r of reviews) {
    if (!r.listingName) continue;
    const listing = listings[r.listingName] || { listingName: r.listingName, reviews: [], aggregates: { avgOverall: null, totalReviews: 0, categories: {} } };

    const categories = {};
    if (Array.isArray(r.reviewCategory)) {
      for (const c of r.reviewCategory) {
        if (!c || typeof c.rating !== 'number') continue;
        categories[c.category] = c.rating;
      }
    }

    listing.reviews.push({
      id: String(r.id),
      type: r.type,
      status: r.status,
      channel: r.channel || 'unknown',
      rating: typeof r.rating === 'number' ? r.rating : null,
      submittedAt: r.submittedAt,
      guestName: r.guestName,
      publicReview: r.publicReview,
      categories
    });

    listings[r.listingName] = listing;
  }

  Object.values(listings).forEach(listing => {
    const overallRatings = listing.reviews.map(r => r.rating).filter(n => typeof n === 'number');
    const avgOverall = overallRatings.length ? +(overallRatings.reduce((a,b)=>a+b,0)/overallRatings.length).toFixed(2) : null;
    listing.aggregates.totalReviews = listing.reviews.length;
    listing.aggregates.avgOverall = avgOverall;
    const catAccum = {};
    listing.reviews.forEach(r => {
      Object.entries(r.categories).forEach(([cat, val]) => {
        const agg = catAccum[cat] || { sum: 0, count: 0 };
        agg.sum += val;
        agg.count += 1;
        catAccum[cat] = agg;
      });
    });
    listing.aggregates.categories = Object.fromEntries(
      Object.entries(catAccum).map(([cat, { sum, count }]) => [cat, { avg: +(sum / count).toFixed(2), count }])
    );
  });

  const listingCount = Object.keys(listings).length;
  const reviewCount = Object.values(listings).reduce((acc, l) => acc + l.reviews.length, 0);
  return { listings, meta: { generatedAt: new Date().toISOString(), listingCount, reviewCount } };
}
