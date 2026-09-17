const VERDICTS = new Set(['correct', 'misconception', 'insufficient', 'out_of_scope']);
const DECISION_CODES_BY_VERDICT = {
  correct: new Set(['RUBRIC_SATISFIED']),
  misconception: new Set(['SPECIFIC_CONCEPT_ERROR']),
  insufficient: new Set(['INSUFFICIENT_EXPLANATION', 'INSTRUCTION_OVERRIDE']),
  out_of_scope: new Set(['UNRELATED_REQUEST', 'AUTHORITY_BOUNDARY']),
};
const DECISION_CODES = new Set(Object.values(DECISION_CODES_BY_VERDICT).flatMap((codes) => [...codes]));

export const reviewJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'verdict',
    'decision_code',
    'passed',
    'quality_score',
    'misconceptions',
    'missing_ideas',
    'feedback',
    'next_question',
    'source_ids',
  ],
  properties: {
    verdict: { type: 'string', enum: [...VERDICTS] },
    decision_code: { type: 'string', enum: [...DECISION_CODES] },
    passed: { type: 'boolean' },
    quality_score: { type: 'integer', minimum: 1, maximum: 5 },
    misconceptions: { type: 'array', items: { type: 'string' }, maxItems: 3 },
    missing_ideas: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    feedback: { type: 'string', minLength: 1, maxLength: 500 },
    next_question: { type: 'string', maxLength: 300 },
    source_ids: { type: 'array', items: { type: 'string' }, maxItems: 3 },
  },
};

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} phải là object.`);
  }
}

function requireString(value, label, { min = 0, max = Infinity } = {}) {
  if (typeof value !== 'string' || value.trim().length < min) {
    throw new TypeError(`${label} không hợp lệ.`);
  }
  if (value.length > max) throw new RangeError(`${label} không được vượt quá ${max} ký tự.`);
}

function requireStringArray(value, label, max) {
  if (!Array.isArray(value) || value.length > max || value.some((item) => typeof item !== 'string')) {
    throw new TypeError(`${label} phải là danh sách tối đa ${max} chuỗi.`);
  }
}

export function validateReviewInput(value, knownCheckpointIds = []) {
  requireObject(value, 'Dữ liệu đánh giá');
  requireString(value.checkpointId, 'Checkpoint', { min: 1, max: 80 });
  if (knownCheckpointIds.length && !knownCheckpointIds.includes(value.checkpointId)) {
    throw new RangeError('Checkpoint không tồn tại.');
  }
  if (!Number.isInteger(value.selectedAnswer) || value.selectedAnswer < 0) {
    throw new TypeError('Đáp án đã chọn không hợp lệ.');
  }
  requireString(value.explanation, 'Phần giải thích', { min: 1, max: 1200 });
  requireObject(value.teacher, 'Tài liệu giáo viên');
  requireString(value.teacher.question, 'Câu hỏi giáo viên', { min: 1 });
  if (!Array.isArray(value.teacher.options) || value.teacher.options.length < 2) {
    throw new TypeError('Các lựa chọn của giáo viên không hợp lệ.');
  }
  if (!Number.isInteger(value.teacher.correctAnswer)) {
    throw new TypeError('Đáp án chuẩn không hợp lệ.');
  }
  requireString(value.teacher.referenceExplanation, 'Lời giải chuẩn', { min: 1 });
  requireString(value.teacher.description, 'Mô tả chuẩn', { min: 1 });
  requireStringArray(value.teacher.rubric, 'Rubric', 8);
  if (!value.teacher.rubric.length) throw new TypeError('Rubric không được rỗng.');
  if (!Array.isArray(value.teacher.sources) || !value.teacher.sources.length) {
    throw new TypeError('Nguồn giáo viên không được rỗng.');
  }
  for (const source of value.teacher.sources) {
    requireObject(source, 'Nguồn giáo viên');
    requireString(source.id, 'Mã nguồn', { min: 1, max: 80 });
    requireString(source.excerpt, 'Trích đoạn nguồn', { min: 1, max: 600 });
  }
  return value;
}

export function validateReview(value, allowedSourceIds = []) {
  requireObject(value, 'Phản hồi AI');
  const exactKeys = Object.keys(reviewJsonSchema.properties).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(exactKeys)) {
    throw new TypeError('Phản hồi AI có trường thiếu hoặc không được phép.');
  }
  if (!VERDICTS.has(value.verdict)) throw new TypeError('Verdict không hợp lệ.');
  if (!DECISION_CODES.has(value.decision_code)) throw new TypeError('Decision code không hợp lệ.');
  if (!DECISION_CODES_BY_VERDICT[value.verdict].has(value.decision_code)) {
    throw new TypeError('Decision code không nhất quán với verdict.');
  }
  if (typeof value.passed !== 'boolean') throw new TypeError('passed phải là boolean.');
  if (value.passed !== (value.verdict === 'correct')) {
    throw new TypeError('passed không nhất quán với verdict.');
  }
  if (!Number.isInteger(value.quality_score) || value.quality_score < 1 || value.quality_score > 5) {
    throw new TypeError('quality_score phải là số nguyên từ 1 đến 5.');
  }
  requireStringArray(value.misconceptions, 'misconceptions', 3);
  requireStringArray(value.missing_ideas, 'missing_ideas', 4);
  requireString(value.feedback, 'Feedback', { min: 1, max: 500 });
  requireString(value.next_question, 'Câu hỏi định hướng', { max: 300 });
  requireStringArray(value.source_ids, 'source_ids', 3);
  if (value.verdict !== 'correct' && !value.next_question.trim()) {
    throw new TypeError('Câu hỏi định hướng là bắt buộc khi chưa đạt.');
  }
  const allowed = new Set(allowedSourceIds);
  if (value.source_ids.some((id) => !allowed.has(id))) {
    throw new TypeError('Phản hồi chứa mã nguồn không có trong tài liệu giáo viên.');
  }
  return value;
}
