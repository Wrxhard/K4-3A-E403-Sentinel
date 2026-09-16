# Điểm dừng học tập — approved prototype design

The user approved a VLearn-like frontend: course navigation left, a central video player, transcript and flashcard review right. At a concept boundary playback pauses and an accessible quiz dialog overlays the player. Skipping resumes playback. A submitted answer receives a hint or explanation with a timestamped source; a personalized flashcard is then available for review.

Scope: one local, responsive React prototype. No supplied video or transcript-06 exists in the repository. Use explicitly labeled sample transcript and simulated playback, with three concept boundaries detected by deterministic completion markers. Do not present this as real AI inference. Allow seeking and an explicit next-checkpoint demo button.

Quiz states: choose answer and supply reason; wrong answer receives a hint and retry; correct without reason asks for reasoning; correct with reason receives sample feedback, source and one flashcard. Free-text reasoning is not semantically graded by AI. Skip is available throughout. A first correct completion earns 20 XP plus a 10 XP first-try bonus; replays earn zero. Encouraging cohort comparisons and a first-try accuracy leaderboard are visibly labeled demo data until connected to analytics. XP and ranking never claim mastery. Flashcards flip, can be marked understood or needing review, and do not duplicate on replay. Controls and content remain usable on narrow screens.

Verification: pure logic tests for boundary detection, missing explanation, hints, deduplication and skip; production build; browser walkthrough of core flow and responsive layout. Preserve Business_Canvas.md.
