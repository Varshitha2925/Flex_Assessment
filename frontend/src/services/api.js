// Hostaway integration temporarily removed to prevent proxy errors.
// Stubs return an empty dataset with stable shape.
export async function fetchHostawayReviews() {
  return {
    status: 'success',
    listings: {},
    meta: { listingCount: 0, reviewCount: 0 }
  };
}

export async function approveReview() { return { status: 'noop' }; }
export async function unapproveReview() { return { status: 'noop' }; }

export async function fetchGoogleReviews(placeId) {
  const url = placeId ? `/api/reviews/google?placeId=${encodeURIComponent(placeId)}` : '/api/reviews/google';
  try {
    const res = await fetch(url);
    const body = await res.json().catch(()=>({ status:'error', code:'PARSE', message:'Invalid JSON' }));
    if (!res.ok || body.status === 'error') {
      return { status: 'error', code: body.code || 'HTTP_'+res.status, message: body.message || 'Failed to load Google reviews' };
    }
    return body;
  } catch (e) {
    return { status: 'error', code: 'NETWORK', message: e.message };
  }
}
