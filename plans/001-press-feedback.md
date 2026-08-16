# 001 — Add press feedback to every pressable surface

- **Status**: TODO
- **Commit**: a3e8b75
- **Severity**: HIGH
- **Category**: Physicality & origin (press feedback) / Missed opportunities
- **Estimated scope**: 1 file (`src/styles.css`), ~40 lines added

## Problem

This app is a mobile-first PWA designed for an iPhone home screen (see `README.md`). On touch there is no hover — the only feedback channel for a tap is the press state.

`src/styles.css:48` disables the platform's built-in press feedback for every button and link:

```css
/* src/styles.css:48-51 — current */
button,
a {
  -webkit-tap-highlight-color: transparent;
}
```

Nothing replaces it. A grep for `:active` across `src/` returns zero matches, and a grep for `transition` across the whole project returns zero matches. The result: all 28 `onClick` handlers in `src/components/` produce **no visual acknowledgment whatsoever** at the moment of touch. The user's finger lands and the interface stays perfectly still until the state change renders.

This is the single highest-leverage motion fix in the codebase — it affects every interaction on every screen, and it is a repair rather than a polish item: the app removed an affordance and did not substitute one.

Affected pressable rules, all in `src/styles.css`:

| Selector | Line | Notes |
| --- | --- | --- |
| `.search-field button` | 173 | clear-search "×" |
| `.icon-button` | 119 | back / settings / backup, 48px circle |
| `.tag-chip` | 197 | filter chips |
| `.text-button` | 234 | text-only ("Clear filters", "#tag") |
| `.card-summary` | 257 | large card expand target |
| `.button` | 347 | primary / secondary / danger |
| `.fab` | 378 | fixed "Add exercise" |
| `.tab-bar button` | 425 | bottom nav |
| `.category-card` | 456 | large card |
| `.category-toggle` | 494 | large checkbox row |

## Target

Introduce the shared easing token this repo currently lacks, then give every pressable a subtle press transform.

```css
/* target — add to the existing :root block in src/styles.css */
:root {
  /* …existing custom properties unchanged… */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}
```

```css
/* target — new block, place after the .visually-hidden rule (src/styles.css:660)
   and before the @media (min-width: 640px) block (src/styles.css:662) */

.search-field button,
.icon-button,
.tag-chip,
.card-summary,
.button,
.fab,
.tab-bar button,
.category-card,
.category-toggle {
  transition: transform 160ms var(--ease-out);
}

.search-field button:active,
.icon-button:active,
.tag-chip:active,
.button:active,
.fab:active,
.tab-bar button:active {
  transform: scale(0.97);
}

/* Large surfaces: a 3% scale on a full-width card reads as the card shrinking
   rather than as pressure. 2% is the correct amount at this size. */
.card-summary:active,
.category-card:active,
.category-toggle:active {
  transform: scale(0.98);
}

/* Text-only buttons have no box to compress; scaling bare text looks like a
   font glitch. Dim instead. */
.text-button {
  transition: opacity 160ms var(--ease-out);
}

.text-button:active {
  opacity: 0.6;
}
```

Reduced-motion handling — append inside the **existing** block at `src/styles.css:715`:

```css
/* target — inside the existing @media (prefers-reduced-motion: reduce) block */
@media (prefers-reduced-motion: reduce) {
  /* …existing scroll-behavior rule unchanged… */

  /* Press feedback is the app's only tap acknowledgment, so it must survive.
     Swap the transform for an opacity dip: feedback without movement. */
  .search-field button:active,
  .icon-button:active,
  .tag-chip:active,
  .card-summary:active,
  .button:active,
  .fab:active,
  .tab-bar button:active,
  .category-card:active,
  .category-toggle:active {
    transform: none;
    opacity: 0.7;
  }
}
```

Values are fixed by the audit playbook: press feedback is `100–160ms`, scale stays in `0.95–0.98`, and entering/exiting motion uses the strong `ease-out` curve `cubic-bezier(0.23, 1, 0.32, 1)`.

## Repo conventions to follow

- There is **no** CSS token file and **no** CSS-in-JS. All styling lives in the single flat stylesheet `src/styles.css`, imported once from `src/main.tsx`. Add the easing token to the existing `:root` block at `src/styles.css:1-22`, alongside `--accent`, `--line`, `--shadow`, etc.
- The stylesheet uses **no CSS nesting anywhere**. Write flat, top-level rules only.
- Exemplar for how this file groups related selectors: `src/styles.css:338-345` (`.card-actions, .form-actions, .stacked-actions`) — comma-separated selector lists sharing one declaration block.
- Property order in this file runs roughly: layout → box → color → typography. Match it loosely; do not reformat existing rules.

## Steps

1. In `src/styles.css`, inside the `:root` block (ends at line 22), add `--ease-out: cubic-bezier(0.23, 1, 0.32, 1);` as the final declaration, after `--shadow`.
2. In `src/styles.css`, insert the transition + `:active` rules from the Target section immediately after the `.visually-hidden` rule (currently ends line 660) and before `@media (min-width: 640px)` (currently line 662).
3. In `src/styles.css`, inside the existing `@media (prefers-reduced-motion: reduce)` block (line 715), append the reduced-motion override from the Target section. Do not remove or alter the existing `scroll-behavior` rule.

## Boundaries

- Do NOT touch any file in `src/components/`. This plan is CSS-only; no markup or TSX changes.
- Do NOT add any `:hover` state. This is a touch-first PWA; hover states fire false positives on tap and are out of scope for this plan.
- Do NOT remove `-webkit-tap-highlight-color: transparent` at `src/styles.css:50` — the new `:active` states are its intended replacement, and restoring the native highlight would double up.
- Do NOT change any existing color, size, or layout declaration.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since commit a3e8b75), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run build` completes without error (runs `tsc -b && vite build`). `npm run lint` reports no new problems. Neither touches CSS semantics, so they only confirm nothing else broke.
- **Feel check**: run `npm run dev`, open the printed URL, and open DevTools device emulation with touch enabled (or load it on a phone on the same network):
  - Press and hold any `.button`, the `.fab`, and an `.icon-button`. Each must visibly compress on finger-down and spring back on release. The release should feel immediate, not floaty.
  - Press a `.category-card` and a `.card-summary`. The compression should read as *pressure on a surface*, not as the card resizing. If it looks like a resize, confirm the 0.98 rule is applying and not being overridden by the 0.97 rule.
  - Press "Clear filters" (`.text-button`). It should dim, not scale.
  - In DevTools → Animations panel, set playback speed to 10% and press a button. Confirm the scale eases *out* — fast at the start, settling at the end. If it creeps slowly then rushes, the curve is inverted and wrong.
  - In DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", press a button. Confirm it dims and does **not** scale.
- **Done when**: every selector in the Problem table shows a press state, `--ease-out` is defined once in `:root`, and no component file has been modified (`git diff --name-only` lists only `src/styles.css`).
