import { readNumberVar, setCssVars } from '../dom'
import type { TabRect } from '../layout'

export interface MotionEngine {
  setActive: (index: number) => void
  destroy: () => void
}

export function tabAt(tabs: TabRect[], index: number): TabRect | undefined {
  return tabs.find((tab) => tab.index === index) ?? tabs[index]
}

export function motionNumbers(bar: HTMLElement) {
  return {
    stiffness: readNumberVar(bar, '--tb-spring-stiffness', 320),
    damping: readNumberVar(bar, '--tb-spring-damping', 26),
    mass: readNumberVar(bar, '--tb-spring-mass', 1),
  }
}

/** Center of a tab, optionally with a fractional inset applied to its travel. */
export function tabCenter(tab: TabRect, inset = 0): number {
  return tab.x + tab.width / 2 + inset
}

export function writeTransform(el: HTMLElement, transform: string) {
  el.style.transform = transform
}

/** Write an engine frame into CSS variables so paint stays in the stylesheet. */
export function publishVars(
  el: HTMLElement,
  vars: Record<string, string | number>,
) {
  setCssVars(el, vars)
}
