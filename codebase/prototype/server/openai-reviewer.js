import { randomUUID } from 'node:crypto';
import { validateReview, validateReviewInput } from './review-contract.js';
import { buildReviewRequest } from './review-prompt.js';
import { detectGuardrailSignal, enforceGuardrail } from './review-guardrails.js';
import { shouldCache } from './response-cache.js';
import { appendTrace } from './runtime-log.js';

const RESPONSES_URL = 'https://api.openai.com/v1/responses';

export class ReviewServiceError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = 'ReviewServiceError';
    this.code = code;
    this.retryable = Boolean(options.retryable);
    this.httpStatus = options.httpStatus;
  }
}

function extractOutputText(body) {
  for (const item of body?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  throw new ReviewServiceError('invalid_model_output', 'OpenAI không trả về structured output hợp lệ.');
}

async function readResponseBody(response) {
  try {
    return await response.json();
  } catch (cause) {
    throw new ReviewServiceError('invalid_model_output', 'Không đọc được phản hồi JSON từ OpenAI.', { cause });
  }
}

export function createOpenAIReviewer({
  apiKey,
  model = 'gpt-5-mini',
  logPath = './logs/ai-calls.jsonl',
  cache = null,
  fetchImpl = globalThis.fetch,
  writeTrace = appendTrace,
  now = () => new Date(),
  createId = randomUUID,
} = {}) {
  return {
    async review(input, context = {}) {
      validateReviewInput(input, [input?.checkpointId]);

      const requestId = createId();
      const timestamp = now().toISOString();
      const startedAt = Date.now();

      if (cache) {
        const cached = cache.get(input.checkpointId, input.selectedAnswer, input.explanation);
        if (cached) {
          try {
            await writeTrace(
              {
                timestamp,
                request_id: requestId,
                case_id: context.caseId || null,
                status: 'success',
                model: `${model}:cached`,
                latency_ms: Date.now() - startedAt,
                http_status: 200,
                prompt: null,
                raw_response: null,
                model_review: cached,
                guardrail_signal: null,
                parsed_review: cached,
                from_cache: true,
              },
              logPath,
            );
          } catch (cause) {
            throw new ReviewServiceError('logging_error', 'Không thể ghi log kỹ thuật cho lượt gọi AI.', { cause });
          }
          return cached;
        }
      }

      if (!apiKey?.trim()) {
        throw new ReviewServiceError('missing_api_key', 'OPENAI_API_KEY chưa được cấu hình.');
      }
      if (typeof fetchImpl !== 'function') {
        throw new ReviewServiceError('configuration_error', 'Server không có fetch để gọi OpenAI.');
      }

      const prompt = buildReviewRequest(input, model);
      let rawResponse = null;
      let httpStatus = null;

      try {
        const response = await fetchImpl(RESPONSES_URL, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify(prompt),
        });
        httpStatus = response.status;
        rawResponse = await readResponseBody(response);
        if (!response.ok) {
          throw new ReviewServiceError('upstream_error', 'OpenAI tạm thời không xử lý được yêu cầu.', {
            retryable: response.status === 429 || response.status >= 500,
            httpStatus: response.status,
          });
        }

        let parsed;
        let modelReview;
        const guardrailSignal = detectGuardrailSignal(input);
        try {
          modelReview = JSON.parse(extractOutputText(rawResponse));
          validateReview(modelReview, input.teacher.sources.map((source) => source.id));
          parsed = enforceGuardrail(modelReview, guardrailSignal, input);
          validateReview(parsed, input.teacher.sources.map((source) => source.id));
        } catch (cause) {
          if (cause instanceof ReviewServiceError) throw cause;
          throw new ReviewServiceError('invalid_model_output', 'Structured output của OpenAI không hợp lệ.', {
            cause,
          });
        }

        try {
          await writeTrace(
            {
              timestamp,
              request_id: requestId,
              case_id: context.caseId || null,
              status: 'success',
              model,
              latency_ms: Date.now() - startedAt,
              http_status: httpStatus,
              prompt,
              raw_response: rawResponse,
              model_review: modelReview,
              guardrail_signal: guardrailSignal,
              parsed_review: parsed,
            },
            logPath,
          );
        } catch (cause) {
          throw new ReviewServiceError('logging_error', 'Không thể ghi log kỹ thuật cho lượt gọi AI.', { cause });
        }

        if (cache && shouldCache(parsed)) {
          cache.set(input.checkpointId, input.selectedAnswer, input.explanation, parsed, {
            qualityScore: parsed.quality_score,
          });
        }

        return parsed;
      } catch (cause) {
        const error =
          cause instanceof ReviewServiceError
            ? cause
            : new ReviewServiceError('upstream_error', 'Không thể kết nối OpenAI.', {
                cause,
                retryable: true,
              });
        if (error.code === 'logging_error') throw error;
        try {
          await writeTrace(
            {
              timestamp,
              request_id: requestId,
              case_id: context.caseId || null,
              status: 'error',
              model,
              latency_ms: Date.now() - startedAt,
              http_status: httpStatus,
              prompt,
              raw_response: rawResponse,
              error: { code: error.code, message: error.message, retryable: error.retryable },
            },
            logPath,
          );
        } catch (loggingCause) {
          throw new ReviewServiceError('logging_error', 'Không thể ghi log kỹ thuật cho lượt gọi AI.', {
            cause: loggingCause,
          });
        }
        throw error;
      }
    },
  };
}
