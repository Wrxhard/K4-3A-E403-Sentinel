import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync, appendFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exercises as defaultExercises } from '../src/lesson.js';
import { normalized } from './review-guardrails.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '../../..');

export function createCacheKey(checkpointId, selectedAnswer, explanation) {
  const cleanText = normalized(explanation).trim().replace(/\s+/g, ' ');
  return `${checkpointId}:${selectedAnswer}:${cleanText}`;
}

export function calculatePriorityScore(hitCount = 1, qualityScore = 3) {
  // Hit count càng cao + quality score càng thấp -> priority càng cao
  const hitWeight = Math.min(hitCount, 10) * 0.6;
  const scoreGapWeight = Math.max(0, 5 - qualityScore) * 0.4;
  return Number((hitWeight + scoreGapWeight).toFixed(2));
}

export function determinePriorityLevel(hitCount = 1, qualityScore = 3) {
  const score = calculatePriorityScore(hitCount, qualityScore);
  if (score >= 3.2 || (hitCount >= 3 && qualityScore <= 2)) return 'high';
  if (score >= 1.8 || qualityScore === 3) return 'medium';
  return 'low';
}

function resolveReviewFromEntry(entry) {
  const qualityScore = entry.teacher_audit?.quality_score ?? entry.ai_response?.quality_score ?? 5;
  if (entry.human_override?.enabled) {
    const override = entry.human_override;
    return {
      from_cache: true,
      source_type: 'human_verified',
      verdict: entry.ai_response.verdict,
      decision_code: entry.ai_response.decision_code,
      passed: entry.ai_response.passed,
      quality_score: qualityScore,
      misconceptions: entry.ai_response.misconceptions,
      missing_ideas: entry.ai_response.missing_ideas,
      feedback: override.custom_feedback || entry.ai_response.feedback,
      next_question: override.custom_next_question || entry.ai_response.next_question,
      source_ids: override.source_ids?.length ? override.source_ids : entry.ai_response.source_ids,
      teacher_model_answer: override.show_teacher_model_answer ? entry.teacher_model_answer : null,
    };
  }

  return {
    from_cache: true,
    source_type: 'ai_cached',
    verdict: entry.ai_response.verdict,
    decision_code: entry.ai_response.decision_code,
    passed: entry.ai_response.passed,
    quality_score: qualityScore,
    misconceptions: entry.ai_response.misconceptions,
    missing_ideas: entry.ai_response.missing_ideas,
    feedback: entry.ai_response.feedback,
    next_question: entry.ai_response.next_question,
    source_ids: entry.ai_response.source_ids,
    teacher_model_answer: entry.human_override?.show_teacher_model_answer ? entry.teacher_model_answer : null,
  };
}

export function shouldCache(review) {
  if (!review) return false;
  if (review.verdict === 'out_of_scope') return false;
  if (review.decision_code === 'INSTRUCTION_OVERRIDE') return false;
  if (review.decision_code === 'INSUFFICIENT_EXPLANATION') return false;

  if (review.verdict === 'correct') {
    return (review.quality_score ?? 5) >= 4;
  }
  if (review.verdict === 'misconception') {
    return (review.quality_score ?? 3) >= 3 && Array.isArray(review.misconceptions) && review.misconceptions.length > 0;
  }
  return false;
}

