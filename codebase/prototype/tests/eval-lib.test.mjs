import assert from 'node:assert/strict';
import test from 'node:test';
import { scoreCase, validateGoldenSet } from '../../../eval/eval-lib.mjs';

const difficulties = [
  'source_truth','source_truth','source_truth','source_truth','source_truth',
  'ambiguous_or_missing','ambiguous_or_missing','ambiguous_or_missing','ambiguous_or_missing','ambiguous_or_missing',
  'out_of_scope_or_authority','out_of_scope_or_authority','out_of_scope_or_authority','out_of_scope_or_authority',
  'domain_specific','domain_specific','domain_specific','domain_specific','domain_specific','domain_specific',
];
const frequencies = ['common','common','common','common','common','common','common','common','common','common','edge','edge','edge','other','other','other','other','other','other','other'];

function caseFixture(index) {
  return {
    id: `GS-${String(index + 1).padStart(3, '0')}`,
    title: `Case ${index + 1}`,
    difficulty_class: difficulties[index],
    frequency: frequencies[index],
    provenance: index < 12
      ? { kind: 'provided_data', source_ids: [`T${String(index + 1).padStart(5, '0')}`], note: 'Nguồn thật đã ẩn danh.' }
      : { kind: 'team_authored', source_ids: [], note: 'Ca do nhóm xây dựng.' },
    checkpoint_id: 'attention',
    selected_answer: 1,
    explanation: `Giải thích ${index + 1}`,
    acceptance: {
      expected_verdict: 'correct',
      expected_passed: true,
      expected_decision_codes: ['RUBRIC_SATISFIED'],
      required_terms_any: [['ngữ cảnh', 'liên quan']],
      forbidden_phrases: ['hoàn toàn sai'],
      allowed_source_ids: ['T06-130', 'T06-133'],
      minimum_source_ids: 1,
      require_next_question: false,
    },
  };
}

const validCases = () => Array.from({ length: 20 }, (_, index) => caseFixture(index));

test('accepts a 20-case set with required taxonomy, frequency, and provenance coverage', () => {
  const summary = validateGoldenSet(validCases());
  assert.equal(summary.total, 20);
  assert.equal(summary.common, 10);
  assert.equal(summary.edge, 3);
  assert.equal(summary.providedData, 12);
});

test('rejects fewer than 20 cases', () => {
  assert.throws(() => validateGoldenSet(validCases().slice(0, 19)), /20/);
});

test('rejects duplicate case IDs', () => {
  const cases = validCases();
  cases[1].id = cases[0].id;
  assert.throws(() => validateGoldenSet(cases), /trùng/i);
});

test('rejects a difficult class with fewer than two cases', () => {
  const cases = validCases();
  for (const item of cases) if (item.difficulty_class === 'out_of_scope_or_authority') item.difficulty_class = 'source_truth';
  assert.throws(() => validateGoldenSet(cases), /out_of_scope_or_authority/);
});

test('rejects common count outside 8 to 10', () => {
  const cases = validCases();
  cases[10].frequency = 'common';
  assert.throws(() => validateGoldenSet(cases), /common/i);
});

test('rejects edge count outside 2 to 4', () => {
  const cases = validCases();
  cases[10].frequency = 'other';
  cases[11].frequency = 'other';
  assert.throws(() => validateGoldenSet(cases), /edge/i);
});

test('rejects fewer than 10 cases derived from provided data', () => {
  const cases = validCases();
  for (let index = 8; index < 12; index += 1) cases[index].provenance = { kind: 'team_authored', source_ids: [], note: 'Team case.' };
  assert.throws(() => validateGoldenSet(cases), /10.*dữ liệu/i);
});

test('rejects a case without explicit acceptance criteria', () => {
  const cases = validCases();
  delete cases[0].acceptance.expected_verdict;
  assert.throws(() => validateGoldenSet(cases), /expected_verdict/);
});

