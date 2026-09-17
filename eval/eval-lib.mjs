const requiredDifficulties = [
  'source_truth',
  'ambiguous_or_missing',
  'out_of_scope_or_authority',
  'domain_specific',
];
const allowedFrequencies = new Set(['common', 'edge', 'other']);
const allowedVerdicts = new Set(['correct', 'misconception', 'insufficient', 'out_of_scope']);

function normalized(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function assertCase(item, index) {
  const label = item?.id || `case ${index + 1}`;
  if (!item || typeof item !== 'object') throw new TypeError(`${label} không phải object.`);
  for (const field of ['id', 'title', 'difficulty_class', 'frequency', 'checkpoint_id', 'explanation']) {
    if (typeof item[field] !== 'string' || !item[field].trim()) throw new TypeError(`${label} thiếu ${field}.`);
  }
  if (!requiredDifficulties.includes(item.difficulty_class)) throw new TypeError(`${label} có difficulty_class không hợp lệ.`);
  if (!allowedFrequencies.has(item.frequency)) throw new TypeError(`${label} có frequency không hợp lệ.`);
  if (!Number.isInteger(item.selected_answer) || item.selected_answer < 0) throw new TypeError(`${label} thiếu selected_answer hợp lệ.`);
  if (!item.provenance || !['provided_data', 'team_authored'].includes(item.provenance.kind)) throw new TypeError(`${label} thiếu provenance.kind.`);
  if (!Array.isArray(item.provenance.source_ids)) throw new TypeError(`${label} thiếu provenance.source_ids.`);
  if (item.provenance.kind === 'provided_data' && !item.provenance.source_ids.length) throw new TypeError(`${label} phải có mã nguồn dữ liệu thật.`);
  const acceptance = item.acceptance;
  if (!acceptance || !allowedVerdicts.has(acceptance.expected_verdict)) throw new TypeError(`${label} thiếu expected_verdict hợp lệ.`);
  if (typeof acceptance.expected_passed !== 'boolean') throw new TypeError(`${label} thiếu expected_passed.`);
  if (acceptance.expected_passed !== (acceptance.expected_verdict === 'correct')) throw new TypeError(`${label} có expected_passed không nhất quán.`);
  for (const field of ['required_terms_any', 'forbidden_phrases', 'allowed_source_ids']) {
    if (!Array.isArray(acceptance[field])) throw new TypeError(`${label} thiếu acceptance.${field}.`);
  }
  if (!Number.isInteger(acceptance.minimum_source_ids) || acceptance.minimum_source_ids < 0) throw new TypeError(`${label} thiếu minimum_source_ids.`);
  if (typeof acceptance.require_next_question !== 'boolean') throw new TypeError(`${label} thiếu require_next_question.`);
}

export function validateGoldenSet(cases) {
  if (!Array.isArray(cases) || cases.length < 20) throw new RangeError('Golden set phải có ít nhất 20 ca.');
  cases.forEach(assertCase);
  const ids = cases.map((item) => item.id);
  if (new Set(ids).size !== ids.length) throw new TypeError('Golden set có ID trùng nhau.');

  const difficultyCounts = Object.fromEntries(requiredDifficulties.map((key) => [key, 0]));
  for (const item of cases) difficultyCounts[item.difficulty_class] += 1;
  for (const key of requiredDifficulties) {
    if (difficultyCounts[key] < 2) throw new RangeError(`${key} phải có ít nhất 2 ca.`);
  }
  const common = cases.filter((item) => item.frequency === 'common').length;
  const edge = cases.filter((item) => item.frequency === 'edge').length;
  const providedData = cases.filter((item) => item.provenance.kind === 'provided_data').length;
  if (common < 8 || common > 10) throw new RangeError('Số ca common phải nằm trong khoảng 8–10.');
  if (edge < 2 || edge > 4) throw new RangeError('Số ca edge phải nằm trong khoảng 2–4.');
  if (providedData < 10) throw new RangeError('Phải có ít nhất 10 ca lấy từ dữ liệu được cung cấp.');
  return { total: cases.length, common, edge, providedData, difficultyCounts };
}

export function scoreCase(definition, review) {
  const acceptance = definition.acceptance;
  const combined = normalized([
    review.feedback,
    ...(review.misconceptions || []),
    ...(review.missing_ideas || []),
    review.next_question,
  ].join(' '));
  const checks = {
    verdict: review.verdict === acceptance.expected_verdict,
    passed: review.passed === acceptance.expected_passed,
    requiredTerms: acceptance.required_terms_any.every((group) =>
      group.some((term) => combined.includes(normalized(term))),
    ),
    forbiddenPhrases: acceptance.forbidden_phrases.every((phrase) => !combined.includes(normalized(phrase))),
    allowedSources: Array.isArray(review.source_ids) && review.source_ids.every((id) => acceptance.allowed_source_ids.includes(id)),
    minimumSources: Array.isArray(review.source_ids) && review.source_ids.length >= acceptance.minimum_source_ids,
    nextQuestion: !acceptance.require_next_question || Boolean(review.next_question?.trim()),
  };
  const labels = {
    verdict: `expected verdict ${acceptance.expected_verdict}`,
    passed: `expected passed ${acceptance.expected_passed}`,
    requiredTerms: 'missing required semantic terms',
    forbiddenPhrases: 'contains a forbidden claim',
    allowedSources: 'contains an unsupported source ID',
    minimumSources: `requires at least ${acceptance.minimum_source_ids} source ID(s)`,
    nextQuestion: 'missing a usable next question',
  };
  const failureReasons = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => labels[key]);
  return { passed: failureReasons.length === 0, checks, failureReasons };
}

