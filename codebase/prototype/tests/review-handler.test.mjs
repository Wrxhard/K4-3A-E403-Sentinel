import assert from 'node:assert/strict';
import test from 'node:test';
import { handleReviewRequest } from '../server/review-handler.js';
import { ReviewServiceError } from '../server/openai-reviewer.js';
import { exercises } from '../src/lesson.js';
import { validReview } from './review-fixtures.mjs';

function jsonRequest(body, method = 'POST') {
  return new Request('http://localhost/api/review-explanation', {
    method,
    headers: { 'content-type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });
}

const payload = {
  checkpointId: 'attention',
  answer: 1,
  explanation: 'Attention dùng ngữ cảnh để đánh giá mức liên quan và kết hợp thông tin.',
};

function dependencies(review = async () => validReview) {
  return { exercises, reviewer: { review } };
}

test('rejects methods other than POST', async () => {
  const response = await handleReviewRequest(jsonRequest(payload, 'GET'), dependencies());
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
});

test('rejects malformed JSON', async () => {
  const request = new Request('http://localhost/api/review-explanation', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{bad',
  });
  const response = await handleReviewRequest(request, dependencies());
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'invalid_json');
});

test('unknown checkpoint is rejected before AI review', async () => {
  const response = await handleReviewRequest(
    jsonRequest({ ...payload, checkpointId: 'fake' }),
    dependencies(async () => {
      throw new Error('AI must not be called');
    }),
  );
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: 'unknown_checkpoint',
    message: 'Không tìm thấy checkpoint.',
  });
});

test('rejects empty and oversized explanations', async () => {
  for (const explanation of ['  ', 'a'.repeat(1201)]) {
    const response = await handleReviewRequest(
      jsonRequest({ ...payload, explanation }),
      dependencies(),
    );
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'invalid_request');
  }
});

test('returns the live AI review', async () => {
  let actualInput;
  const response = await handleReviewRequest(
    jsonRequest(payload),
    dependencies(async (input) => {
      actualInput = input;
      return validReview;
    }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), validReview);
  assert.equal(actualInput.checkpointId, 'attention');
  assert.equal(actualInput.teacher.sources[0].id, 'T06-130');
  assert.equal(actualInput.teacher.correctAnswer, 1);
});

test('maps reviewer error categories to safe HTTP responses', async () => {
  const cases = [
    ['missing_api_key', 503],
    ['upstream_error', 503],
    ['invalid_model_output', 502],
    ['logging_error', 500],
  ];
  for (const [code, status] of cases) {
    const response = await handleReviewRequest(
      jsonRequest(payload),
      dependencies(async () => {
        throw new ReviewServiceError(code, 'internal detail', { retryable: code === 'upstream_error' });
      }),
    );
    const body = await response.json();
    assert.equal(response.status, status);
    assert.equal(body.error, code);
    assert.notEqual(body.message, 'internal detail');
  }
});

