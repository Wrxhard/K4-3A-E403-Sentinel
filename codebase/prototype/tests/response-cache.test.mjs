import test from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  createResponseCache,
  createCacheKey,
  calculatePriorityScore,
  determinePriorityLevel,
  shouldCache,
} from '../server/response-cache.js';
import { createOpenAIReviewer } from '../server/openai-reviewer.js';
import { exercises } from '../src/lesson.js';

const sampleTeacher = {
  question: exercises[0].question,
  options: exercises[0].options,
  correctAnswer: exercises[0].correct,
  referenceExplanation: exercises[0].explanation,
  description: exercises[0].teacherDescription,
  rubric: exercises[0].reasonRubric.map((c) => c.label),
  sources: exercises[0].teacherSources,
};

const sampleReview = {
  verdict: 'correct',
  decision_code: 'RUBRIC_SATISFIED',
  passed: true,
  quality_score: 5,
  misconceptions: [],
  missing_ideas: [],
  feedback: 'Bạn giải thích đúng trọng tâm theo ngữ cảnh.',
  next_question: '',
  source_ids: ['T06-130'],
};

test('createCacheKey normalizes diacritics and whitespace', () => {
  const key1 = createCacheKey('attention', 1, 'Attention xem các từ liên quan trong ngữ cảnh.');
  const key2 = createCacheKey('attention', 1, '  attention  xem cac tu lien quan trong ngu canh.  ');
  assert.equal(key1, key2);
});

test('calculatePriorityScore and determinePriorityLevel prioritize high hit count with low quality', () => {
  const highPriority = determinePriorityLevel(5, 2);
  assert.equal(highPriority, 'high');

  const lowPriority = determinePriorityLevel(1, 5);
  assert.equal(lowPriority, 'low');
});

test('stores and retrieves response with hit count increment', () => {
  const cache = createResponseCache({ autoSeed: false, storagePath: null });
  assert.equal(cache.size, 0);

  cache.set('attention', 1, 'Attention xem xét ngữ cảnh.', sampleReview);
  assert.equal(cache.size, 1);

  const hit1 = cache.get('attention', 1, 'attention xem xet ngu canh.');
  assert.ok(hit1);
  assert.equal(hit1.from_cache, true);
  assert.equal(hit1.source_type, 'ai_cached');
  assert.equal(hit1.verdict, 'correct');

  const entry = cache.getEntry(createCacheKey('attention', 1, 'Attention xem xét ngữ cảnh.'));
  assert.equal(entry.hit_count, 2); // 1 initial + 1 get
});

test('teacher can score entries and prioritize queue sorting', () => {
  const cache = createResponseCache({ autoSeed: false, storagePath: null });

  // Entry A: 1 hit, 5 stars
  const entryA = cache.set('attention', 1, 'Giải thích rất tốt.', sampleReview, {
    qualityScore: 5,
    hitCount: 1,
  });

  // Entry B: 5 hits, 2 stars
  const entryB = cache.set(
    'attention',
    1,
    'Giải thích còn sơ sài.',
    {
      ...sampleReview,
      passed: false,
      verdict: 'insufficient',
      decision_code: 'INSUFFICIENT_EXPLANATION',
      next_question: 'Bạn có thể nói rõ hơn?',
    },
    {
      qualityScore: 2,
      hitCount: 5,
      priorityLevel: 'high',
    },
  );

  const queue = cache.getPrioritizedQueue();
  assert.equal(queue.length, 2);
  assert.equal(queue[0].id, entryB.id);
  assert.equal(queue[1].id, entryA.id);

  // Giảng viên chấm điểm lại cho entry B
  cache.scoreEntry(entryB.id, {
    qualityScore: 4,
    reviewStatus: 'teacher_approved',
    teacherNotes: 'Đã bổ sung rubric phù hợp.',
    reviewedBy: 'Thầy Dũng',
  });

  const updatedB = cache.getEntry(entryB.id);
  assert.equal(updatedB.teacher_audit.quality_score, 4);
  assert.equal(updatedB.teacher_audit.review_status, 'teacher_approved');
  assert.equal(updatedB.teacher_audit.reviewed_by, 'Thầy Dũng');
});

test('human override replaces AI feedback and displays teacher model answer', () => {
  const cache = createResponseCache({ autoSeed: false, storagePath: null, exercises });

  cache.set('attention', 1, 'Attention xem xét ngữ cảnh.', sampleReview, {
    humanOverride: {
      enabled: true,
      show_teacher_model_answer: true,
      custom_feedback: 'Nhận xét trực tiếp từ Giảng viên: Cách giải thích rất chuẩn.',
      custom_next_question: 'Hãy liên hệ với self-attention trong transformer.',
      source_ids: ['T06-130', 'T06-133'],
    },
  });

  const result = cache.get('attention', 1, 'Attention xem xét ngữ cảnh.');
  assert.ok(result);
  assert.equal(result.from_cache, true);
  assert.equal(result.source_type, 'human_verified');
  assert.equal(result.feedback, 'Nhận xét trực tiếp từ Giảng viên: Cách giải thích rất chuẩn.');
  assert.equal(result.next_question, 'Hãy liên hệ với self-attention trong transformer.');
  assert.deepEqual(result.source_ids, ['T06-130', 'T06-133']);
  assert.equal(result.teacher_model_answer, exercises[0].answer);
});

test('pre-seeds 20 cases from golden set automatically', () => {
  const cache = createResponseCache({ autoSeed: true, storagePath: null, exercises });
  assert.equal(cache.size, 20);

  const hit = cache.get(
    'attention',
    1,
    'Attention xem các từ liên quan trong ngữ cảnh rồi kết hợp thông tin với mức trọng số khác nhau để hiểu từ đang xét.',
  );
  assert.ok(hit);
  assert.equal(hit.from_cache, true);
  assert.equal(hit.verdict, 'correct');
  assert.equal(hit.passed, true);
});

