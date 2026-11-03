import { useLayoutEffect, useRef } from 'react'
import { WormEngine } from '../core'
import { cx } from '../lib/cx'
import { useTabBar } from './useTabBar'
import type { WormUnderlineTabsProps } from './types'

/**
 * Worm Underline
 * A measured, spring-driven indicator that stretches while travelling and
 * contracts under the destination label.
 */
export function WormUnderlineTabs({
  items,
  value,
  defaultValue,
  onChange,
  id,
  ariaLabel = 'Categories',
  disabled,
  loop,
  activation,
  withPanels,
  className,
  tabClassName,
  activeTabClassName,
  labelClassName,
  iconClassName,
  indicatorClassName,
  showLabels = true,
  style,
}: WormUnderlineTabsProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const engineRef = useRef<WormEngine | null>(null)

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
    if (!bar || !indicator) return

    const engine = new WormEngine({
      bar,
      indicator,
      initialIndex: Math.max(0, activeIndex),
    })
    engineRef.current = engine
    return () => {
      engine.destroy()
      engineRef.current = null
    }
    // Engine reads CSS variables on demand; recreate only with the DOM node.
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
      className={cx('tb-shell tb-worm', className)}
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
              'tb-tab tb-worm-tab',
              tabClassName,
              active && activeTabClassName,
            )}
          >
            {item.icon ? (
              <span className={cx('tb-worm-icon', iconClassName)}>{item.icon}</span>
            ) : null}
            {showLabels ? (
              <span className={cx('tb-worm-label', labelClassName)}>{item.label}</span>
            ) : (
              <span className="tb-sr-only">{item.label}</span>
            )}
          </button>
        )
      })}
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className={cx('tb-worm-indicator', indicatorClassName)}
      />
    </div>
  )
}
