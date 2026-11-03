import type { CSSProperties } from 'react'

/**
 * Type-safe helper for passing design tokens as CSS custom properties:
 *
 * `<WormUnderlineTabs style={tabVars({ '--tb-accent': '#fb7185' })} />`
 */
export function tabVars(
  vars: Record<`--${string}`, string | number>,
): CSSProperties {
  return vars as CSSProperties
}
