import { cancelAnimations, createRafLoop, prefersReducedMotion, readNumberVar } from '../dom'
import { measureTabBar, observeTabBar } from '../layout'
import type { TabBarMetrics } from '../layout'
import { Spring, simulateSpring } from '../spring'
import type { MotionEngine } from './shared'

export interface RippleEngineOptions {
  bar: HTMLElement
  indicator: HTMLElement
  surface: HTMLElement
  rings: HTMLElement[]
  initialIndex: number
}

/** Expanding wave rings, expressed as pure WAAPI keyframes. */
export function rippleRingKeyframes() {
  return [
    { transform: 'scale(0.18)', opacity: 0.7 },
    { transform: 'scale(0.9)', opacity: 0.32, offset: 0.55 },
    { transform: 'scale(1.55)', opacity: 0 },
  ]
}

/**
 * Ripple fill: the gradient pill springs between tabs and re-floods its centre
 * with an expanding surface plus two offset wave rings on every activation.
 */
export class RippleEngine implements MotionEngine {
  private readonly bar: HTMLElement
  private readonly indicator: HTMLElement
  private readonly surface: HTMLElement
  private readonly rings: HTMLElement[]
  private readonly x: Spring
  private readonly loop = createRafLoop((dt) => this.frame(dt))
  private metrics: TabBarMetrics
  private currentIndex: number
  private pillWidth: number
  private readonly stopObserving: () => void

  constructor({ bar, indicator, surface, rings, initialIndex }: RippleEngineOptions) {
    this.bar = bar
    this.indicator = indicator
    this.surface = surface
    this.rings = rings
    this.currentIndex = initialIndex
    this.metrics = measureTabBar(bar)
    this.pillWidth = indicator.offsetWidth || 46
    this.x = new Spring({ stiffness: 420, damping: 30, mass: 1 }, this.pillLeft(initialIndex))
    this.apply()

    this.stopObserving = observeTabBar(bar, (metrics) => {
      this.metrics = metrics
      this.pillWidth = this.indicator.offsetWidth || this.pillWidth
      this.x.snap(this.pillLeft(this.currentIndex))
      this.apply()
    }).destroy
  }

  private centerOf(index: number): number {
    const tab =
      this.metrics.tabs.find((item) => item.index === index) ??
      this.metrics.tabs[index] ??
      this.metrics.tabs[0]
    return tab ? tab.centerX : this.metrics.width / 2
  }

  private pillLeft(index: number): number {
    return this.centerOf(index) - this.pillWidth / 2
  }

  private apply() {
    this.indicator.style.setProperty('--tb-ripple-x', `${this.x.value}px`)
  }

  private frame(dt: number): boolean {
    const settled = this.x.step(dt)
    this.apply()
    return !settled
  }

  private burst() {
    if (prefersReducedMotion()) return
    const duration = readNumberVar(this.bar, '--tb-ripple-duration', 620)

    cancelAnimations(this.surface)
    const fillFrames = simulateSpring(0, 1, { stiffness: 420, damping: 17, mass: 1 }, {
      duration: Math.min(520, duration),
      frames: 24,
    }).map((frame) => ({
      offset: frame.offset,
      transform: `scale(${(0.94 + frame.value * 0.06).toFixed(4)})`,
      clipPath: `circle(${(12 + frame.value * 96).toFixed(2)}% at 50% 50%)`,
    }))
    this.surface.animate(fillFrames, {
      duration: Math.min(520, duration),
      easing: 'linear',
      fill: 'none',
    })

    this.rings.forEach((ring, index) => {
      cancelAnimations(ring)
      ring.animate(rippleRingKeyframes(), {
        duration: Math.max(280, duration - index * 70),
        delay: index * 70,
        easing: 'cubic-bezier(.2,.7,.3,1)',
        fill: 'none',
      })
    })
  }

  setActive(index: number) {
    if (index === this.currentIndex) return
    this.currentIndex = index
    this.metrics = measureTabBar(this.bar)
    this.pillWidth = this.indicator.offsetWidth || this.pillWidth

    if (prefersReducedMotion()) {
      this.x.snap(this.pillLeft(index))
      this.apply()
      return
    }

    const stiffness = readNumberVar(this.bar, '--tb-ripple-stiffness', 430)
    const damping = readNumberVar(this.bar, '--tb-ripple-damping', 30)
    this.x.reconfigure({ stiffness, damping, mass: 1 })
    this.x.setTarget(this.pillLeft(index))
    this.loop.start()
    this.burst()
  }

  destroy() {
    this.loop.stop()
    this.stopObserving()
    cancelAnimations(this.surface)
    this.rings.forEach(cancelAnimations)
  }
}
