import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOpenAIReviewer, ReviewServiceError } from '../codebase/prototype/server/openai-reviewer.js';
import { exercises } from '../codebase/prototype/src/lesson.js';
import { scoreCase, validateGoldenSet } from './eval-lib.mjs';

const evalDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(evalDirectory);

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

function evaluationInput(definition, checkpointList) {
  const checkpoint = checkpointList.find((item) => item.id === definition.checkpoint_id);
  if (!checkpoint) throw new Error(`${definition.id}: checkpoint ${definition.checkpoint_id} không tồn tại.`);
  return {
    checkpointId: checkpoint.id,
    selectedAnswer: definition.selected_answer,
    explanation: definition.explanation,
    teacher: teacherMaterial(checkpoint),
  };
}

function taxonomySummary(cases, results) {
  const summary = {};
  for (const definition of cases) {
    const bucket = (summary[definition.difficulty_class] ||= { total: 0, passed: 0, failed: 0 });
    const result = results.find((item) => item.id === definition.id);
    bucket.total += 1;
    bucket[result?.passed ? 'passed' : 'failed'] += 1;
  }
  return summary;
}

export async function executeEvaluation({
  cases,
  exercises: checkpointList = exercises,
  reviewer,
  model,
  now = () => new Date(),
  onProgress = () => {},
}) {
  const startedAt = now().toISOString();
  const results = [];
  for (let index = 0; index < cases.length; index += 1) {
    const definition = cases[index];
    onProgress({ index, total: cases.length, id: definition.id });
    try {
      const review = await reviewer.review(evaluationInput(definition, checkpointList), {
        caseId: definition.id,
      });
      const score = scoreCase(definition, review);
      results.push({
        id: definition.id,
        title: definition.title,
        difficulty_class: definition.difficulty_class,
        frequency: definition.frequency,
        expected_verdict: definition.acceptance.expected_verdict,
        actual_verdict: review.verdict,
        passed: score.passed,
        checks: score.checks,
        failure_reasons: score.failureReasons,
        review,
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      results.push({
        id: definition.id,
        title: definition.title,
        difficulty_class: definition.difficulty_class,
        frequency: definition.frequency,
        expected_verdict: definition.acceptance.expected_verdict,
        actual_verdict: null,
        passed: false,
        checks: {},
        failure_reasons: [`runtime error: ${error.code || error.name || 'unknown'}`],
        error: {
          code: error.code || 'unexpected_error',
          message: error.message,
          retryable: Boolean(error.retryable),
        },
      });
    }
  }
  const passed = results.filter((item) => item.passed).length;
  const total = results.length;
  return {
    run_id: `run_${startedAt.replace(/[^0-9]/g, '').slice(0, 14)}_${randomUUID().slice(0, 8)}`,
    started_at: startedAt,
    completed_at: now().toISOString(),
    completed: total === cases.length,
    model,
    summary: {
      total,
      passed,
      failed: total - passed,
      pass_rate: total ? (passed / total) * 100 : 0,
    },
    taxonomy: taxonomySummary(cases, results),
    results,
  };
}

export function generateMarkdown(run) {
  const lines = [
    '# CP3 · Kết quả kiểm thử lượt 1',
    '',
    `- Run ID: \`${run.run_id}\``,
    `- Thời điểm hoàn tất: ${run.completed_at}`,
    `- Model: \`${run.model}\``,
    `- Tổng số ca: ${run.summary.total}`,
    `- Đạt: ${run.summary.passed}`,
    `- Không đạt: ${run.summary.failed}`,
    `- Tỷ lệ đạt: ${run.summary.pass_rate.toFixed(1)}%`,
    '',
    '## Theo taxonomy',
    '',
    '| Lớp khó | Đạt | Không đạt | Tổng |',
    '|---|---:|---:|---:|',
  ];
  for (const [name, bucket] of Object.entries(run.taxonomy)) {
    lines.push(`| ${name} | ${bucket.passed} | ${bucket.failed} | ${bucket.total} |`);
  }
  lines.push('', '## Chi tiết 20 ca', '', '| ID | Ca kiểm thử | Kỳ vọng | Thực tế | Kết quả |', '|---|---|---|---|---|');
  for (const result of run.results) {
    lines.push(`| ${result.id} | ${result.title} | ${result.expected_verdict} | ${result.actual_verdict || result.error?.code || 'không có'} | ${result.passed ? 'Đạt' : 'Không đạt'} |`);
  }
  lines.push('', '## Phân tích ca sai lệch', '');
  const failures = run.results.filter((item) => !item.passed);
  if (!failures.length) {
    lines.push('Không có ca sai lệch trong lượt chạy này. Kết quả vẫn chỉ phản ánh golden set hiện tại, không chứng minh hệ thống đúng tuyệt đối.');
  } else {
    for (const result of failures) {
      lines.push(`### ${result.id} · ${result.title}`, '');
      lines.push(`- Kỳ vọng: \`${result.expected_verdict}\``);
      lines.push(`- Thực tế: \`${result.actual_verdict || result.error?.code || 'không có'}\``);
      lines.push(`- Nguyên nhân: ${result.failure_reasons.join('; ')}`);
      if (result.error) lines.push(`- Lỗi kỹ thuật: ${result.error.message}`);
      lines.push('');
    }
  }
  lines.push('## Ghi chú trung thực', '', 'Tỷ lệ trên được tính trực tiếp từ `run_results.json`. Lỗi API, lỗi định dạng và thiếu log đều được tính là không đạt; không có ca nào được sửa kết quả thủ công.');
  return `${lines.join('\n')}\n`;
}

export async function writeRunArtifacts(run, outputDirectory = evalDirectory) {
  if (!run.completed || run.results.length !== run.summary.total) throw new Error('Không được ghi report cho lượt chạy chưa hoàn tất.');
  await mkdir(outputDirectory, { recursive: true });
  const jsonFinal = path.join(outputDirectory, 'run_results.json');
  const markdownFinal = path.join(outputDirectory, 'run_results.md');
  const jsonTemp = `${jsonFinal}.tmp`;
  const markdownTemp = `${markdownFinal}.tmp`;
  await writeFile(jsonTemp, `${JSON.stringify(run, null, 2)}\n`, 'utf8');
  await writeFile(markdownTemp, generateMarkdown(run), 'utf8');
  await rm(jsonFinal, { force: true });
  await rm(markdownFinal, { force: true });
  await rename(jsonTemp, jsonFinal);
  await rename(markdownTemp, markdownFinal);
}

async function loadLocalEnv() {
  const envPath = path.join(repoRoot, 'codebase', 'prototype', '.env');
  try {
    await access(envPath);
    process.loadEnvFile(envPath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function main() {
  await loadLocalEnv();
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new ReviewServiceError('missing_api_key', 'Hãy thêm OPENAI_API_KEY vào codebase/prototype/.env trước khi chạy eval.');
  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
  const cases = JSON.parse(await readFile(path.join(evalDirectory, 'golden_set.json'), 'utf8'));
  validateGoldenSet(cases);

  const tempLogPath = path.join(evalDirectory, 'run_logs.jsonl.tmp');
  const finalLogPath = path.join(evalDirectory, 'run_logs.jsonl');
  await rm(tempLogPath, { force: true });
  const reviewer = createOpenAIReviewer({ apiKey, model, logPath: tempLogPath });
  const run = await executeEvaluation({
    cases,
    exercises,
    reviewer,
    model,
    onProgress: ({ index, total, id }) => console.log(`[${index + 1}/${total}] ${id}`),
  });

  const logText = await readFile(tempLogPath, 'utf8');
  const logCount = logText.split(/\r?\n/).filter(Boolean).length;
  if (logCount !== cases.length) throw new Error(`Số log (${logCount}) không khớp số ca (${cases.length}).`);
  await writeRunArtifacts(run, evalDirectory);
  await rm(finalLogPath, { force: true });
  await rename(tempLogPath, finalLogPath);
  console.log(`Hoàn tất: ${run.summary.passed}/${run.summary.total} ca đạt (${run.summary.pass_rate.toFixed(1)}%).`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(`Eval thất bại: ${error.message}`);
    process.exitCode = 1;
  });
}
