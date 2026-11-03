import { toDomId } from './dom'
import type {
  ActivationMode,
  Orientation,
  SelectMeta,
  SelectReason,
  TabRecord,
} from './types'

export interface TabControllerOptions {
  /** Stable prefix used to derive `aria-controls` / `aria-labelledby` ids. */
  idPrefix: string
  items: TabRecord[]
  activeId?: string
  defaultActiveId?: string
  orientation?: Orientation
  loop?: boolean
  activation?: ActivationMode
  /** Emit `aria-controls` links for matching TabPanel ids. */
  withPanels?: boolean
  onSelect?: (item: TabRecord, index: number, meta: SelectMeta) => void
}

export interface TabSnapshot {
  activeId: string
  activeIndex: number
  items: TabRecord[]
}

const firstEnabled = (items: TabRecord[], from = 0, direction = 1): number => {
  if (!items.length) return -1
  for (let step = 0; step < items.length; step += 1) {
    const index = (from + step * direction + items.length * items.length) % items.length
    if (!items[index]?.disabled) return index
  }
  return -1
}

/**
 * Headless tab controller: selection state, roving tabindex, keyboard behaviour
 * and WAI-ARIA wiring. It has no rendering or animation concerns.
 */
export function createTabController(options: TabControllerOptions) {
  const idPrefix = toDomId(options.idPrefix)
  let items = options.items.slice()
  let orientation: Orientation = options.orientation ?? 'horizontal'
  let loop = options.loop ?? false
  let activation: ActivationMode = options.activation ?? 'automatic'
  let withPanels = options.withPanels ?? false
  let onSelect = options.onSelect

  const preferredActive =
    options.activeId ??
    options.defaultActiveId ??
    items.find((item) => !item.disabled)?.id ??
    ''

  let activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === preferredActive),
  )
  if (items[activeIndex]?.disabled) {
    activeIndex = firstEnabled(items)
  }

  let snapshot: TabSnapshot = {
    activeId: items[activeIndex]?.id ?? '',
    activeIndex,
    items,
  }

  const listeners = new Set<() => void>()
  const tabElements = new Map<string, HTMLElement>()

  const emit = () => {
    snapshot = {
      activeId: items[activeIndex]?.id ?? '',
      activeIndex,
      items,
    }
    for (const listener of listeners) listener()
  }

  const getSnapshot = () => snapshot

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const focusTab = (index: number) => {
    const item = items[index]
    if (!item) return
    tabElements.get(item.id)?.focus({ preventScroll: true })
  }

  const selectIndex = (
    index: number,
    meta: SelectMeta = { reason: 'programmatic' },
  ): boolean => {
    const item = items[index]
    if (!item || item.disabled) return false

    const changed = index !== activeIndex
    if (changed) {
      activeIndex = index
      emit()
      onSelect?.(item, index, meta)
    }
    if (meta.focus) focusTab(index)
    return changed
  }

  const selectId = (id: string, meta?: SelectMeta) =>
    selectIndex(
      items.findIndex((item) => item.id === id),
      meta,
    )

  const step = (from: number, direction: 1 | -1, wrap: boolean): number => {
    if (!items.length) return -1
    for (let offset = 1; offset <= items.length; offset += 1) {
      const candidate = from + direction * offset
      if (!wrap && (candidate < 0 || candidate >= items.length)) return -1
      const normalized = ((candidate % items.length) + items.length) % items.length
      if (!items[normalized]?.disabled) return normalized
    }
    return -1
  }

  const focusedIndex = () => {
    for (const [id, element] of tabElements) {
      if (element === document.activeElement) {
        return items.findIndex((item) => item.id === id)
      }
    }
    return activeIndex
  }

  /**
   * WAI-ARIA tabs keyboard model.
   * Arrow keys move focus; Home/End jump. Automatic mode selects on focus,
   * manual mode waits for Enter/Space.
   */
  const handleKeyDown = (event: KeyboardEvent): boolean => {
    const isHorizontal = orientation === 'horizontal'
    const next = isHorizontal ? 'ArrowRight' : 'ArrowDown'
    const prev = isHorizontal ? 'ArrowLeft' : 'ArrowUp'
    const current = focusedIndex()

    let targetIndex = -1
    let handled = true

    switch (event.key) {
      case next:
        targetIndex = step(current, 1, loop)
        break
      case prev:
        targetIndex = step(current, -1, loop)
        break
      case 'Home':
        targetIndex = firstEnabled(items)
        break
      case 'End': {
        for (let i = items.length - 1; i >= 0; i -= 1) {
          if (!items[i]?.disabled) {
            targetIndex = i
            break
          }
        }
        break
      }
      case 'Enter':
      case ' ': {
        const item = items[current]
        if (!item || item.disabled) return false
        selectIndex(current, { reason: 'keyboard' })
        return true
      }
      default:
        handled = false
    }

    if (!handled) return false
    event.preventDefault()

    if (targetIndex < 0) return true

    if (activation === 'automatic') {
      selectIndex(targetIndex, { reason: 'keyboard', focus: true })
    } else {
      focusTab(targetIndex)
    }
    return true
  }

  const registerTab = (id: string, element: HTMLElement | null) => {
    if (element) tabElements.set(id, element)
    else tabElements.delete(id)
  }

  const update = (next: {
    items?: TabRecord[]
    activeId?: string
    orientation?: Orientation
    loop?: boolean
    activation?: ActivationMode
    withPanels?: boolean
    onSelect?: (item: TabRecord, index: number, meta: SelectMeta) => void
  }) => {
    let changed = false

    if (next.onSelect !== undefined) onSelect = next.onSelect
    if (next.orientation !== undefined) orientation = next.orientation
    if (next.loop !== undefined) loop = next.loop
    if (next.activation !== undefined) activation = next.activation
    if (next.withPanels !== undefined) withPanels = next.withPanels

    if (next.items !== undefined) {
      const prevIds = items.map((item) => `${item.id}:${item.disabled ? 1 : 0}`).join('|')
      const nextIds = next.items
        .map((item) => `${item.id}:${item.disabled ? 1 : 0}`)
        .join('|')
      if (prevIds !== nextIds) {
        items = next.items.slice()
        activeIndex = Math.max(
          0,
          items.findIndex((item) => item.id === snapshot.activeId),
        )
        if (items[activeIndex]?.disabled || activeIndex === -1) {
          activeIndex = firstEnabled(items)
        }
        changed = true
      }
    }

    // Controlled mode: follow the `value` prop without firing onSelect.
    if (next.activeId !== undefined) {
      const requested = items.findIndex((item) => item.id === next.activeId)
      if (requested !== -1 && !items[requested]?.disabled && requested !== activeIndex) {
        activeIndex = requested
        changed = true
      }
    }

    if (changed) emit()
  }

  const getTabProps = (index: number) => {
    const item = items[index]
    if (!item) return null
    const active = index === activeIndex
    const domId = `${idPrefix}-tab-${toDomId(item.id)}`
    return {
      id: domId,
      role: 'tab' as const,
      'aria-selected': active,
      'aria-controls': withPanels
        ? `${idPrefix}-panel-${toDomId(item.id)}`
        : undefined,
      'aria-disabled': item.disabled || undefined,
      tabIndex: active ? 0 : -1,
      'data-state': active ? ('active' as const) : ('inactive' as const),
      onClick: () =>
        selectIndex(index, { reason: 'pointer' as SelectReason, focus: false }),
      onFocus: () => {
        if (activation === 'automatic') {
          selectIndex(index, { reason: 'keyboard', focus: false })
        }
      },
      ref: (element: HTMLButtonElement | null) => registerTab(item.id, element),
    }
  }

  return {
    idPrefix,
    getSnapshot,
    subscribe,
    registerTab,
    selectIndex,
    selectId,
    select: (id: string, reason: SelectReason = 'programmatic') =>
      selectId(id, { reason }),
    handleKeyDown,
    update,
    getTabProps,
    getPanelProps: (id: string) => ({
      role: 'tabpanel' as const,
      id: `${idPrefix}-panel-${toDomId(id)}`,
      'aria-labelledby': `${idPrefix}-tab-${toDomId(id)}`,
      tabIndex: 0,
    }),
    getActiveIndex: () => activeIndex,
  }
}

export type TabController = ReturnType<typeof createTabController>
