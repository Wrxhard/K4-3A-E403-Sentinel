import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateGoldenSet } from './eval-lib.mjs';

const goldenPath = fileURLToPath(new URL('./golden_set.json', import.meta.url));
try {
  const cases = JSON.parse(await readFile(goldenPath, 'utf8'));
  const summary = validateGoldenSet(cases);
  console.log('Golden set hợp lệ:');
  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  console.error(`Golden set không hợp lệ: ${error.message}`);
  process.exitCode = 1;
}

