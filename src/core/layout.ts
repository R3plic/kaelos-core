/** Measure tab hit areas relative to the tab list, independent of page position. */

export interface TabRect {
  index: number
  id: string
  x: number
  y: number
  width: number
  height: number
  centerX: number
  centerY: number
}

export interface TabBarMetrics {
  width: number
  height: number
  tabs: TabRect[]
  signature: string
}

export function measureTabBar(bar: HTMLElement): TabBarMetrics {
  const barRect = bar.getBoundingClientRect()
  const elements = Array.from(
    bar.querySelectorAll<HTMLElement>('[data-tab-index]'),
  ).sort(
    (a, b) =>
      Number(a.dataset.tabIndex ?? 0) - Number(b.dataset.tabIndex ?? 0),
  )

  const tabs = elements.map((element, order) => {
    const rect = element.getBoundingClientRect()
    const x = rect.left - barRect.left
    const y = rect.top - barRect.top
    return {
      index: Number(element.dataset.tabIndex ?? order),
      id: element.dataset.tabId ?? '',
      x,
      y,
      width: rect.width,
      height: rect.height,
      centerX: x + rect.width / 2,
      centerY: y + rect.height / 2,
    }
  })

  return {
    width: barRect.width,
    height: barRect.height,
    tabs,
    signature: tabs
      .map((tab) => `${tab.id}:${tab.x.toFixed(2)}:${tab.width.toFixed(2)}`)
      .join('|'),
  }
}

/**
 * Watch the bar and its tabs for size/layout changes (fonts, responsive gutters,
 * label changes) and report fresh measurements. Also observes fonts settling.
 */
export function observeTabBar(
  bar: HTMLElement,
  onChange: (metrics: TabBarMetrics) => void,
): { measure: () => TabBarMetrics; get: () => TabBarMetrics; destroy: () => void } {
  let metrics = measureTabBar(bar)
  let frame = 0
  let destroyed = false

  const emit = () => {
    frame = 0
    if (destroyed) return
    const next = measureTabBar(bar)
    if (next.signature === metrics.signature && next.width === metrics.width) return
    metrics = next
    onChange(metrics)
  }

  const schedule = () => {
    if (frame || destroyed) return
    frame = requestAnimationFrame(emit)
  }

  const resizeObserver =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(schedule)
      : null

  const observeChildren = () => {
    if (!resizeObserver) return
    resizeObserver.disconnect()
    resizeObserver.observe(bar)
    bar
      .querySelectorAll<HTMLElement>('[data-tab-index]')
      .forEach((element) => resizeObserver.observe(element))
  }

  observeChildren()
  onChange(metrics)

  const onWindowResize = () => schedule()
  window.addEventListener('resize', onWindowResize)

  if (document.fonts?.ready) {
    void document.fonts.ready.then(() => {
      if (destroyed) return
      observeChildren()
      schedule()
    })
  }

  return {
    measure: () => {
      metrics = measureTabBar(bar)
      return metrics
    },
    get: () => metrics,
    destroy: () => {
      destroyed = true
      if (frame) cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', onWindowResize)
    },
  }
}
