# Prototype verification — 2026-09-16

Source visual truth: user-supplied VLearn screenshot in the conversation (1522 × 701), with the approved quiz overlay and right-hand flashcard panel additions. No source image file was supplied on disk. This is an adaptation of the learning interface, not a pixel-exact recreation of the original Day02 slide.

Implementation: http://127.0.0.1:4173/.
Saved browser evidence: `qa/desktop-checkpoint.png` (1008 × 695, capture returned by browser). Desktop runtime reports CSS viewport 1536 × 695, devicePixelRatio 1.25 and full content height 1048; returned image is scaled full-content evidence and is not a 1:1 pixel reference. Earlier native viewport captures and mobile captures are visible in the tool transcript. Mobile runtime tested at 390 × 844, document width 375 excluding scrollbar, without horizontal overflow. No precision pixel-match claim is made.

## Visual findings and iteration

- Full-view: preserves white top bar, pale blue lesson sidebar, central framed player, blue/white learning palette and right tool rail. The open study panel, page title and concept pathway are approved feature additions, so central proportions differ from the closed-panel source.
- Focused quiz: three readable choices, short reason input, hint, skip and submit actions appear inside the player. Quiz body scrolls on short displays; all actions remain reachable. Mobile uses the same overlay and stacks the review panel below the player.
- P2 found during interaction QA: at an exact boundary the background slide and active transcript advanced to the next concept. Fixed by holding both to the active checkpoint. Post-fix browser state at 0:48 displays the Attention slide and its concluding transcript; saved screenshot shows that state.
- Replay polish: completion cannot duplicate XP or cards; replay feedback now says XP was already received.

## Required surfaces

- Typography: Segoe UI with Vietnamese support; navy headings, muted supporting copy. Reference font is not identified, so typography is an approximation. No clipped Vietnamese text observed in desktop/mobile quiz states.
- Spacing/layout: desktop sidebar/player/study-panel hierarchy, responsive stacked layout and scrollable quiz verified. Full source layout is intentionally extended with the review panel and concept pathway.
- Colors: white, pale blue, navy and restrained red reference accents preserved; green completion and amber hints added for game states.
- Images/assets: sample slide is editable lesson text and highlighting, with Phosphor library icons; no raster images required for the selected sample lesson content. Original Day02 illustration is replaced by the approved Attention lesson example, not reconstructed as an illustration.
- Copy: all primary content Vietnamese; sample transcript and simulated video are labeled, reasoning feedback explicitly states it is not AI semantic grading.

## Functional evidence

- Play from 0:35 pauses automatically at 0:48 and opens Attention quiz.
- Wrong answer A shows hint and retry; correct B with empty reason asks for reasoning.
- B with a reason shows explanation, source, one flashcard and 20 XP.
- Source button shows the 0:42–0:48 transcript; inline source is also available inside the feedback.
- Continue resumes playback and opens Flashcards. Card flip and self-assessed review status work.
- Checkpoint 2 skip resumes playback and marks it skipped without adding another card.
- Checkpoint 3 renders correctly at 390px. All choices, reasoning and footer actions are reachable.
- Browser error/warning logs returned an empty list.
- Final automated verification: 9 learning-model tests + 4 packaging tests passed; production build passed.
- Business_Canvas.md unchanged.

## Limits / follow-up polish

- Video is simulated; boundaries are pre-annotated sample transcript markers. Live video, transcript inference and AI generation are future integration work.
- Some secondary course/lab/navigation actions display informative messages because only this lesson is in scope.
- No backend or persistence after reload. Pixel-perfect reference-font matching was not tested.

final result: passed
