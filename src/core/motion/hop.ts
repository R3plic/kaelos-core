import {
  clamp,
  createRafLoop,
  easeInOutCubic,
  lerp,
  prefersReducedMotion,
  readNumberVar,
} from '../dom'
import { measureTabBar, observeTabBar } from '../layout'
import type { TabBarMetrics } from '../layout'
import { Spring } from '../spring'
import type { MotionEngine } from './shared'

export interface HopEngineOptions {
  bar: HTMLElement
  dot: HTMLElement
  trails: HTMLElement[]
  initialIndex: number
}

interface HopRun {
  fromX: number
  toX: number
  startedAt: number
  duration: number
  arc: number
}

/**
 * Hopping dot: a spring-squashed dot arcs between tabs, leaving ghost samples.
 * Position follows a timing curve; landing deformation is a real spring impulse.
 */
export class HopEngine implements MotionEngine {
  private readonly bar: HTMLElement
  private readonly dot: HTMLElement
  private readonly trails: HTMLElement[]
  private readonly squashX: Spring
  private readonly squashY: Spring
  private readonly loop = createRafLoop((dt, now) => this.frame(dt, now))
  private metrics: TabBarMetrics
  private currentIndex: number
  private currentX = 0
  private dotSize = 8
  private run: HopRun | null = null
  private history: Array<{ time: number; x: number; y: number }> = []
  private readonly stopObserving: () => void

  constructor({ bar, dot, trails, initialIndex }: HopEngineOptions) {
    this.bar = bar
    this.dot = dot
    this.trails = trails
    this.currentIndex = initialIndex
    this.metrics = measureTabBar(bar)
    this.dotSize =
      Number.parseFloat(getComputedStyle(dot).width) ||
      dot.offsetWidth ||
      8

    const squash = { stiffness: 620, damping: 11, mass: 1 }
    this.squashX = new Spring(squash, 1)
    this.squashY = new Spring(squash, 1)

    this.currentX = this.tabCenter(initialIndex)
    this.render(0, 0)
    this.hideTrails(0)

    this.stopObserving = observeTabBar(bar, (metrics) => {
      this.metrics = metrics
      this.run = null
      this.currentX = this.tabCenter(this.currentIndex)
      this.squashX.snap(1)
      this.squashY.snap(1)
      this.render(0, 0)
      this.loop.stop()
      this.hideTrails(0)
    }).destroy
  }

  private tabCenter(index: number): number {
    const tab =
      this.metrics.tabs.find((item) => item.index === index) ??
      this.metrics.tabs[index] ??
      this.metrics.tabs[0]
    return tab ? tab.centerX : this.metrics.width / 2
  }

  private render(y: number, airStretch = 1) {
    const sx = this.squashX.value * (1 - 0.14 * airStretch)
    const sy = this.squashY.value * (1 + 0.2 * airStretch)
    this.dot.style.transform = `translate3d(${
      this.currentX - this.dotSize / 2
    }px, ${y}px, 0) scale(${sx}, ${sy})`
  }

  private hideTrails(delay = 0) {
    this.trails.forEach((trail, index) => {
      window.setTimeout(() => {
        trail.style.opacity = '0'
      }, delay * index)
    })
  }

  private updateTrails(now: number) {
    this.history = this.history.filter((sample) => now - sample.time < 320)

    for (let depth = 0; depth < this.trails.length; depth += 1) {
      const trail = this.trails[depth]
      const targetTime = now - (depth + 1) * 42
      let sample: { time: number; x: number; y: number } | undefined
      for (let i = this.history.length - 1; i >= 0; i -= 1) {
        if (this.history[i].time <= targetTime) {
          sample = this.history[i]
          break
        }
      }
      if (!sample) {
        trail.style.opacity = '0'
        continue
      }
      const opacity = 0.42 * (1 - depth / this.trails.length)
      trail.style.opacity = String(opacity)
      trail.style.transform = `translate3d(${sample.x - this.dotSize / 2}px, ${
        sample.y
      }px, 0) scale(0.72)`
    }
  }

  private frame(dt: number, now: number): boolean {
    let moving = false
    let airStretch = 0

    if (this.run) {
      moving = true
      const elapsed = now - this.run.startedAt
      const progress = clamp(elapsed / this.run.duration, 0, 1)
      const eased = easeInOutCubic(progress)
      this.currentX = lerp(this.run.fromX, this.run.toX, eased)
      const y = -this.run.arc * Math.sin(Math.PI * progress)
      airStretch = Math.sin(Math.PI * progress)

      this.history.push({ time: now, x: this.currentX, y })
      this.updateTrails(now)
      this.render(y, airStretch)

      if (progress >= 1) {
        this.currentX = this.run.toX
        this.run = null
        this.squashX.value = 1.42
        this.squashX.target = 1
        this.squashX.velocity = -120
        this.squashY.value = 0.62
        this.squashY.target = 1
        this.squashY.velocity = 90
        this.render(0, 0)
        this.hideTrails(36)
        this.history = []
      }
    }

    const settledX = this.squashX.step(dt)
    const settledY = this.squashY.step(dt)
    if (!this.run) {
      this.currentX = this.tabCenter(this.currentIndex)
      this.render(0, 0)
    }

    return moving || !(settledX && settledY)
  }

  setActive(index: number) {
    if (index === this.currentIndex) return
    const previousX = this.currentX
    this.currentIndex = index
    this.metrics = measureTabBar(this.bar)

    if (prefersReducedMotion()) {
      this.run = null
      this.currentX = this.tabCenter(index)
      this.squashX.snap(1)
      this.squashY.snap(1)
      this.render(0, 0)
      this.hideTrails(0)
      return
    }

    const duration = Math.max(
      220,
      readNumberVar(this.bar, '--tb-hop-duration', 520),
    )
    const arc = readNumberVar(this.bar, '--tb-hop-arc', 20)
    this.squashX.reconfigure({
      stiffness: readNumberVar(this.bar, '--tb-hop-stiffness', 620),
      damping: readNumberVar(this.bar, '--tb-hop-damping', 11),
      mass: 1,
    })
    this.squashY.reconfigure({ ...this.squashX.config })
    this.squashX.value = 0.78
    this.squashX.target = 1
    this.squashY.value = 1.22
    this.squashY.target = 1
    this.squashX.velocity = 0
    this.squashY.velocity = 0
    this.history = []
    this.run = {
      fromX: previousX,
      toX: this.tabCenter(index),
      startedAt: performance.now(),
      duration,
      arc,
    }
    this.loop.start()
  }

  destroy() {
    this.loop.stop()
    this.stopObserving()
    this.hideTrails(0)
  }
}
