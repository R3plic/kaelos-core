import { useLayoutEffect, useRef } from 'react'
import { SpotlightEngine } from '../core'
import { cx } from '../lib/cx'
import { useTabBar } from './useTabBar'
import type { IconTabBarProps } from './types'

/**
 * Spotlight
 * A ceiling lamp follows the active icon and swings on its pivot while
 * travelling, casting a soft cone over the lit icon.
 */
export function SpotlightTabs({
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
  const lampRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<SpotlightEngine | null>(null)

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
    const lamp = lampRef.current
    if (!bar || !lamp) return

    const engine = new SpotlightEngine({
      bar,
      lamp,
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
      className={cx('tb-shell tb-spot', className)}
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
              'tb-tab tb-spot-tab',
              tabClassName,
              active && activeTabClassName,
            )}
          >
            <span className="tb-spot-ring" aria-hidden="true" />
            <span className={cx('tb-spot-icon', iconClassName)}>
              {item.icon ?? <span className="tb-fallback-icon">{item.label.slice(0, 1)}</span>}
            </span>
          </button>
        )
      })}

      <div
        ref={lampRef}
        aria-hidden="true"
        className={cx('tb-spot-lamp', indicatorClassName)}
      >
        <span className="tb-spot-cone" />
        <span className="tb-spot-bulb" />
        <span className="tb-spot-glow" />
      </div>
    </div>
  )
}
