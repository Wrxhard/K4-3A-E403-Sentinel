import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export async function appendTrace(trace, logPath) {
  if (!logPath) throw new Error('AI_LOG_PATH chưa được cấu hình.');
  await mkdir(path.dirname(path.resolve(logPath)), { recursive: true });
  await appendFile(logPath, `${JSON.stringify(trace)}\n`, 'utf8');
}

