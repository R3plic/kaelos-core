/** Shared, framework-agnostic types for the tab primitives. */

export type Orientation = 'horizontal' | 'vertical'

/** `automatic` selects a tab as soon as it receives keyboard focus (WAI-ARIA default). */
export type ActivationMode = 'automatic' | 'manual'

export type SelectReason = 'pointer' | 'keyboard' | 'programmatic'

export interface TabRecord {
  id: string
  disabled?: boolean
}

export interface SelectMeta {
  reason: SelectReason
  focus?: boolean
}

export interface RectLike {
  x: number
  y: number
  width: number
  height: number
}

export interface SpringConfig {
  stiffness: number
  damping: number
  mass: number
}
