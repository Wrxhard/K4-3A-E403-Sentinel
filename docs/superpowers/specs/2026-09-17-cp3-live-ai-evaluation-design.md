# CP3 Live AI Evaluation Design

## Goal

Turn the existing VLearn checkpoint mock into a working AI prototype that uses OpenAI for the central decision: judging a learner's explanation against teacher-authored questions, reference answers, rubrics, and transcript evidence. Produce an auditable first-run evaluation package for CP3 without publishing the protected raw data pack.

## Scope

The implementation will:

- Replace keyword-only explanation grading in the live checkpoint flow with an OpenAI-backed semantic review.
- Detect correct explanations, misconceptions, insufficient explanations, and out-of-scope requests.
- When a learner explains a concept incorrectly, give a directional hint and a follow-up question grounded in the teacher sample rather than revealing the full answer immediately.
- Log the exact model input and raw response for technical verification.
- Add a golden set of at least 20 independent cases and a runner that executes all cases through the same production review module.
- Produce a truthful `eval/run_results.md` from an actual run only.
- Add a text artifact containing the externally hosted 30-second demo video link.
- Configure local OpenAI environment variables without committing credentials.

The protected `codebase/data/` pack is an input to authoring and evaluation design only. It must not be committed or uploaded as a whole.

## Architecture

### Runtime boundary

The React client sends `POST /api/review-explanation` with a checkpoint ID, selected answer, and learner explanation. A local Node server owns the API key, resolves the checkpoint's teacher material on the server, calls the OpenAI Responses API, validates the structured result, logs the request and raw model response, and returns only the learner-safe review object.

The browser never receives `OPENAI_API_KEY`. The OpenAI SDK reads it from the server environment. `OPENAI_MODEL` is configurable and defaults to `gpt-5-mini` for a cost-sensitive, well-defined classification task.

### Shared decision module

One server-side module exposes a review function used by both the HTTP route and the evaluation runner. Its input contains:

- teacher question;
- correct option and reference explanation;
- teacher description and rubric concepts;
- the minimal supporting transcript excerpt and source ID;
- learner-selected answer and learner explanation.

Its structured output contains:

- `verdict`: `correct`, `misconception`, `insufficient`, or `out_of_scope`;
- `passed`: boolean;
- `misconceptions`: short list of incorrect claims;
- `missing_ideas`: short list of rubric concepts not demonstrated;
- `feedback`: concise Vietnamese guidance;
- `next_question`: one Socratic question grounded in the teacher sample;
- `source_ids`: only IDs supplied in the input.

The prompt treats learner text and data excerpts as untrusted data, not instructions. It forbids inventing source IDs and asks for guidance without immediately exposing the reference answer when the verdict is not correct.

### Client behavior

Multiple-choice validation remains deterministic. Once the learner selects the correct option and submits a non-empty explanation, the quiz enters a loading state and calls the API.

- `correct`: show success, source evidence, flashcard, and XP.
- `misconception`: keep the checkpoint open, identify the mistaken idea, and ask the returned follow-up question.
- `insufficient`: identify missing rubric ideas and ask for a more specific explanation.
- `out_of_scope`: explain that the answer cannot be judged from the teacher material and direct the learner back to the checkpoint.
- network/configuration/model error: show a retryable error and do not award XP or silently fall back to a fake success.

The existing keyword evaluator may remain only as a separately tested legacy helper; it will not make the central learner-pass decision after integration.

## Logging and privacy

Runtime calls are appended as JSON Lines with timestamp, request ID, model, prompt payload, raw OpenAI response text, parsed review, latency, and error status. Local ad-hoc runtime logs are ignored by Git.

The evaluation runner writes a separate sanitized run log under `eval/` because it is required as CP3 evidence. It uses only the curated golden cases, never the full raw data pack. API keys and authorization headers are never logged.

