// Honour the user's OS-level "reduce motion" setting. Returns true when the
// user has asked for minimal animation, so callers can skip count-ups, slides
// and staggered reveals that would otherwise delay the information they want.
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
