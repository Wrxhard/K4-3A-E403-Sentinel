import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewJsonSchema, validateReview, validateReviewInput } from '../server/review-contract.js';
import { validInput, validReview } from './review-fixtures.mjs';

test('review schema rejects extra model-controlled fields', () => {
  assert.equal(reviewJsonSchema.additionalProperties, false);
  assert.deepEqual(reviewJsonSchema.required, [
    'verdict',
    'decision_code',
    'passed',
    'misconceptions',
    'missing_ideas',
    'feedback',
    'next_question',
    'source_ids',
  ]);
});

test('rejects a decision code that disagrees with the verdict', () => {
  assert.throws(
    () => validateReview({ ...validReview, decision_code: 'UNRELATED_REQUEST' }, ['T06-130']),
    /decision code/i,
  );
});

test('rejects an empty learner explanation', () => {
  assert.throws(() => validateReviewInput(validInput({ explanation: '  ' }), ['attention']), /giải thích/i);
});

test('rejects an oversized learner explanation', () => {
  assert.throws(() => validateReviewInput(validInput({ explanation: 'a'.repeat(1201) }), ['attention']), /1200/);
});

test('rejects an unknown checkpoint', () => {
  assert.throws(() => validateReviewInput(validInput({ checkpointId: 'fake' }), ['attention']), /checkpoint/i);
});

test('rejects a verdict that disagrees with passed', () => {
  assert.throws(
    () => validateReview({ ...validReview, verdict: 'misconception', decision_code: 'SPECIFIC_CONCEPT_ERROR', passed: true }, ['T06-130']),
    /passed/i,
  );
});

test('rejects source IDs not supplied by the teacher material', () => {
  assert.throws(
    () => validateReview({ ...validReview, source_ids: ['T99-999'] }, ['T06-130']),
    /nguồn/i,
  );
});

test('requires a follow-up question for a non-passing conceptual review', () => {
  assert.throws(
    () =>
      validateReview(
        {
          ...validReview,
          verdict: 'misconception',
          decision_code: 'SPECIFIC_CONCEPT_ERROR',
          passed: false,
          feedback: 'Bạn đang nhầm khoảng cách với mức độ liên quan.',
          next_question: '',
        },
        ['T06-130'],
      ),
    /câu hỏi/i,
  );
});

test('accepts a structurally consistent teacher-grounded review', () => {
  assert.deepEqual(validateReview(validReview, ['T06-130', 'T06-133']), validReview);
});
