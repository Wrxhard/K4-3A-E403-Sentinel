import { createOpenAIReviewer } from './openai-reviewer.js';
import { handleReviewRequest } from './review-handler.js';

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

export function aiReviewPlugin(options = {}) {
  const reviewer = createOpenAIReviewer(options);
  return {
    name: 'sentinel-ai-review-api',
    configureServer(server) {
      server.middlewares.use('/api/review-explanation', async (request, response) => {
        try {
          const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await readBody(request);
          const webRequest = new Request('http://localhost/api/review-explanation', {
            method: request.method,
            headers: request.headers,
            body,
          });
          const webResponse = await handleReviewRequest(webRequest, { reviewer });
          response.statusCode = webResponse.status;
          for (const [name, value] of webResponse.headers) response.setHeader(name, value);
          response.end(await webResponse.text());
        } catch {
          response.statusCode = 500;
          response.setHeader('content-type', 'application/json; charset=utf-8');
          response.end(
            JSON.stringify({
              error: 'internal_error',
              message: 'Không thể xử lý yêu cầu đánh giá.',
            }),
          );
        }
      });
    },
  };
}

