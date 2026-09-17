import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewExplanation } from '../src/reviewApi.js';
import { validReview } from './review-fixtures.mjs';

const payload = {
  checkpointId: 'attention',
  answer: 1,
  explanation: 'Attention dùng ngữ cảnh.',
};

test('returns the parsed AI review from the live endpoint', async () => {
  const review = await reviewExplanation(payload, async (url, options) => {
    assert.equal(url, '/api/review-explanation');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), payload);
    return new Response(JSON.stringify(validReview), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  assert.deepEqual(review, validReview);
});

test('surfaces the server message when review fails', async () => {
  await assert.rejects(
    reviewExplanation(
      payload,
      async () =>
        new Response(JSON.stringify({ message: 'OpenAI đang bận.' }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        }),
    ),
    /OpenAI đang bận/,
  );
});

test('uses a generic retry message when the server body is unreadable', async () => {
  await assert.rejects(
    reviewExplanation(payload, async () => new Response('<html>bad gateway</html>', { status: 502 })),
    /thử lại/i,
  );
});
