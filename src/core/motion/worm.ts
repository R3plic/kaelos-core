import { clamp, createRafLoop, prefersReducedMotion, readNumberVar } from '../dom'
import { measureTabBar, observeTabBar } from '../layout'
import type { TabBarMetrics } from '../layout'
import { Spring } from '../spring'
import type { MotionEngine } from './shared'
import { tabCenter } from './shared'

export interface WormEngineOptions {
  bar: HTMLElement
  indicator: HTMLElement
  initialIndex: number
}

/**
 * Worm underline: the indicator center is spring-driven while its width is
 * elongated proportionally to velocity. That reads as a stretching worm and
 * contracts with a slight overshoot as it settles.
 */
export class WormEngine implements MotionEngine {
  private readonly bar: HTMLElement
  private readonly indicator: HTMLElement
  private readonly center: Spring
  private readonly width: Spring
  private currentIndex: number
  private metrics: TabBarMetrics
  private readonly stopObserving: () => void
  private stretchFactor: number
  private maxStretch: number
  private readonly loop = createRafLoop((dt) => this.frame(dt))

  constructor({ bar, indicator, initialIndex }: WormEngineOptions) {
    this.bar = bar
    this.indicator = indicator
    this.currentIndex = initialIndex
    this.metrics = measureTabBar(bar)
    this.stretchFactor = readNumberVar(bar, '--tb-worm-stretch', 0.075)
    this.maxStretch = readNumberVar(bar, '--tb-worm-max-stretch', 999)
    this.center = new Spring(
      { stiffness: 320, damping: 25, mass: 1 },
      tabCenter(this.initialTab()),
    )
    this.width = new Spring(
      { stiffness: 380, damping: 32, mass: 1 },
      this.initialWidth(),
    )
    this.apply()
    this.stopObserving = observeTabBar(bar, (metrics) => {
      this.metrics = metrics
      this.snapToActive()
    }).destroy
  }

  private initialTab() {
    return (
      this.metrics.tabs[this.currentIndex] ??
      this.metrics.tabs[0] ?? { ...EMPTY_TAB }
    )
  }

  private initialWidth() {
    const tab = this.initialTab()
    if (!tab) return 0
    const inset = clamp(readNumberVar(this.bar, '--tb-worm-inset', 0.22), 0, 0.45)
    return tab.width * (1 - inset * 2)
  }

  private apply(stretch = 0) {
    const visibleWidth = clamp(
      this.width.value + stretch,
      0,
      this.metrics.width,
    )
    const x = clamp(
      this.center.value - visibleWidth / 2,
      0,
      Math.max(0, this.metrics.width - visibleWidth),
    )
    this.indicator.style.setProperty('--tb-worm-x', `${x}px`)
    this.indicator.style.setProperty('--tb-worm-w', `${visibleWidth}px`)
  }

  private snapToActive() {
    const tab = this.metrics.tabs[this.currentIndex] ?? this.metrics.tabs[0]
    if (!tab) return
    const inset = clamp(readNumberVar(this.bar, '--tb-worm-inset', 0.22), 0, 0.45)
    this.center.snap(tabCenter(tab))
    this.width.snap(tab.width * (1 - inset * 2))
    this.apply()
  }

  private frame(dt: number): boolean {
    const settledCenter = this.center.step(dt)
    const settledWidth = this.width.step(dt)
    const stretch = clamp(
      Math.abs(this.center.velocity) * this.stretchFactor,
      0,
      this.maxStretch,
    )
    this.apply(stretch)
    return !(settledCenter && settledWidth)
  }

  setActive(index: number) {
    if (index === this.currentIndex) return
    this.currentIndex = index

    const fresh = measureTabBar(this.bar)
    this.metrics = fresh
    const tab = fresh.tabs.find((item) => item.index === index) ?? fresh.tabs[index]
    if (!tab) return

    const inset = clamp(readNumberVar(this.bar, '--tb-worm-inset', 0.22), 0, 0.45)
    const stiffness = readNumberVar(this.bar, '--tb-worm-stiffness', 330)
    const damping = readNumberVar(this.bar, '--tb-worm-damping', 25)
    this.stretchFactor = readNumberVar(this.bar, '--tb-worm-stretch', 0.075)
    this.maxStretch = readNumberVar(this.bar, '--tb-worm-max-stretch', 999)
    const reduced = prefersReducedMotion()

    this.center.reconfigure({ stiffness, damping, mass: 1 })
    this.width.reconfigure({ stiffness: stiffness * 1.2, damping: damping + 8, mass: 1 })

    if (reduced) {
      this.center.snap(tabCenter(tab))
      this.width.snap(tab.width * (1 - inset * 2))
      this.apply()
      return
    }

    this.center.setTarget(tabCenter(tab))
    this.width.setTarget(tab.width * (1 - inset * 2))
    this.loop.start()
  }

  /** Called by the bar when labels or widths change. */
  remeasure() {
    this.metrics = measureTabBar(this.bar)
    this.snapToActive()
  }

  destroy() {
    this.loop.stop()
    this.stopObserving()
  }
}

const EMPTY_TAB = { index: 0, id: '', x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0 }