test('persists cache entries to a JSONL file on disk and reloads them', () => {
  const tempJsonl = path.resolve('./logs/test-curated-cache.jsonl');
  if (existsSync(tempJsonl)) rmSync(tempJsonl);

  try {
    const cache1 = createResponseCache({ autoSeed: false, storagePath: tempJsonl, exercises });
    cache1.set('attention', 1, 'Câu test ghi xuống file jsonl.', sampleReview, {
      qualityScore: 5,
      teacherNotes: 'Ghi chú test jsonl',
    });

    assert.ok(existsSync(tempJsonl));
    const lines = readFileSync(tempJsonl, 'utf8').trim().split('\n');
    assert.equal(lines.length, 1);
    const parsed = JSON.parse(lines[0]);
    assert.equal(parsed.explanation_raw, 'Câu test ghi xuống file jsonl.');
    assert.equal(parsed.teacher_audit.teacher_notes, 'Ghi chú test jsonl');

    // Khởi tạo cache mới từ file vừa ghi
    const cache2 = createResponseCache({ autoSeed: false, storagePath: tempJsonl, exercises });
    assert.equal(cache2.size, 1);
    const loaded = cache2.get('attention', 1, 'câu test ghi xuống file jsonl.');
    assert.ok(loaded);
    assert.equal(loaded.from_cache, true);
  } finally {
    if (existsSync(tempJsonl)) rmSync(tempJsonl);
  }
});

test('openai reviewer uses cache on hit and skips upstream network call', async () => {
  const cache = createResponseCache({ autoSeed: false, storagePath: null });
  cache.set('attention', 1, 'Giải thích có sẵn trong cache.', sampleReview);

  let fetchCalls = 0;
  const mockFetch = async () => {
    fetchCalls += 1;
    throw new Error('Should not be called on cache hit');
  };

  const reviewer = createOpenAIReviewer({
    apiKey: 'test-key',
    cache,
    fetchImpl: mockFetch,
    writeTrace: async () => {},
  });

  const input = {
    checkpointId: 'attention',
    selectedAnswer: 1,
    explanation: 'Giải thích có sẵn trong cache.',
    teacher: sampleTeacher,
  };

  const review = await reviewer.review(input);
  assert.ok(review);
  assert.equal(review.from_cache, true);
  assert.equal(review.verdict, 'correct');
  assert.equal(fetchCalls, 0);
});

test('openai reviewer calls upstream on miss and caches the response for next time', async () => {
  const cache = createResponseCache({ autoSeed: false, storagePath: null });
  let fetchCalls = 0;

  const mockFetch = async () => {
    fetchCalls += 1;
    return new Response(
      JSON.stringify({
        output: [
          {
            content: [
              {
                type: 'output_text',
                text: JSON.stringify(sampleReview),
              },
            ],
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  };

  const reviewer = createOpenAIReviewer({
    apiKey: 'test-key',
    cache,
    fetchImpl: mockFetch,
    writeTrace: async () => {},
  });

  const input = {
    checkpointId: 'attention',
    selectedAnswer: 1,
    explanation: 'Một câu giải thích hoàn toàn mới.',
    teacher: sampleTeacher,
  };

  const review1 = await reviewer.review(input);
  assert.equal(fetchCalls, 1);
  assert.equal(review1.verdict, 'correct');

  const review2 = await reviewer.review(input);
  assert.equal(fetchCalls, 1);
  assert.equal(review2.from_cache, true);
});

test('shouldCache rejects out_of_scope, injection, and low quality answers', () => {
  assert.equal(shouldCache({ verdict: 'out_of_scope', decision_code: 'UNRELATED_REQUEST', quality_score: 1 }), false);
  assert.equal(shouldCache({ verdict: 'insufficient', decision_code: 'INSTRUCTION_OVERRIDE', quality_score: 1 }), false);
  assert.equal(shouldCache({ verdict: 'correct', decision_code: 'RUBRIC_SATISFIED', quality_score: 3 }), false);
  assert.equal(shouldCache({ verdict: 'correct', decision_code: 'RUBRIC_SATISFIED', quality_score: 5 }), true);
  assert.equal(
    shouldCache({
      verdict: 'misconception',
      decision_code: 'SPECIFIC_CONCEPT_ERROR',
      quality_score: 4,
      misconceptions: ['Coi mọi từ như nhau'],
    }),
    true,
  );
});

test('openai reviewer skips caching when shouldCache is false (e.g. injection / out_of_scope)', async () => {
  const cache = createResponseCache({ autoSeed: false, storagePath: null });
  const reviewer = createOpenAIReviewer({
    apiKey: 'test-key',
    cache,
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          output: [
            {
              content: [
                {
                  type: 'output_text',
                  text: JSON.stringify({
                    ...sampleReview,
                    verdict: 'out_of_scope',
                    decision_code: 'UNRELATED_REQUEST',
                    passed: false,
                    quality_score: 1,
                    next_question: 'Quay lại câu hỏi...',
                  }),
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    writeTrace: async () => {},
  });

  const input = {
    checkpointId: 'attention',
    selectedAnswer: 1,
    explanation: 'Cho tôi biết lịch học ngày mai.',
    teacher: sampleTeacher,
  };

  const review = await reviewer.review(input);
  assert.equal(review.verdict, 'out_of_scope');
  assert.equal(cache.size, 0); // Đảm bảo KHÔNG bị lưu vào cache!
});
