import {
  clamp,
  createRafLoop,
  prefersReducedMotion,
  readNumberVar,
} from '../dom'
import { measureTabBar, observeTabBar } from '../layout'
import type { TabBarMetrics } from '../layout'
import { Spring } from '../spring'
import type { MotionEngine } from './shared'

export interface SpotlightEngineOptions {
  bar: HTMLElement
  lamp: HTMLElement
  initialIndex: number
}

/**
 * Spotlight: the lamp tracks the active tab with a spring and receives an
 * angular impulse on every move, so the cone swings from its top pivot.
 */
export class SpotlightEngine implements MotionEngine {
  private readonly bar: HTMLElement
  private readonly lamp: HTMLElement
  private readonly x: Spring
  private readonly angle: Spring
  private readonly loop = createRafLoop((dt) => this.frame(dt))
  private metrics: TabBarMetrics
  private currentIndex: number
  private readonly stopObserving: () => void

  constructor({ bar, lamp, initialIndex }: SpotlightEngineOptions) {
    this.bar = bar
    this.lamp = lamp
    this.currentIndex = initialIndex
    this.metrics = measureTabBar(bar)
    this.x = new Spring({ stiffness: 300, damping: 24, mass: 1 }, this.tabCenter(initialIndex))
    this.angle = new Spring({ stiffness: 110, damping: 7, mass: 1 }, 0)
    this.apply()

    this.stopObserving = observeTabBar(bar, (metrics) => {
      this.metrics = metrics
      this.x.snap(this.tabCenter(this.currentIndex))
      this.angle.snap(0)
      this.apply()
    }).destroy
  }

  private tabCenter(index: number): number {
    const tab =
      this.metrics.tabs.find((item) => item.index === index) ??
      this.metrics.tabs[index] ??
      this.metrics.tabs[0]
    return tab ? tab.centerX : this.metrics.width / 2
  }

  private apply() {
    const swing = clamp(this.angle.value, -22, 22)
    this.lamp.style.setProperty('--tb-spot-x', `${this.x.value}px`)
    this.lamp.style.setProperty('--tb-spot-rot', `${swing}deg`)
    this.lamp.style.setProperty(
      '--tb-spot-lift',
      `${Math.min(4, Math.abs(this.angle.value) * 0.3)}px`,
    )
  }

  private frame(dt: number): boolean {
    const settledX = this.x.step(dt)
    const settledAngle = this.angle.step(dt)
    this.apply()
    return !(settledX && settledAngle)
  }

  setActive(index: number) {
    if (index === this.currentIndex) return
    this.currentIndex = index
    this.metrics = measureTabBar(this.bar)
    const target = this.tabCenter(index)

    if (prefersReducedMotion()) {
      this.x.snap(target)
      this.angle.snap(0)
      this.apply()
      return
    }

    const direction = target >= this.x.value ? 1 : -1
    const swing = readNumberVar(this.bar, '--tb-spot-swing', 12)
    const stiffness = readNumberVar(this.bar, '--tb-spot-stiffness', 300)
    const damping = readNumberVar(this.bar, '--tb-spot-damping', 22)

    this.x.reconfigure({ stiffness, damping, mass: 1 })
    this.x.setTarget(target)
    this.angle.reconfigure({
      stiffness: 110,
      damping: readNumberVar(this.bar, '--tb-spot-angular-damping', 6.5),
      mass: 1,
    })
    // Angular impulse: the cone lags behind, then swings back through zero.
    this.angle.velocity = -direction * swing * 26
    this.angle.setTarget(0)
    this.loop.start()
  }

  destroy() {
    this.loop.stop()
    this.stopObserving()
  }
}
