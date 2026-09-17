import { randomUUID } from 'node:crypto';
import { validateReview, validateReviewInput } from './review-contract.js';
import { buildReviewRequest } from './review-prompt.js';
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
  fetchImpl = globalThis.fetch,
  writeTrace = appendTrace,
  now = () => new Date(),
  createId = randomUUID,
} = {}) {
  return {
    async review(input, context = {}) {
      validateReviewInput(input, [input?.checkpointId]);
      if (!apiKey?.trim()) {
        throw new ReviewServiceError('missing_api_key', 'OPENAI_API_KEY chưa được cấu hình.');
      }
      if (typeof fetchImpl !== 'function') {
        throw new ReviewServiceError('configuration_error', 'Server không có fetch để gọi OpenAI.');
      }

      const requestId = createId();
      const timestamp = now().toISOString();
      const startedAt = Date.now();
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
        try {
          parsed = JSON.parse(extractOutputText(rawResponse));
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
              parsed_review: parsed,
            },
            logPath,
          );
        } catch (cause) {
          throw new ReviewServiceError('logging_error', 'Không thể ghi log kỹ thuật cho lượt gọi AI.', { cause });
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
