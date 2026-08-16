# 006 — Spend the delight budget on the first-run empty state

- **Status**: TODO
- **Commit**: a3e8b75
- **Severity**: LOW
- **Category**: Missed opportunities (delight, rare/first-time tier)
- **Estimated scope**: 2 files (`src/components/ExerciseList.tsx`, `src/styles.css`), ~35 lines

## Prerequisite

**Plan `001-press-feedback.md` must be executed first.** It defines `--ease-out` in the `:root` block of `src/styles.css`. If `--ease-out: cubic-bezier(0.23, 1, 0.32, 1);` is not present in `src/styles.css`, STOP and execute plan 001 first.

## Problem

The very first thing a new user sees after installing this PWA is the empty library, rendered completely flat:

```tsx
/* src/components/ExerciseList.tsx:47-59 — current */
if (exercises.length === 0) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">{hasFilters ? '⌕' : '+'}</span>
      <h2>{hasFilters ? 'No matches' : 'Your library is empty'}</h2>
      <p>
        {hasFilters
          ? 'Try another search or tag.'
          : 'Add an exercise to keep its cues and source video close at hand.'}
      </p>
    </div>
  )
}
```

This is a rare, first-impression moment — the tier where the delight budget is explicitly allowed to be spent, and this app currently spends none of it anywhere.

**The critical subtlety:** this one component renders two states at completely different frequency tiers, distinguished only by `hasFilters`:

| Branch | When | Frequency tier | Animate? |
| --- | --- | --- | --- |
| `!hasFilters` — "Your library is empty" | First run, before any exercise exists | Rare / first-time | **Yes** |
| `hasFilters` — "No matches" | Mid-search, between keystrokes | Constant while typing | **Never** |

Animating `.empty-state` as a whole would make the "No matches" state fade in and out on every keystroke of a search — a flicker directly in the user's field of view while they are typing. The same class is also used by two other screens (`src/components/CategoryList.tsx:33` and `src/components/CategorySettings.tsx:48`), which must stay flat for the same reason: they are reachable by ordinary tab navigation.

## Target

Add a modifier class that scopes the animation to the first-run branch only, and animate the badge and copy with a short stagger.

Markup — `src/components/ExerciseList.tsx`, replacing lines 47-59:

```tsx
/* target */
if (exercises.length === 0) {
  return (
    <div className={hasFilters ? 'empty-state' : 'empty-state is-first-run'}>
      <span aria-hidden="true">{hasFilters ? '⌕' : '+'}</span>
      <h2>{hasFilters ? 'No matches' : 'Your library is empty'}</h2>
      <p>
        {hasFilters
          ? 'Try another search or tag.'
          : 'Add an exercise to keep its cues and source video close at hand.'}
      </p>
    </div>
  )
}
```

Only the `className` line changes; the contents are untouched.

CSS — new rules in `src/styles.css`, placed after the existing `.empty-state p` rule (currently ends line 547):

```css
/* target */
.empty-state.is-first-run > span,
.empty-state.is-first-run h2,
.empty-state.is-first-run p {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition:
    opacity 300ms var(--ease-out),
    transform 300ms var(--ease-out);
}

.empty-state.is-first-run h2 {
  transition-delay: 60ms;
}

.empty-state.is-first-run p {
  transition-delay: 120ms;
}

@starting-style {
  .empty-state.is-first-run > span {
    opacity: 0;
    transform: scale(0.94);
  }

  .empty-state.is-first-run h2,
  .empty-state.is-first-run p {
    opacity: 0;
    transform: translateY(10px);
  }
}
```

Reduced-motion handling — append inside the **existing** block at `src/styles.css:715`:

```css
/* target — inside the existing @media (prefers-reduced-motion: reduce) block */
.empty-state.is-first-run > span,
.empty-state.is-first-run h2,
.empty-state.is-first-run p {
  transition: opacity 300ms var(--ease-out);
  transform: none;
  transition-delay: 0s;
}
```

Notes on the values, all fixed by the audit playbook:

- The badge starts at `scale(0.94)`, **never `scale(0)`** — nothing in the real world appears from nothing.
- Stagger steps are `60ms`, inside the `30–80ms` band. The stagger is decorative and must never gate interaction.
- `300ms` is at the top of the UI budget, which is acceptable here precisely because this is the rare tier. Do not extend it further.

## Repo conventions to follow

- Single flat stylesheet `src/styles.css`; **no CSS nesting anywhere** in this file.
- The `is-*` modifier prefix is this repo's established convention for state classes. Exemplars: `src/components/ExerciseList.tsx:69` (`'exercise-card is-expanded'`), plus `.tag-chip.is-selected` (`src/styles.css:211`) and `.tab-bar button.is-active` (`src/styles.css:445`). Follow the same ternary-on-className shape used at `ExerciseList.tsx:69`.
- The badge is targeted as `> span` because that is how the existing stylesheet already addresses it — `src/styles.css:527-537`:
  ```css
  .empty-state > span {
    display: grid;
    width: 54px;
    height: 54px;
    /* … */
  }
  ```
  Match that selector shape rather than inventing a class for it.

## Steps

1. In `src/components/ExerciseList.tsx`, change the `className="empty-state"` on line 49 to the ternary shown in the Target section. Change nothing else in that block.
2. In `src/styles.css`, add the three `.empty-state.is-first-run` rules and the top-level `@starting-style` block from the Target section, placed after the existing `.empty-state p` rule (currently ends line 547).
3. In `src/styles.css`, inside the existing `@media (prefers-reduced-motion: reduce)` block (line 715), append the reduced-motion override from the Target section.

## Boundaries

- **Do NOT animate `.empty-state` unscoped.** The modifier class is the entire point of this plan. An unscoped rule makes the "No matches" state flicker on every keystroke during a search, and makes the Categories and Category-settings empty states animate on ordinary tab navigation.
- Do NOT touch `src/components/CategoryList.tsx` or `src/components/CategorySettings.tsx`. Their empty states stay flat.
- Do NOT modify the existing `.empty-state`, `.empty-state > span`, `.empty-state h2`, or `.empty-state p` rules (`src/styles.css:519-547`). Add new rules only.
- Do NOT add bounce, a spring, or a `scale` above `1`. This app's personality is a calm reference tool; the delight here is a gentle arrival, not a flourish.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since commit a3e8b75), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run build` (runs `tsc -b && vite build`) must pass. `npm run lint` reports no new problems.
- **Feel check**: run `npm run dev`. To reach a genuinely empty library, open DevTools → Application → Local Storage, delete the app's key, and reload.
  - The badge should scale up gently while the heading and body text rise just behind it. It should feel like the page settling, not like a performance.
  - **The critical regression check**: add one exercise, then type a nonsense query in the search field (e.g. `zzzz`) so the "No matches" state appears. Keep typing and deleting characters. That state must be completely static — **no fade, no movement, on any keystroke**. Any flicker here means the modifier scoping was not applied and must be fixed.
  - Go to the Categories tab with no categories configured, and to Category settings with no tags. Both empty states must render flat.
  - In DevTools → Animations panel at 10% playback, confirm the badge never starts from invisible-nothing — it should already have a visible size when it begins.
  - In DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", reload on the empty library: the content should fade in together with no travel and no stagger.
- **Done when**: the first-run empty library animates once on arrival, the "No matches" state never animates while typing, and the two other empty states are unchanged.
