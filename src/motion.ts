const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const prefersReducedMotion = (): boolean =>
  window.matchMedia(REDUCED_MOTION_QUERY).matches

/**
 * Scrolls the window to the top, honouring the user's motion preference.
 *
 * An explicit `behavior: 'smooth'` overrides the computed `scroll-behavior`,
 * so the `scroll-behavior: auto !important` rule in the stylesheet's
 * reduced-motion block cannot suppress a smooth scroll on its own. The
 * preference has to be resolved here instead.
 *
 * The check runs per call rather than once at module load so that a
 * preference changed mid-session is picked up.
 */
export const scrollToTop = (): void => {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  })
}
