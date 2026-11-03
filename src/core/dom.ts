/** Small DOM, math and preference helpers shared by every motion engine. */

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const lerp = (from: number, to: number, t: number) => from + (to - from) * t

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/** Sanitize an arbitrary string into a valid, stable HTML id fragment. */
export const toDomId = (value: string) =>
  value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'tab'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Read a numeric CSS custom property (with a sensible fallback). */
export function readNumberVar(el: Element, name: string, fallback: number): number {
  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  if (!raw) return fallback
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function readStringVar(el: Element, name: string, fallback: string): string {
  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  return raw || fallback
}

/** Batch style custom-property writes into one read-friendly call. */
export function setCssVars(
  el: HTMLElement,
  vars: Record<string, string | number>,
): void {
  for (const [name, value] of Object.entries(vars)) {
    el.style.setProperty(name, typeof value === 'number' ? String(value) : value)
  }
}

/** requestAnimationFrame loop with a clamped delta and automatic stop. */
export function createRafLoop(
  tick: (dt: number, now: number) => boolean,
): { start: () => void; stop: () => void; isRunning: () => boolean } {
  let frame = 0
  let last = 0

  const run = (now: number) => {
    const dt = last === 0 ? 1 / 60 : Math.min((now - last) / 1000, 1 / 30)
    last = now
    if (tick(dt, now)) {
      frame = requestAnimationFrame(run)
    } else {
      frame = 0
      last = 0
    }
  }

  return {
    start() {
      if (frame) return
      last = 0
      frame = requestAnimationFrame(run)
    },
    stop() {
      if (!frame) return
      cancelAnimationFrame(frame)
      frame = 0
      last = 0
    },
    isRunning: () => frame !== 0,
  }
}

/** Cancel every running WAAPI animation on an element. */
export function cancelAnimations(el: Element | null | undefined): void {
  if (!el || typeof el.getAnimations !== 'function') return
  for (const animation of el.getAnimations()) animation.cancel()
}
