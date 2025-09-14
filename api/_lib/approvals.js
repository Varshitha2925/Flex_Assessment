
const GLOBAL_KEY = '__FLEX_APPROVALS__';

function ensureStore() {
  if (!globalThis[GLOBAL_KEY]) {
    globalThis[GLOBAL_KEY] = { approvedReviewIds: [] };
  }
  return globalThis[GLOBAL_KEY];
}

export function loadApprovals() {
  return ensureStore();
}

export function approveReview(id) {
  const store = ensureStore();
  if (!store.approvedReviewIds.includes(id)) store.approvedReviewIds.push(id);
  return store;
}

export function unapproveReview(id) {
  const store = ensureStore();
  store.approvedReviewIds = store.approvedReviewIds.filter(r => r !== id);
  return store;
}
