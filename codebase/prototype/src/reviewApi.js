export async function reviewExplanation(payload, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl('/api/review-explanation', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    throw new Error(body?.message || 'Không thể kiểm tra bằng AI. Bạn hãy thử lại.');
  }
  return body;
}

