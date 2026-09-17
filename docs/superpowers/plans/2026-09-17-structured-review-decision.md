# Structured Review Decision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize AI review scoring with structured decision codes and deterministic safety guardrails, then document a fresh measured run.

**Architecture:** Extend the strict OpenAI schema with a verdict-consistent `decision_code`. A small guardrail module classifies only unambiguous unsafe/non-semantic inputs; the LLM remains responsible for conceptual review and natural-language coaching. Eval scores the structured code instead of free-form keyword repetition.

**Tech Stack:** Node.js 22, OpenAI Responses API, native `fetch`, Node test runner, JSON/Markdown eval artifacts.

**Spec:** `docs/superpowers/specs/2026-09-17-structured-review-decision-design.md`

## Global Constraints

- Preserve all prior run artifacts and raw logs.
- Do not change the 20 test inputs or their expected verdicts.
- Never log or commit the OpenAI API key or raw protected data.
- Implement behavior test-first and verify the red failure before production edits.

---

### Task 1: Structured contract and guardrails

**Files:**
- Create: `codebase/prototype/server/review-guardrails.js`
- Modify: `codebase/prototype/server/review-contract.js`
- Modify: `codebase/prototype/server/review-prompt.js`
- Modify: `codebase/prototype/server/openai-reviewer.js`
- Test: `codebase/prototype/tests/review-contract.test.mjs`
- Test: `codebase/prototype/tests/review-guardrails.test.mjs`

- [ ] Add failing tests for verdict/code consistency and seven unambiguous guardrail inputs.
- [ ] Run targeted tests and confirm expected red failures.
- [ ] Add `decision_code`, guardrail detection, prompt policy, and post-review enforcement.
- [ ] Run targeted tests and full suite.

### Task 2: Structured eval scoring

**Files:**
- Modify: `eval/golden_set.json`
- Modify: `eval/eval-lib.mjs`
- Modify: `codebase/prototype/tests/eval-lib.test.mjs`

- [ ] Add failing tests proving paraphrased feedback passes when decision code matches, and wrong codes fail.
- [ ] Add expected decision codes without changing any input or expected verdict.
- [ ] Replace lexical pass gate with decision-code gate while retaining lexical diagnostics.
- [ ] Validate the 20-case taxonomy and run the full test suite.

### Task 3: Fresh evidence and documentation

**Files:**
- Create: `eval/run_results_4.json`
- Create: `eval/run_results_4.md`
- Create: `eval/run_logs_4.jsonl`
- Modify: `codebase/prototype/README.md`
- Modify: `spec.md`

- [ ] Run all 20 cases as run 4 and verify 20 raw log lines.
- [ ] Record the complete run history and remaining failures without selecting only the best run.
- [ ] Run build, Sites tests, secret/data checks, commit, and push `main`.
