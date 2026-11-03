import { useLayoutEffect, useRef } from 'react'
import { HopEngine } from '../core'
import { cx } from '../lib/cx'
import { useTabBar } from './useTabBar'
import type { IconTabBarProps } from './types'

const TRAIL_COUNT = 4

/**
 * Hopping Dot
 * A glowing dot arcs to the active tab, squashes on landing and leaves a
 * sampled comet trail behind it.
 */
export function HoppingDotTabs({
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
  const dotRef = useRef<HTMLSpanElement>(null)
  const trailsRef = useRef<Array<HTMLSpanElement | null>>([])
  const engineRef = useRef<HopEngine | null>(null)

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
    const dot = dotRef.current
    if (!bar || !dot) return

    const trails = trailsRef.current.filter(
      (trail): trail is HTMLSpanElement => Boolean(trail),
    )
    const engine = new HopEngine({
      bar,
      dot,
      trails,
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
      className={cx('tb-shell tb-hop', className)}
      style={style}
      onKeyDown={onKeyDown}
    >
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
              'tb-tab tb-hop-tab',
              tabClassName,
              active && activeTabClassName,
            )}
          >
            <span className="tb-hop-ring" aria-hidden="true" />
            <span className={cx('tb-hop-icon', iconClassName)}>
              {item.icon ?? <span className="tb-fallback-icon">{item.label.slice(0, 1)}</span>}
            </span>
          </button>
        )
      })}

      {Array.from({ length: TRAIL_COUNT }, (_, index) => (
        <span
          key={`trail-${index}`}
          ref={(element) => {
            trailsRef.current[index] = element
          }}
          aria-hidden="true"
          className="tb-hop-dot tb-hop-trail"
        />
      ))}
      <span
        ref={dotRef}
        aria-hidden="true"
        className={cx('tb-hop-dot', indicatorClassName)}
      />
    </div>
  )
}