test('rejects a case without expected structured decision codes', () => {
  const cases = validCases();
  delete cases[0].acceptance.expected_decision_codes;
  assert.throws(() => validateGoldenSet(cases), /decision code/i);
});

test('scores a result only when every deterministic acceptance check passes', () => {
  const definition = caseFixture(0);
  const result = scoreCase(definition, {
    verdict: 'correct',
    decision_code: 'RUBRIC_SATISFIED',
    passed: true,
    misconceptions: [],
    missing_ideas: [],
    feedback: 'Bạn đã giải thích đúng mức độ liên quan theo ngữ cảnh.',
    next_question: '',
    source_ids: ['T06-130'],
  });
  assert.equal(result.passed, true);
  assert.deepEqual(result.failureReasons, []);
});

test('reports verdict, source, semantic, and follow-up failures independently', () => {
  const definition = caseFixture(0);
  definition.acceptance.expected_verdict = 'misconception';
  definition.acceptance.expected_passed = false;
  definition.acceptance.expected_decision_codes = ['SPECIFIC_CONCEPT_ERROR'];
  definition.acceptance.require_next_question = true;
  const result = scoreCase(definition, {
    verdict: 'insufficient',
    decision_code: 'INSUFFICIENT_EXPLANATION',
    passed: false,
    misconceptions: [],
    missing_ideas: [],
    feedback: 'Chưa đủ.',
    next_question: '',
    source_ids: ['T99-999'],
  });
  assert.equal(result.passed, false);
  assert.equal(result.checks.verdict, false);
  assert.equal(result.checks.allowedSources, false);
  assert.equal(result.diagnostics.requiredTerms, false);
  assert.equal(result.checks.nextQuestion, false);
  assert.equal(result.failureReasons.length, 4);
});

test('accepts an explicit out-of-scope synonym instead of requiring one exact phrase', () => {
  const definition = caseFixture(0);
  definition.acceptance.expected_verdict = 'out_of_scope';
  definition.acceptance.expected_passed = false;
  definition.acceptance.expected_decision_codes = ['UNRELATED_REQUEST'];
  definition.acceptance.required_terms_any = [['ngoài', 'không thuộc', 'checkpoint']];
  definition.acceptance.minimum_source_ids = 0;
  definition.acceptance.require_next_question = true;

  const result = scoreCase(definition, {
    verdict: 'out_of_scope',
    decision_code: 'UNRELATED_REQUEST',
    passed: false,
    misconceptions: [],
    missing_ideas: [],
    feedback: 'Yêu cầu này không nằm trong phạm vi câu hỏi hiện tại.',
    next_question: 'Bạn có thể quay lại giải thích attention không?',
    source_ids: [],
  });

  assert.equal(result.passed, true);
});

test('uses the structured decision code instead of requiring feedback to repeat rubric terms', () => {
  const definition = caseFixture(0);
  const result = scoreCase(definition, {
    verdict: 'correct',
    decision_code: 'RUBRIC_SATISFIED',
    passed: true,
    misconceptions: [],
    missing_ideas: [],
    feedback: 'Giải thích của bạn chính xác.',
    next_question: '',
    source_ids: ['T06-130'],
  });

  assert.equal(result.passed, true);
  assert.equal(result.checks.decisionCode, true);
  assert.equal(result.diagnostics.requiredTerms, false);
});

test('fails a case when the structured decision code is not accepted', () => {
  const definition = caseFixture(0);
  const result = scoreCase(definition, {
    verdict: 'correct',
    decision_code: 'UNRELATED_REQUEST',
    passed: true,
    misconceptions: [],
    missing_ideas: [],
    feedback: 'Đúng.',
    next_question: '',
    source_ids: ['T06-130'],
  });

  assert.equal(result.passed, false);
  assert.equal(result.checks.decisionCode, false);
  assert.match(result.failureReasons.join(' '), /decision code/i);
});
