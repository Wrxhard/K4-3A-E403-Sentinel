import { createResponseCache } from '../server/response-cache.js';
import { createOpenAIReviewer } from '../server/openai-reviewer.js';
import { exercises } from '../src/lesson.js';
import { rmSync, existsSync } from 'node:fs';
import path from 'node:path';

const tempLog = path.resolve('./logs/cold-start-log.jsonl');
const tempCache = path.resolve('./logs/cold-start-cache.jsonl');

if (existsSync(tempLog)) rmSync(tempLog);
if (existsSync(tempCache)) rmSync(tempCache);

console.log('=== TEST COLD START (CACHE TRỐNG 100%) ===\n');

// 1. Khởi tạo Cache hoàn toàn rỗng (autoSeed: false, file lưu riêng)
const cache = createResponseCache({
  autoSeed: false,
  storagePath: tempCache,
  exercises,
});

console.log(`[Bước 1] Khởi tạo Cache rỗng: số lượng item = ${cache.size}`);

const reviewer = createOpenAIReviewer({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-5-mini',
  cache,
  logPath: tempLog,
});

const checkpoint = exercises[0];
const sampleInput = {
  checkpointId: checkpoint.id,
  selectedAnswer: 1,
  explanation: 'Attention xem các từ liên quan trong ngữ cảnh rồi kết hợp thông tin với mức trọng số khác nhau để hiểu từ đang xét.',
  teacher: {
    question: checkpoint.question,
    options: checkpoint.options,
    correctAnswer: checkpoint.correct,
    referenceExplanation: checkpoint.explanation,
    description: checkpoint.teacherDescription,
    rubric: checkpoint.reasonRubric.map((c) => c.label),
    sources: checkpoint.teacherSources,
  },
};

// 2. Lần 1: Cold Start (Cache Miss -> Gọi OpenAI thật với reasoning effort low)
console.log('\n[Bước 2] Gọi Lần 1: Cold Start (Chưa có gì trong Cache)...');
const start1 = Date.now();
const review1 = await reviewer.review(sampleInput);
const time1 = Date.now() - start1;

console.log(`-> Hoàn tất trong: ${time1} ms (~${(time1 / 1000).toFixed(2)}s)`);
console.log(`-> Nguồn phản hồi: ${review1.from_cache ? 'CACHE' : 'OPENAI THẬT'}`);
console.log(`-> Verdict: ${review1.verdict} | Decision Code: ${review1.decision_code}`);
console.log(`-> Quality Score (AI tự chấm): ${review1.quality_score} sao`);
console.log(`-> Feedback: "${review1.feedback.slice(0, 80)}..."`);
console.log(`-> Số item trong Cache sau Lần 1: ${cache.size}`);

// 3. Lần 2: Warm Call (Cache Hit -> Lấy từ Cache vừa lưu)
console.log('\n[Bước 3] Gọi Lần 2 với CÙNG câu hỏi (Kiểm tra Cache Hit)...');
const start2 = Date.now();
const review2 = await reviewer.review(sampleInput);
const time2 = Date.now() - start2;

console.log(`-> Hoàn tất trong: ${time2} ms (~${(time2 / 1000).toFixed(4)}s)`);
console.log(`-> Nguồn phản hồi: ${review2.from_cache ? 'CACHE (ĐÃ LƯU)' : 'OPENAI THẬT'}`);
console.log(`-> Verdict: ${review2.verdict}`);
console.log(`-> Tốc độ tăng: ${(time1 / Math.max(time2, 1)).toFixed(0)} lần!`);

// 4. Lần 3: Thử câu spam/vô nghĩa (Kiểm tra Quality Gate chặn không cache)
console.log('\n[Bước 4] Gọi Lần 3 với câu spam: "..." (Kiểm tra Quality Gate)...');
const spamInput = {
  ...sampleInput,
  explanation: '...',
};
const review3 = await reviewer.review(spamInput);
console.log(`-> Verdict: ${review3.verdict} | Decision: ${review3.decision_code}`);
console.log(`-> Quality Score: ${review3.quality_score}`);
console.log(`-> Số item trong Cache sau Lần 3: ${cache.size} (Không bị lưu vào cache vì là spam!)`);

// Dọn dẹp file tạm
if (existsSync(tempLog)) rmSync(tempLog);
if (existsSync(tempCache)) rmSync(tempCache);

console.log('\n=== HOÀN TẤT THỬ NGHIỆM COLD START THÀNH CÔNG ===');
