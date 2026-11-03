import { useLayoutEffect, useRef } from 'react'
import { BadgeEngine } from '../core'
import { cx } from '../lib/cx'
import { useTabBar } from './useTabBar'
import type { IconTabBarProps } from './types'

/**
 * Badge Pop
 * Badges spring out when their tab opens and pop back with an overshoot when
 * the tab is left. Counts are plain data on each item.
 */
export function BadgePopTabs({
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
  const engineRef = useRef<BadgeEngine | null>(null)

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
    if (!bar) return
    const engine = new BadgeEngine({ bar, initialIndex: Math.max(0, activeIndex) })
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
      className={cx('tb-shell tb-badges', className)}
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
              'tb-tab tb-badge-tab',
              tabClassName,
              active && activeTabClassName,
            )}
          >
            <span className="tb-badge-ring" aria-hidden="true" />
            <span className={cx('tb-badge-icon', iconClassName)}>
              {item.icon ?? <span className="tb-fallback-icon">{item.label.slice(0, 1)}</span>}
            </span>
            {item.badge !== undefined ? (
              <span
                data-badge
                aria-hidden="true"
                className={cx('tb-badge-pill', indicatorClassName)}
              >
                {item.badge}
              </span>
            ) : null}
            <span className="tb-badge-line" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
