import { useLayoutEffect, useRef } from 'react'
import { RippleEngine } from '../core'
import { cx } from '../lib/cx'
import { useTabBar } from './useTabBar'
import type { IconTabBarProps } from './types'

const RING_COUNT = 3

/**
 * Ripple Fill
 * A violet→cyan gradient pill springs across the bar and re-floods from its
 * centre with expanding wave rings on each activation.
 */
export function RippleFillTabs({
  items,
  value,
  defaultValue,
  onChange,
  id,
  ariaLabel = 'Navigation',
  disabled,
  loop,
  activation,
  withPanels,
  className,
  tabClassName,
  activeTabClassName,
  iconClassName,
  indicatorClassName,
  style,
}: IconTabBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const ringsRef = useRef<Array<HTMLSpanElement | null>>([])
  const engineRef = useRef<RippleEngine | null>(null)

  const { activeIndex, tabProps, onKeyDown } = useTabBar({
    items,
    value,
    defaultValue,
    onChange,
    id,
    disabled,
    loop,
    activation,
    withPanels,
  })

  useLayoutEffect(() => {
    const bar = barRef.current
    const indicator = indicatorRef.current
    const surface = surfaceRef.current
    if (!bar || !indicator || !surface) return

    const rings = ringsRef.current.filter(
      (ring): ring is HTMLSpanElement => Boolean(ring),
    )
    const engine = new RippleEngine({
      bar,
      indicator,
      surface,
      rings,
      initialIndex: Math.max(0, activeIndex),
    })
    engineRef.current = engine
    return () => {
      engine.destroy()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    if (activeIndex >= 0) engineRef.current?.setActive(activeIndex)
  }, [activeIndex])

  return (
    <div
      ref={barRef}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      className={cx('tb-shell tb-ripple', className)}
      style={style}
      onKeyDown={onKeyDown}
    >
      <div
        ref={indicatorRef}
        aria-hidden="true"
        className={cx('tb-ripple-indicator', indicatorClassName)}
      >
        <div ref={surfaceRef} className="tb-ripple-surface" />
        {Array.from({ length: RING_COUNT }, (_, index) => (
          <span
            key={`ring-${index}`}
            ref={(element) => {
              ringsRef.current[index] = element
            }}
            className="tb-ripple-ring"
          />
        ))}
      </div>

      {items.map((item, index) => {
        const props = tabProps(index, item)
        if (!props) return null
        const active = index === activeIndex
        return (
          <button
            key={item.id}
            type="button"
            {...props}
            className={cx(
              'tb-tab tb-ripple-tab',
              tabClassName,
              active && activeTabClassName,
            )}
          >
            <span className={cx('tb-ripple-icon', iconClassName)}>
              {item.icon ?? <span className="tb-fallback-icon">{item.label.slice(0, 1)}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
