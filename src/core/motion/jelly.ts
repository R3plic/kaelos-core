import {
  cancelAnimations,
  clamp,
  prefersReducedMotion,
  readNumberVar,
} from '../dom'
import type { MotionEngine } from './shared'

/**
 * A decaying squash-and-stretch curve: wide/short on impact, a small hop,
 * then alternating jelly wobble that settles back to identity.
 */
export function jellyKeyframes(
  intensity = 0.34,
  jump = 9,
  frames = 30,
): Keyframe[] {
  const out: Keyframe[] = []
  for (let i = 0; i < frames; i += 1) {
    const t = i / (frames - 1)
    const envelope = Math.exp(-5.4 * t)
    const wave = Math.cos(Math.PI * 2 * 2.6 * t)
    const sx = 1 + intensity * envelope * wave
    const sy = 1 - intensity * envelope * wave
    const lift = -jump * Math.sin(Math.PI * clamp(t * 1.8, 0, 1)) * (1 - t)
    out.push({
      offset: t,
      transform: `translate3d(0, ${lift.toFixed(3)}px, 0) scale(${sx.toFixed(
        4,
      )}, ${sy.toFixed(4)})`,
    })
  }
  return out
}

export interface JellyEngineOptions {
  bar: HTMLElement
  initialIndex: number
}

/**
 * Jelly icon: one-shot squash-and-stretch on the newly activated icon.
 * The animation is pure transform work (compositor-friendly).
 */
export class JellyEngine implements MotionEngine {
  private readonly bar: HTMLElement
  private currentIndex: number

  constructor({ bar, initialIndex }: JellyEngineOptions) {
    this.bar = bar
    this.currentIndex = initialIndex
  }

  private icon(index: number): HTMLElement | null {
    return this.bar.querySelector<HTMLElement>(
      `[data-tab-index="${index}"] [data-jelly-icon]`,
    )
  }

  private animate(index: number) {
    const icon = this.icon(index)
    if (!icon || prefersReducedMotion()) return
    cancelAnimations(icon)
    const intensity = readNumberVar(this.bar, '--tb-jelly-intensity', 0.36)
    const jump = readNumberVar(this.bar, '--tb-jelly-jump', 9)
    const duration = readNumberVar(this.bar, '--tb-jelly-duration', 780)
    icon.animate(jellyKeyframes(intensity, jump), {
      duration,
      easing: 'linear',
      fill: 'none',
    })
  }

  setActive(index: number) {
    if (index === this.currentIndex) return
    this.currentIndex = index
    this.animate(index)
  }

  /** Replay the effect for the current tab (used by demo controls). */
  replay() {
    this.animate(this.currentIndex)
  }

  destroy() {
    this.bar
      .querySelectorAll<HTMLElement>('[data-jelly-icon]')
      .forEach((icon) => cancelAnimations(icon))
  }
}
