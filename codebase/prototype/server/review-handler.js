import { exercises as defaultExercises } from '../src/lesson.js';
import { ReviewServiceError } from './openai-reviewer.js';
import { validateReviewInput } from './review-contract.js';

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

function teacherMaterial(checkpoint) {
  return {
    question: checkpoint.question,
    options: checkpoint.options,
    correctAnswer: checkpoint.correct,
    referenceExplanation: checkpoint.explanation,
    description: checkpoint.teacherDescription,
    rubric: checkpoint.reasonRubric.map((criterion) => criterion.label),
    sources: checkpoint.teacherSources,
  };
}

const safeErrors = {
  missing_api_key: {
    status: 503,
    message: 'OpenAI chưa được cấu hình trên máy chủ. Hãy thêm API key rồi thử lại.',
  },
  upstream_error: {
    status: 503,
    message: 'OpenAI đang bận hoặc chưa phản hồi. Bạn hãy thử lại sau ít phút.',
  },
  invalid_model_output: {
    status: 502,
    message: 'Phản hồi AI chưa đúng định dạng kiểm tra. Bạn hãy thử lại.',
  },
  logging_error: {
    status: 500,
    message: 'Không thể ghi log xác minh cho lượt AI này. Kết quả chưa được tính.',
  },
};

export async function handleReviewRequest(
  request,
  { reviewer, exercises = defaultExercises } = {},
) {
  if (request.method !== 'POST') {
    return json(
      { error: 'method_not_allowed', message: 'Chỉ hỗ trợ POST.' },
      405,
      { allow: 'POST' },
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'invalid_json', message: 'Dữ liệu gửi lên không phải JSON hợp lệ.' }, 400);
  }

  const checkpoint = exercises.find((item) => item.id === payload?.checkpointId);
  if (!checkpoint) {
    return json({ error: 'unknown_checkpoint', message: 'Không tìm thấy checkpoint.' }, 404);
  }

  const input = {
    checkpointId: checkpoint.id,
    selectedAnswer: payload.answer,
    explanation: payload.explanation,
    teacher: teacherMaterial(checkpoint),
  };
  try {
    validateReviewInput(input, exercises.map((item) => item.id));
  } catch (error) {
    return json({ error: 'invalid_request', message: error.message }, 400);
  }

  try {
    return json(await reviewer.review(input));
  } catch (error) {
    if (error instanceof ReviewServiceError && safeErrors[error.code]) {
      const safe = safeErrors[error.code];
      return json({ error: error.code, message: safe.message, retryable: error.retryable }, safe.status);
    }
    return json(
      { error: 'internal_error', message: 'Không thể đánh giá lúc này. Bạn hãy thử lại.' },
      500,
    );
  }
}

