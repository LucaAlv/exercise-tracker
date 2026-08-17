# Animation plans

Six plans derived from an animation-opportunity sweep of this repo at commit `a3e8b75`.

Baseline at that commit: **the project contains no motion code at all** — zero `transition`, zero `@keyframes`, zero easing tokens, no motion library. The only `prefers-reduced-motion` block (`src/styles.css:715`) sets `scroll-behavior` and nothing else. These plans add motion where its absence actively hurts, and deliberately leave the rest alone.

## Plans

| # | Title | Severity | Files | Status |
| --- | --- | --- | --- | --- |
| [001](001-press-feedback.md) | Add press feedback to every pressable surface | HIGH | `styles.css` | DONE |
| [002](002-card-expand-collapse.md) | Animate the exercise card expand/collapse | MEDIUM | `styles.css`, `ExerciseList.tsx` | DONE |
| [003](003-subpage-enter.md) | Give pushed subpages an entrance | MEDIUM | `styles.css` | DONE |
| [004](004-thumbnail-load-fade.md) | Fade in exercise thumbnails on load | LOW | `styles.css`, `ExerciseList.tsx` | DONE |
| [005](005-backup-feedback-enter.md) | Announce backup status messages and the import prompt | LOW | `styles.css` | DONE |
| [006](006-first-run-empty-state.md) | Spend the delight budget on the first-run empty state | LOW | `styles.css`, `ExerciseList.tsx` | DONE |

## Recommended execution order

Execute in numeric order: **001 → 002 → 003 → 005 → 006 → 004**.

001 first is non-negotiable (see Dependencies). After that, 002 and 003 carry the most user-visible value. 004 is listed last on purpose — it is the fiddliest change and the lowest leverage, and skipping it entirely is a defensible call.

## Dependencies

**001 is a hard prerequisite for all five other plans.** It creates the `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` token in the `:root` block of `src/styles.css`. Every other plan references that token and will render motion with an invalid `transition-timing-function` if it is missing. Each plan states this in a Prerequisite section.

There are no dependencies among plans 002–006; they touch disjoint selectors and can be executed in any order once 001 has landed.

## Execute these sequentially, not in parallel

Two shared edit points make concurrent execution unsafe:

1. **All six plans append to the same `@media (prefers-reduced-motion: reduce)` block** at `src/styles.css:715`. Parallel agents will conflict there.
2. **Plans 002, 004, and 006 all modify `src/components/ExerciseList.tsx`** — different regions of it, but the same file.

## Line numbers drift after the first plan lands

Every plan cites `src/styles.css` line numbers as they exist at commit `a3e8b75`. Plan 001 inserts roughly 40 lines into that file, so from plan 002 onward **the cited line numbers will no longer be accurate**.

This is expected and is not drift in the sense the plans' "STOP and report" rule is guarding against. Locate each edit site by the **selector or anchor text** quoted in the plan (e.g. "after the existing `.card-details` rule", "inside the existing `@media (prefers-reduced-motion: reduce)` block"), not by absolute line number. Only stop and report if the quoted selector or code excerpt itself cannot be found, or does not match what the plan says it contains.

## Shared conventions across all six plans

- All styling lives in the single flat stylesheet `src/styles.css`. There is **no CSS nesting anywhere** in that file — write flat, top-level rules, including top-level `@starting-style` at-rules.
- State classes use the `is-*` prefix (`is-expanded`, `is-selected`, `is-active`, and the new `is-first-run`).
- No new dependencies in any plan. Everything here is plain CSS plus, in three plans, a small markup change.
- Reduced motion means gentler, not zero: every plan that moves something keeps its opacity transition and drops the transform under `prefers-reduced-motion: reduce`.
- No plan adds a `:hover` state. This is a touch-first iPhone PWA; hover fires false positives on tap.

## Deliberately excluded

Recorded so they are not "fixed" later by mistake — each was considered and rejected:

- **Tab bar indicator transitions** (`src/components/TabBar.tsx`) — core navigation with two tabs, toggled constantly. Instant is correct.
- **Enter/exit animation on the search-filtered list** (`src/components/LibraryView.tsx:113`) — fires on every keystroke over data the user is actively reading.
- **Staggered entrance on the category grid** (`src/components/CategoryList.tsx:46`) — `CategoryList` remounts on every tab switch, so the stagger would replay constantly.
- **Hold-to-delete replacing `window.confirm`** (`src/App.tsx:63`) — the destructive action is already guarded, and swapping a native dialog for a custom gesture is a product decision, not a motion fix.
- **Easing the search field's `:focus-within` ring** (`src/styles.css:157`) — focus indicators should land instantly.

## Known issue, not covered by these plans — FIXED

`src/App.tsx:81` and `src/components/LibraryView.tsx:120` called `window.scrollTo({ top: 0, behavior: 'smooth' })`. An explicit `behavior: 'smooth'` overrides the computed `scroll-behavior`, so the `scroll-behavior: auto !important` rule in the reduced-motion block did **not** suppress these scrolls for users who have requested reduced motion.

Fixed separately from the six plans, as anticipated. Both call sites now use `scrollToTop()` from `src/motion.ts`, which resolves `window.matchMedia('(prefers-reduced-motion: reduce)').matches` at call time and passes `behavior: 'auto'` when it matches. The check runs per call rather than once at module load, so a preference changed mid-session is respected.
