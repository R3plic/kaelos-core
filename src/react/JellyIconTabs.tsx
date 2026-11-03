import { useLayoutEffect, useRef } from 'react'
import { JellyEngine } from '../core'
import { cx } from '../lib/cx'
import { useTabBar } from './useTabBar'
import type { IconTabBarProps } from './types'

/**
 * Jelly Icon
 * The tapped icon squashes, hops and wobbles with decaying squash-and-stretch
 * physics. Transform-only, so it stays on the compositor.
 */
export function JellyIconTabs({
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
  style,
}: IconTabBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<JellyEngine | null>(null)

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
    const engine = new JellyEngine({ bar, initialIndex: Math.max(0, activeIndex) })
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
      className={cx('tb-shell tb-jelly', className)}
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
              'tb-tab tb-jelly-tab',
              tabClassName,
              active && activeTabClassName,
            )}
          >
            <span className="tb-jelly-halo" aria-hidden="true" />
            <span className="tb-jelly-ring" aria-hidden="true" />
            <span className={cx('tb-jelly-icon', iconClassName)} data-jelly-icon>
              {item.icon ?? <span className="tb-fallback-icon">{item.label.slice(0, 1)}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
