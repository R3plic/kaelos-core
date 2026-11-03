import type { CSSProperties, ReactNode } from 'react'
import type { ActivationMode } from '../core'

export interface TabItemSpec {
  /** Stable identity. Used for `value` / `defaultValue` and ARIA ids. */
  id: string
  /** Accessible name. Also rendered visibly by the worm variant. */
  label: string
  /** Any node: an SVG, an emoji, an avatar, a lucide icon… */
  icon?: ReactNode
  /** Badge content consumed by the Badge Pop variant. */
  badge?: number | string
  disabled?: boolean
}

export interface BaseTabBarProps {
  items: TabItemSpec[]
  /** Controlled active item id. */
  value?: string
  /** Uncontrolled initial active item id. */
  defaultValue?: string
  onChange?: (item: TabItemSpec, index: number) => void
  /** Prefix for ARIA tab/panel ids. */
  id?: string
  ariaLabel?: string
  /** Disables every tab. */
  disabled?: boolean
  /** Wrap keyboard navigation at the ends. */
  loop?: boolean
  activation?: ActivationMode
  /** Associate tabs with matching `<TabPanel>` elements via aria-controls. */
  withPanels?: boolean
  /** Additive classes on the tab strip. */
  className?: string
  tabClassName?: string
  activeTabClassName?: string
  labelClassName?: string
  iconClassName?: string
  indicatorClassName?: string
  /** Inline CSS variable overrides (colors, shadows, spring physics…). */
  style?: CSSProperties
}

export interface WormUnderlineTabsProps extends BaseTabBarProps {
  showLabels?: boolean
}

export interface IconTabBarProps extends BaseTabBarProps {}

export type TabBarVariant =
  | 'worm'
  | 'hop'
  | 'spotlight'
  | 'ripple'
  | 'jelly'
  | 'badge'
