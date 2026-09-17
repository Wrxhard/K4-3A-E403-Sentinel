import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { executeEvaluation, generateMarkdown, writeRunArtifacts } from '../../../eval/run-eval.mjs';
import { ReviewServiceError } from '../server/openai-reviewer.js';
import { exercises } from '../src/lesson.js';
import { validReview } from './review-fixtures.mjs';

function definition(id, expected = 'correct') {
  return {
    id,
    title: `Case ${id}`,
    difficulty_class: 'source_truth',
    frequency: 'common',
    provenance: { kind: 'team_authored', source_ids: [], note: 'test' },
    checkpoint_id: 'attention',
    selected_answer: 1,
    explanation: 'Attention dùng mức độ liên quan trong ngữ cảnh và trọng số.',
    acceptance: {
      expected_verdict: expected,
      expected_passed: expected === 'correct',
      required_terms_any: [['ngữ cảnh', 'liên quan']],
      forbidden_phrases: [],
      allowed_source_ids: ['T06-130', 'T06-133'],
      minimum_source_ids: 1,
      require_next_question: expected !== 'correct',
    },
  };
}

test('generates report totals and failure analysis from actual result rows', () => {
  const markdown = generateMarkdown({
    run_id: 'run_test',
    completed_at: '2026-09-17T00:00:00.000Z',
    model: 'gpt-5-mini',
    summary: { total: 2, passed: 1, failed: 1, pass_rate: 50 },
    taxonomy: { source_truth: { total: 2, passed: 1, failed: 1 } },
    results: [
      { id: 'GS-001', title: 'Pass', passed: true, failure_reasons: [] },
      { id: 'GS-002', title: 'Fail', passed: false, failure_reasons: ['expected verdict misconception'] },
    ],
  });
  assert.match(markdown, /Đạt: 1/);
  assert.match(markdown, /Không đạt: 1/);
  assert.match(markdown, /Tỷ lệ đạt: 50\.0%/);
  assert.match(markdown, /GS-002/);
  assert.match(markdown, /expected verdict misconception/i);
});

test('counts a logged reviewer failure as a failed evaluation case', async () => {
  const run = await executeEvaluation({
    cases: [definition('GS-001')],
    exercises,
    reviewer: {
      review: async () => {
        throw new ReviewServiceError('upstream_error', 'rate limited', { retryable: true });
      },
    },
    model: 'gpt-5-mini',
    now: () => new Date('2026-09-17T00:00:00.000Z'),
  });
  assert.equal(run.summary.failed, 1);
  assert.equal(run.results[0].error.code, 'upstream_error');
});

test('an interrupted run does not write a completed report', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'sentinel-eval-'));
  try {
    const abort = new Error('interrupted');
    abort.name = 'AbortError';
    await assert.rejects(
      executeEvaluation({
        cases: [definition('GS-001'), definition('GS-002')],
        exercises,
        reviewer: { review: async () => { throw abort; } },
        model: 'gpt-5-mini',
      }),
      /interrupted/,
    );
    await assert.rejects(access(path.join(directory, 'run_results.md')));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('writes final JSON and Markdown only for a complete run', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'sentinel-eval-'));
  try {
    const run = await executeEvaluation({
      cases: [definition('GS-001')],
      exercises,
      reviewer: { review: async () => validReview },
      model: 'gpt-5-mini',
      now: () => new Date('2026-09-17T00:00:00.000Z'),
    });
    await writeRunArtifacts(run, directory);
    await access(path.join(directory, 'run_results.json'));
    await access(path.join(directory, 'run_results.md'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('writes a numbered run without overwriting the first-run evidence', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'sentinel-eval-'));
  try {
    await writeFile(path.join(directory, 'run_results.json'), '{"run":"first"}\n', 'utf8');
    const run = await executeEvaluation({
      cases: [definition('GS-001')],
      exercises,
      reviewer: { review: async () => validReview },
      model: 'gpt-5-mini',
      now: () => new Date('2026-09-17T01:00:00.000Z'),
    });

    await writeRunArtifacts(run, directory, { runNumber: 2 });

    assert.equal(await readFile(path.join(directory, 'run_results.json'), 'utf8'), '{"run":"first"}\n');
    await access(path.join(directory, 'run_results_2.json'));
    const markdown = await readFile(path.join(directory, 'run_results_2.md'), 'utf8');
    assert.match(markdown, /kiểm thử lượt 2/i);
    assert.match(markdown, /run_results_2\.json/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
