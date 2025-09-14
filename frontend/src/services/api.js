export async function fetchHostawayReviews() {
  const res = await fetch('/api/reviews/hostaway');
  if (!res.ok) throw new Error('Failed to load reviews');
  return res.json();
}

export async function approveReview(id) {
  const res = await fetch(`/api/reviews/approvals/${id}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve review');
  return res.json();
}

export async function unapproveReview(id) {
  const res = await fetch(`/api/reviews/approvals/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to unapprove review');
  return res.json();
}

export async function fetchGoogleReviews(placeId) {
  const url = placeId ? `/api/reviews/google?placeId=${encodeURIComponent(placeId)}` : '/api/reviews/google';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load Google reviews');
  return res.json();
}