`codebase/data/`, `.env`, runtime logs, and generated temporary files are ignored. `.env.example` documents:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
AI_LOG_PATH=./logs/ai-calls.jsonl
```

## Golden set

`eval/golden_set.json` contains at least 20 cases. Every case has a stable ID, title, difficulty taxonomy, frequency group, provenance, checkpoint material, learner input, and explicit acceptance criteria.

Coverage rules:

- at least two cases for each difficult class: source of truth, ambiguity/missing information, out of scope/authority, and domain-specific behavior;
- 8–10 everyday/common cases;
- 2–4 rare edge cases;
- at least 10 cases derived from supplied data, each identified by `turn_id` or transcript paragraph ID;
- only short excerpts or paraphrases from protected data are included.

The case taxonomy and frequency labels are separate dimensions, so a common case can also exercise a difficult class. Acceptance is based on expected verdict, pass state, required semantic ideas, forbidden claims, source-ID validity, and whether feedback contains a usable next question where required.

## Evaluation runner and scoring

The runner loads the golden set, validates its coverage before making calls, executes cases sequentially through the shared review function, applies deterministic acceptance checks, and writes:

- a raw sanitized JSONL trace for every case;
- a machine-readable result JSON;
- `eval/run_results.md` with total, passed, failed, percentage, taxonomy breakdown, and per-failure analysis.

Pass rate is `passed cases / executed cases * 100`. Transport failures and malformed model outputs count as failed cases. If no API key is available or a run is interrupted, the runner exits non-zero and must not present partial output as a completed first run.

The first-run report must state the model and run timestamp. It will not claim a result before a real OpenAI call succeeds.

## Data flow

1. The learner submits an answer and explanation.
2. The browser sends checkpoint ID and learner content to the local API.
3. The server loads trusted teacher material for that checkpoint.
4. The shared reviewer builds the bounded prompt and calls OpenAI.
5. The server records the prompt and raw response, validates the JSON, and returns the parsed review.
6. The UI either awards completion or shows corrective direction and permits another attempt.
7. The evaluation runner invokes the same reviewer for every golden case and calculates results from predefined acceptance criteria.

## Error handling

- Missing API key: return a configuration error without calling the model.
- Unknown checkpoint: return 404 and do not forward arbitrary client-provided teacher content.
- Empty or oversized learner explanation: return 400 with a useful Vietnamese message.
- OpenAI timeout/rate limit/service error: log the error category, return a retryable 502/503 response, and do not award progress.
- Invalid structured output: count the evaluation case as failed and expose a generic retry message to the learner.
- Logging failure: report it explicitly because CP3 requires technical traceability; do not describe an unlogged call as verified.

## Testing strategy

Implementation follows test-driven development:

- unit tests for request validation, prompt construction, structured-output validation, and deterministic acceptance checks;
- API tests for missing key, unknown checkpoint, success, malformed model output, and upstream failures, with the external OpenAI transport injected at the narrow boundary;
- client tests for loading, corrective feedback, retry, error, and successful completion without duplicate XP;
- golden-set coverage validation tests;
- existing learning and Sites worker tests remain green;
- final verification runs all tests, the production build, Sites handoff tests, and the live 20-case evaluation when a usable API key is present.

## Repository artifacts

Files committed for CP3 will include:

- implementation and tests under `codebase/prototype/`;
- `.env.example` and ignore rules, never `.env` or a secret;
- `eval/golden_set.json`;
- the evaluation runner and acceptance logic;
- sanitized actual run logs and result JSON after a successful run;
- `eval/run_results.md` generated from those results;
- `eval/demo_video.txt` containing `https://youtu.be/hwB9LhtTXoQ?si=2pS_2H8H7JgtXhdD`.

The raw `codebase/data/` directory will remain local and ignored, matching the hackathon README's confidentiality rules.

## Completion criteria

The implementation is complete when:

1. A browser interaction visibly triggers a real OpenAI call and displays its returned assessment.
2. Incorrect explanations receive teacher-grounded corrective direction and a follow-up question.
3. Prompt and raw-response logs prove the call without exposing credentials.
4. The golden set passes structural coverage validation and contains at least 20 cases with at least 10 protected-data provenance IDs.
5. A successful live run produces truthful counts, pass rate, and failure analysis.
6. The demo video link is present in the repository.
7. Automated tests and the production build pass.
8. No API key or raw protected data is staged for commit.
