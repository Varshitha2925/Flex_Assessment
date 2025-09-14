import { loadRawHostaway, normalizeHostawayReviews } from '../src/normalize.js';

describe('normalizeHostawayReviews', () => {
  it('produces expected structure', () => {
    const raw = loadRawHostaway();
    const normalized = normalizeHostawayReviews(raw);
    expect(normalized).toHaveProperty('listings');
    const listingNames = Object.keys(normalized.listings);
    expect(listingNames.length).toBeGreaterThan(0);
    const first = normalized.listings[listingNames[0]];
    expect(first).toHaveProperty('reviews');
    expect(first).toHaveProperty('aggregates');
    expect(first.aggregates).toHaveProperty('avgOverall');
  });
});
