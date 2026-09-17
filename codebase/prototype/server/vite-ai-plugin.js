import { createOpenAIReviewer } from './openai-reviewer.js';
import { createResponseCache } from './response-cache.js';
import { handleReviewRequest } from './review-handler.js';

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

export function aiReviewPlugin(options = {}) {
  const cache = options.cache || createResponseCache();
  const reviewer = options.reviewer || createOpenAIReviewer({ ...options, cache });
  return {
    name: 'sentinel-ai-review-api',
    configureServer(server) {
      server.middlewares.use('/api/curated-cache', async (request, response) => {
        response.setHeader('content-type', 'application/json; charset=utf-8');
        if (request.method === 'GET') {
          const queue = cache.getPrioritizedQueue();
          response.end(JSON.stringify({ total: cache.size, queue }));
          return;
        }
        response.statusCode = 405;
        response.end(JSON.stringify({ error: 'method_not_allowed' }));
      });

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

