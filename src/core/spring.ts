import type { SpringConfig } from './types'

/** A numerically integrated damped spring. Values are stepped in sub-frames for stability. */
export class Spring {
  value: number
  velocity: number
  target: number
  config: SpringConfig

  constructor(config: SpringConfig, value = 0) {
    this.config = { ...config }
    this.value = value
    this.velocity = 0
    this.target = value
  }

  setTarget(target: number) {
    this.target = target
  }

  /** Jump instantaneously (used on mount, resize and reduced-motion). */
  snap(value: number) {
    this.value = value
    this.target = value
    this.velocity = 0
  }

  reconfigure(config: SpringConfig) {
    this.config = { ...config }
  }

  get delta() {
    return this.target - this.value
  }

  /** Advance by `dt` seconds using fixed 240 Hz substeps. Returns true when settled. */
  step(dt: number): boolean {
    const { stiffness, damping, mass } = this.config
    const safeMass = Math.max(0.01, mass)
    const subSteps = Math.max(1, Math.ceil(dt / (1 / 240)))
    const h = dt / subSteps

    for (let i = 0; i < subSteps; i += 1) {
      const accel =
        (-stiffness * (this.value - this.target) - damping * this.velocity) / safeMass
      this.velocity += accel * h
      this.value += this.velocity * h
    }

    const settled =
      Math.abs(this.target - this.value) < 0.005 && Math.abs(this.velocity) < 0.02
    if (settled) {
      this.value = this.target
      this.velocity = 0
    }
    return settled
  }
}

export const springs = {
  slide: { stiffness: 380, damping: 34, mass: 1 },
  worm: { stiffness: 300, damping: 25, mass: 1 },
  hop: { stiffness: 520, damping: 26, mass: 1 },
  jelly: { stiffness: 620, damping: 10, mass: 1 },
  badge: { stiffness: 700, damping: 17, mass: 1 },
  swing: { stiffness: 120, damping: 7, mass: 1 },
} satisfies Record<string, SpringConfig>

export interface SpringFrame {
  offset: number
  value: number
}

export interface SimulateSpringOptions {
  duration?: number
  frames?: number
  clampMin?: number
  clampMax?: number
}

/**
 * Bake a spring simulation into keyframes. Used for one-shot WAAPI effects
 * (badges, jelly wobble) so the overshoot is real spring physics, not easing guesses.
 */
export function simulateSpring(
  from: number,
  to: number,
  config: SpringConfig,
  { duration = 700, frames = 28, clampMin, clampMax }: SimulateSpringOptions = {},
): SpringFrame[] {
  const spring = new Spring(config, from)
  spring.velocity = 0
  spring.setTarget(to)

  const step = duration / (frames - 1)
  const out: SpringFrame[] = [{ offset: 0, value: from }]

  for (let i = 1; i < frames; i += 1) {
    let settled = false
    let elapsed = 0
    while (elapsed < step / 1000) {
      const slice = Math.min(1 / 60, step / 1000 - elapsed)
      settled = spring.step(slice)
      elapsed += slice
      if (settled) break
    }
    let value = spring.value
    if (clampMin !== undefined) value = Math.max(clampMin, value)
    if (clampMax !== undefined) value = Math.min(clampMax, value)
    out.push({ offset: i / (frames - 1), value })
    if (settled) {
      // Pad remaining time at the final value so the timing function stays linear.
      for (let j = i + 1; j < frames; j += 1) {
        out.push({ offset: j / (frames - 1), value: to })
      }
      break
    }
  }

  const last = out[out.length - 1]
  if (last.offset >= 1) {
    last.value = to
  } else if (last.value !== to) {
    out.push({ offset: 1, value: to })
  }
  return out
}
