import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createTabController } from '../core'
import type { BaseTabBarProps, TabItemSpec } from './types'

type UseTabBarOptions = Pick<
  BaseTabBarProps,
  | 'items'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'id'
  | 'disabled'
  | 'loop'
  | 'activation'
  | 'withPanels'
>

/**
 * React binding for the headless tab controller. Presentation components only
 * consume the returned ARIA props, active state and keyboard handler.
 */
export function useTabBar({
  items,
  value,
  defaultValue,
  onChange,
  id,
  disabled,
  loop,
  activation,
  withPanels,
}: UseTabBarOptions) {
  const reactId = useId().replace(/:/g, '')
  const idPrefix = id ?? `tb-${reactId}`

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const itemsRef = useRef(items)
  itemsRef.current = items

  const records = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        disabled: disabled || item.disabled,
      })),
    [items, disabled],
  )

  const [controller] = useState(() =>
    createTabController({
      idPrefix,
      items: records,
      activeId: value,
      defaultActiveId: defaultValue,
      loop,
      activation,
      withPanels,
      onSelect: (_item, index) => {
        const original = itemsRef.current[index]
        if (original) onChangeRef.current?.(original, index)
      },
    }),
  )

  useEffect(() => {
    controller.update({
      items: records,
      activeId: value,
      loop,
      activation,
      withPanels,
    })
  }, [controller, records, value, loop, activation, withPanels])

  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )

  // Keep a controlled bar faithful to its `value` even if the parent does not
  // accept an optimistic selection.
  useEffect(() => {
    if (value !== undefined) controller.update({ activeId: value })
  }, [controller, snapshot.activeId, value])

  const tabProps = useCallback(
    (index: number, item: TabItemSpec) => {
      const props = controller.getTabProps(index)
      if (!props) return null
      return {
        ...props,
        'aria-label': item.icon ? item.label : undefined,
        'data-tab-index': index,
        'data-tab-id': item.id,
        'data-disabled': item.disabled || disabled ? '' : undefined,
      }
    },
    [controller, disabled],
  )

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      controller.handleKeyDown(event.nativeEvent)
    },
    [controller],
  )

  return {
    idPrefix,
    activeIndex: snapshot.activeIndex,
    activeId: snapshot.activeId,
    controller,
    id: idPrefix,
    tabProps,
    onKeyDown,
  }
}