export function createResponseCache({
  exercises = defaultExercises,
  goldenSetPath = path.join(repoRoot, 'eval', 'golden_set.json'),
  runResultsPath = path.join(repoRoot, 'eval', 'run_results_4.json'),
  storagePath = path.join(currentDir, '../logs/curated-cache.jsonl'),
  autoSeed = true,
  now = () => new Date(),
  createId = randomUUID,
} = {}) {
  const cacheMap = new Map();

  function syncAllToDisk() {
    if (!storagePath) return;
    try {
      const dir = path.dirname(storagePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const content = Array.from(cacheMap.values()).map((e) => JSON.stringify(e)).join('\n') + '\n';
      writeFileSync(storagePath, content, 'utf8');
    } catch {
      // ignore
    }
  }

  function appendEntryToDisk(entry) {
    if (!storagePath) return;
    try {
      const dir = path.dirname(storagePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      appendFileSync(storagePath, JSON.stringify(entry) + '\n', 'utf8');
    } catch {
      // ignore
    }
  }

  function loadFromStorage() {
    if (!storagePath || !existsSync(storagePath)) return 0;
    try {
      const lines = readFileSync(storagePath, 'utf8').trim().split('\n').filter(Boolean);
      let count = 0;
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry?.cache_key) {
            cacheMap.set(entry.cache_key, entry);
            count += 1;
          }
        } catch {
          // ignore malformed line
        }
      }
      return count;
    } catch {
      return 0;
    }
  }

  function seedFromGoldenSet() {
    if (!existsSync(goldenSetPath) || !existsSync(runResultsPath)) return 0;

    try {
      const goldenCases = JSON.parse(readFileSync(goldenSetPath, 'utf8'));
      const runResults = JSON.parse(readFileSync(runResultsPath, 'utf8'));
      const resultsMap = new Map((runResults.results || []).map((r) => [r.id, r.review]));

      let seededCount = 0;
      for (const item of goldenCases) {
        const review = resultsMap.get(item.id);
        if (!review) continue;

        const checkpoint = exercises.find((e) => e.id === item.checkpoint_id);
        const key = createCacheKey(item.checkpoint_id, item.selected_answer, item.explanation);

        const entry = {
          id: item.id || createId(),
          cache_key: key,
          checkpoint_id: item.checkpoint_id,
          selected_answer: item.selected_answer,
          explanation_raw: item.explanation,
          explanation_normalized: normalized(item.explanation).trim().replace(/\s+/g, ' '),
          hit_count: 1,
          created_at: now().toISOString(),
          last_accessed_at: now().toISOString(),
          ai_response: review,
          teacher_model_answer: checkpoint?.answer || null,
          teacher_audit: {
            quality_score: 5,
            review_status: 'teacher_approved',
            priority_level: 'low',
            teacher_notes: `Đã xác thực từ Golden Set (${item.title || item.id})`,
            reviewed_by: 'Giảng viên (Golden Set)',
            reviewed_at: now().toISOString(),
          },
          human_override: {
            enabled: false,
            show_teacher_model_answer: false,
            custom_feedback: null,
            custom_next_question: null,
            source_ids: null,
          },
        };

        cacheMap.set(key, entry);
        seededCount += 1;
      }
      return seededCount;
    } catch {
      return 0;
    }
  }

  if (autoSeed) {
    seedFromGoldenSet();
    loadFromStorage();

    // Tạo file jsonl ban đầu nếu chưa có
    if (storagePath && !existsSync(storagePath) && cacheMap.size > 0) {
      syncAllToDisk();
    }
  } else if (storagePath && arguments[0]?.storagePath) {
    loadFromStorage();
  }

  return {
    get(checkpointId, selectedAnswer, explanation) {
      const key = createCacheKey(checkpointId, selectedAnswer, explanation);
      const entry = cacheMap.get(key);
      if (!entry) return null;

      entry.hit_count += 1;
      entry.last_accessed_at = now().toISOString();
      entry.teacher_audit.priority_level = determinePriorityLevel(
        entry.hit_count,
        entry.teacher_audit.quality_score,
      );

      return resolveReviewFromEntry(entry);
    },

    getEntry(keyOrId) {
      if (cacheMap.has(keyOrId)) return cacheMap.get(keyOrId);
      for (const entry of cacheMap.values()) {
        if (entry.id === keyOrId) return entry;
      }
      return null;
    },

    set(checkpointId, selectedAnswer, explanation, review, options = {}) {
      const key = createCacheKey(checkpointId, selectedAnswer, explanation);
      const existing = cacheMap.get(key);
      const checkpoint = exercises.find((e) => e.id === checkpointId);

      const hitCount = options.hitCount ?? (existing ? existing.hit_count + 1 : 1);
      const qualityScore = options.qualityScore ?? (existing ? existing.teacher_audit.quality_score : review.passed ? 5 : 3);
      const priorityLevel = options.priorityLevel || determinePriorityLevel(hitCount, qualityScore);

      const entry = {
        id: existing?.id || options.id || createId(),
        cache_key: key,
        checkpoint_id: checkpointId,
        selected_answer: selectedAnswer,
        explanation_raw: explanation,
        explanation_normalized: normalized(explanation).trim().replace(/\s+/g, ' '),
        hit_count: hitCount,
        created_at: existing?.created_at || now().toISOString(),
        last_accessed_at: now().toISOString(),
        ai_response: review,
        teacher_model_answer: options.teacherModelAnswer || existing?.teacher_model_answer || checkpoint?.answer || null,
        teacher_audit: {
          quality_score: qualityScore,
          review_status: options.reviewStatus || existing?.teacher_audit.review_status || (qualityScore >= 4 ? 'teacher_approved' : 'pending'),
          priority_level: priorityLevel,
          teacher_notes: options.teacherNotes ?? existing?.teacher_audit.teacher_notes ?? '',
          reviewed_by: options.reviewedBy ?? existing?.teacher_audit.reviewed_by ?? null,
          reviewed_at: options.reviewedAt ?? existing?.teacher_audit.reviewed_at ?? null,
        },
        human_override: {
          enabled: options.humanOverride?.enabled ?? existing?.human_override.enabled ?? false,
          show_teacher_model_answer: options.humanOverride?.show_teacher_model_answer ?? existing?.human_override.show_teacher_model_answer ?? false,
          custom_feedback: options.humanOverride?.custom_feedback ?? existing?.human_override.custom_feedback ?? null,
          custom_next_question: options.humanOverride?.custom_next_question ?? existing?.human_override.custom_next_question ?? null,
          source_ids: options.humanOverride?.source_ids ?? existing?.human_override.source_ids ?? null,
        },
      };

      cacheMap.set(key, entry);
      syncAllToDisk();
      return entry;
    },

    scoreEntry(keyOrId, auditUpdate = {}) {
      const entry = this.getEntry(keyOrId);
      if (!entry) return null;

      if (typeof auditUpdate.qualityScore === 'number') {
        entry.teacher_audit.quality_score = Math.max(1, Math.min(5, auditUpdate.qualityScore));
      }
      if (auditUpdate.reviewStatus) {
        entry.teacher_audit.review_status = auditUpdate.reviewStatus;
      }
      if (auditUpdate.teacherNotes !== undefined) {
        entry.teacher_audit.teacher_notes = auditUpdate.teacherNotes;
      }
      if (auditUpdate.reviewedBy) {
        entry.teacher_audit.reviewed_by = auditUpdate.reviewedBy;
        entry.teacher_audit.reviewed_at = now().toISOString();
      }

      if (auditUpdate.priorityLevel) {
        entry.teacher_audit.priority_level = auditUpdate.priorityLevel;
      } else {
        entry.teacher_audit.priority_level = determinePriorityLevel(
          entry.hit_count,
          entry.teacher_audit.quality_score,
        );
      }

      if (auditUpdate.humanOverride) {
        entry.human_override = {
          ...entry.human_override,
          ...auditUpdate.humanOverride,
        };
      }

      syncAllToDisk();
      return entry;
    },

    getPrioritizedQueue({ checkpointId, minPriorityLevel, status } = {}) {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      let list = Array.from(cacheMap.values());

      if (checkpointId) {
        list = list.filter((item) => item.checkpoint_id === checkpointId);
      }
      if (status) {
        list = list.filter((item) => item.teacher_audit.review_status === status);
      }
      if (minPriorityLevel) {
        const minVal = priorityOrder[minPriorityLevel] || 1;
        list = list.filter((item) => (priorityOrder[item.teacher_audit.priority_level] || 1) >= minVal);
      }

      return list.sort((a, b) => {
        const pA = priorityOrder[a.teacher_audit.priority_level] || 1;
        const pB = priorityOrder[b.teacher_audit.priority_level] || 1;
        if (pA !== pB) return pB - pA;

        const scoreA = calculatePriorityScore(a.hit_count, a.teacher_audit.quality_score);
        const scoreB = calculatePriorityScore(b.hit_count, b.teacher_audit.quality_score);
        if (scoreA !== scoreB) return scoreB - scoreA;

        return b.hit_count - a.hit_count;
      });
    },

    seedFromGoldenSet,

    get size() {
      return cacheMap.size;
    },

    clear() {
      cacheMap.clear();
    },
  };
}
