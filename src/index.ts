/**
 * kaelos-core
 * -----------
 * Animated tab bars built on one headless, framework-agnostic TypeScript core.
 *
 * Everything public is re-exported from here — nothing needs to reach into
 * `src/core` or `src/react` directly.
 *
 *   import { WormUnderlineTabs, HoppingDotTabs } from 'kaelos-core'
 *   import 'kaelos-core/styles.css'
 */

/* The six tab bar variants + their shared React binding. */
export * from './react'

/* Small utility used by the components; exported for consumer composition. */
export { cx } from './lib/cx'
