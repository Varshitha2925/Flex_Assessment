let __loggedHostawayOnce = false;

export async function fetchHostawayReviews() {
  const res = await fetch('/api/reviews/hostaway');
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  if (!res.ok) {
    const code = body?.code || ('HTTP_' + res.status);
    return { status: 'error', code, message: body?.message || 'Failed to load reviews', details: body };
  }
  if (!__loggedHostawayOnce) {
    console.log('[DEBUG] Hostaway reviews payload:', body);
    __loggedHostawayOnce = true;
  }
  return body;
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
