import { cancelAnimations, prefersReducedMotion, readNumberVar } from '../dom'
import { simulateSpring } from '../spring'
import type { MotionEngine } from './shared'

export interface BadgeEngineOptions {
  bar: HTMLElement
  initialIndex: number
}

/**
 * Badge pop: badges spring out (to zero) when their tab activates and spring
 * back with an overshoot when it deactivates. Real damped-spring keyframes.
 */
export class BadgeEngine implements MotionEngine {
  private readonly bar: HTMLElement
  private currentIndex: number

  constructor({ bar, initialIndex }: BadgeEngineOptions) {
    this.bar = bar
    this.currentIndex = initialIndex
    this.badgeEntries().forEach(({ index, badge }) => {
      badge.style.transform = index === initialIndex ? 'scale(0)' : 'scale(1)'
    })
  }

  private badgeEntries(): Array<{ index: number; badge: HTMLElement }> {
    return Array.from(
      this.bar.querySelectorAll<HTMLElement>('[data-tab-index]'),
    )
      .sort(
        (a, b) =>
          Number(a.dataset.tabIndex ?? 0) - Number(b.dataset.tabIndex ?? 0),
      )
      .flatMap((tab) => {
        const badge = tab.querySelector<HTMLElement>('[data-badge]')
        return badge
          ? [{ index: Number(tab.dataset.tabIndex ?? 0), badge }]
          : []
      })
  }

  private badgeAt(index: number): HTMLElement | null {
    return this.badgeEntries().find((entry) => entry.index === index)?.badge ?? null
  }

  private animateBadge(badge: HTMLElement, from: number, to: number, inDuration: boolean) {
    cancelAnimations(badge)
    badge.style.transform = `scale(${from})`

    if (prefersReducedMotion()) {
      badge.style.transform = `scale(${to})`
      return
    }

    const stiffness = readNumberVar(this.bar, '--tb-badge-stiffness', inDuration ? 700 : 500)
    const damping = readNumberVar(this.bar, '--tb-badge-damping', inDuration ? 16 : 26)
    const frames = simulateSpring(
      from,
      to,
      { stiffness, damping, mass: 1 },
      {
        duration: inDuration ? 680 : 360,
        frames: 26,
        clampMin: 0,
      },
    )

    badge.animate(
      frames.map((frame) => ({
        offset: frame.offset,
        transform: `scale(${Math.max(0, frame.value).toFixed(4)})`,
      })),
      {
        duration: inDuration ? 680 : 360,
        easing: 'linear',
        fill: 'forwards',
      },
    )
  }

  setActive(index: number) {
    if (index === this.currentIndex) return
    const previous = this.currentIndex
    this.currentIndex = index
    const incoming = this.badgeAt(previous)
    const outgoing = this.badgeAt(index)
    if (incoming) this.animateBadge(incoming, 0, 1, true)
    if (outgoing) this.animateBadge(outgoing, 1, 0, false)
  }

  destroy() {
    this.badgeEntries().forEach(({ badge }) => cancelAnimations(badge))
  }
}
