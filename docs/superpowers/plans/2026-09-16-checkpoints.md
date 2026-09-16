# Learning Checkpoints Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver an interactive Vietnamese learning prototype matching the supplied VLearn reference and approved checkpoint flow.

**Architecture:** React frontend with timestamped sample content separated from pure checkpoint logic. App state controls simulated playback, quiz, source inspection and flashcard review. No backend or external data submission.

**Tech Stack:** React, Vite, CSS, Node built-in test runner.

**Spec:** ../specs/2026-09-16-checkpoints-design.md

## Global Constraints

- All lesson content is labeled sample; no real AI grading claims.
- Preserve Business_Canvas.md.
- Checkpoints are skippable and XP cannot duplicate on replay.
- UI follows screenshot white/blue palette and three-column learning layout.

### Task 1: Content and checkpoint model
Files: prototype/src/lesson.js, prototype/src/learning.js, prototype/tests/learning.test.mjs.
Interfaces: detectCheckpoints(transcript) returns concept boundaries; evaluateAnswer(checkpoint, answer, reason) returns empty, hint, reason, or success; nextBoundary(checkpoints, from, to, visited) returns first pending boundary.
- [x] Define three sample concepts, transcript segments, options, hints and source-backed explanations.
- [x] Implement model and run `node --test tests/learning.test.mjs` covering skips, seeks and answer branches.

### Task 2: Learning screen
Files: prototype/src/App.jsx, prototype/src/styles.css, prototype/index.html.
- [x] Create course sidebar, player slide, timestamp controls, boundary markers and right transcript panel.
- [x] Connect playback to `nextBoundary(checkpoints, from, to, visited)` and pause on arrival.
- [x] Render quiz options, reason input, hint, skip, feedback and source action.
- [x] Store flashcards by checkpoint ID, award XP once, implement flip and review actions.
- [x] Implement responsive layout, keyboard dialog focus and visible focus outlines.

### Task 3: Verification and delivery
Files: prototype/README.md, prototype/design-qa.md.
- [x] Run model tests and `npm.cmd run build`.
- [x] Open local preview and test wrong answer, missing reason, completion, source, flashcard, skip and timeline seek.
- [x] Inspect rendered layout against screenshot and approved additions; record evidence and limitations.
- [x] Keep preview running and deliver URL with mock-data limitation.
