import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  Show,
  createContext,
  createMemo,
  createSignal,
  createUniqueId,
  omit,
  onCleanup,
  onSettled,
  untrack,
  useContext,
} from 'solid-js'
import { spread } from '../spread'
import { serverAssociations } from '../field/server-associations'
import { useMenu } from './context'
import type { MenuEntry } from './context'

interface ItemOwn {
  disabled?: boolean
  textValue?: string
  closeOnSelect?: boolean
  onSelect?: (event: Event) => void
  ref?: (el: HTMLElement) => void
}
export type MenuItemProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  keyof ItemOwn | 'as'
> &
  ItemOwn & { as?: T }
export type MenuChecked = boolean | 'mixed'
export type MenuCheckboxItemProps<T extends ValidComponent = 'button'> = MenuItemProps<T> & {
  checked?: MenuChecked
  defaultChecked?: MenuChecked
  onCheckedChange?: (checked: boolean) => void
}
export type MenuRadioItemProps<T extends ValidComponent = 'button'> = MenuItemProps<T> & {
  value: string
}
export type MenuRadioGroupProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  'onChange' | 'defaultValue' | 'value'
> & { as?: T; value?: string; defaultValue?: string; onValueChange?: (value: string) => void }

const IndicatorContext = createContext<() => MenuChecked>(() => false)
const RadioContext = createContext<{ value(): string | undefined; change(value: string): void }>()
export function MenuItem<T extends ValidComponent = 'button'>(
  props: MenuItemProps<T>
): JSX.Element {
  return createItem(props)
}
export function MenuCheckboxItem<T extends ValidComponent = 'button'>(
  props: MenuCheckboxItemProps<T>
): JSX.Element {
  const [internal, setInternal] = createSignal<MenuChecked>(
    untrack(() => props.defaultChecked ?? false)
  )
  const checked = () => props.checked ?? internal()
  return createItem(props, {
    role: 'menuitemcheckbox',
    checked,
    commit() {
      const next = checked() !== true
      if (props.checked === undefined) setInternal(next)
      props.onCheckedChange?.(next)
    },
  })
}
export function MenuRadioItem<T extends ValidComponent = 'button'>(
  props: MenuRadioItemProps<T>
): JSX.Element {
  const radio = useContext(RadioContext)
  if (!radio) throw new Error('Menu.RadioItem must be rendered inside <Menu.RadioGroup>')
  return createItem(props, {
    role: 'menuitemradio',
    checked: () => radio.value() === props.value,
    commit: () => radio.change(props.value),
  })
}
export function MenuSubTrigger<T extends ValidComponent = 'button'>(
  props: MenuItemProps<T>
): JSX.Element {
  return createItem(props, { sub: true })
}
function createItem<T extends ValidComponent>(
  props: MenuItemProps<T>,
  config: {
    role?: 'menuitemcheckbox' | 'menuitemradio'
    checked?: () => MenuChecked
    commit?: () => void
    sub?: boolean
  } = {}
): JSX.Element {
  const child = useMenu('Menu.Item')
  const context = config.sub ? child.parent : child
  if (!context) throw new Error('Menu.SubTrigger must be rendered inside <Menu.Sub>')
  const own = props as ItemOwn & {
    as?: ValidComponent
    children?: JSX.Element
    id?: string
    type?: string
  }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'children',
    'ref',
    'disabled',
    'textValue',
    'closeOnSelect',
    'onSelect',
    'checked',
    'defaultChecked',
    'onCheckedChange',
    'value'
  )
  const id = createUniqueId()
  const entry: MenuEntry = {
    disabled: () => own.disabled ?? false,
    text: () => own.textValue ?? entry.el?.textContent ?? '',
  }
  let hoverTimer: ReturnType<typeof setTimeout> | undefined
  const openSub = () => {
    if (!entry.disabled()) child.change(true, 'first')
  }
  if (config.sub) {
    entry.openSub = openSub
    onCleanup(child.setTriggerId(() => own.id ?? id))
  }
  onSettled(() => {
    if (config.sub && entry.el) child.setTrigger(entry.el)
    return context.register(entry)
  })
  onCleanup(() => clearTimeout(hoverTimer))
  const activate = (event: MouseEvent) => {
    if (entry.disabled()) {
      event.preventDefault()
      return
    }
    if (config.sub) {
      openSub()
      return
    }
    const selected = new Event('menu.select', { cancelable: true })
    own.onSelect?.(selected)
    if (selected.defaultPrevented) {
      event.preventDefault()
      return
    }
    config.commit?.()
    if (own.closeOnSelect ?? !config.role) context.closeAll()
  }
  const part = () => {
    const base = context.engine().parts.item(entry)
    return {
      attrs: {
        ...base.attrs,
        role: config.role ?? 'menuitem',
        type: own.as === undefined || own.as === 'button' ? 'button' : undefined,
        id: config.sub ? (own.id ?? id) : own.id,
        'aria-checked': config.checked
          ? (String(config.checked()) as 'true' | 'false' | 'mixed')
          : undefined,
        'data-state': config.checked
          ? config.checked() === 'mixed'
            ? 'indeterminate'
            : config.checked()
              ? 'checked'
              : 'unchecked'
          : config.sub
            ? child.open()
              ? 'open'
              : 'closed'
            : undefined,
        'aria-haspopup': config.sub ? ('menu' as const) : undefined,
        'aria-expanded': config.sub
          ? child.open()
            ? ('true' as const)
            : ('false' as const)
          : undefined,
        'aria-controls': config.sub
          ? child.association('aria-controls', () => (child.open() ? child.contentId() : undefined))
          : undefined,
      },
      on: {
        ...base.on,
        click: activate,
        keydown(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
          if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
          base.on.keydown?.(event)
          if (event.defaultPrevented) return
          if (config.sub && event.key === (context.dir() === 'rtl' ? 'ArrowLeft' : 'ArrowRight')) {
            event.preventDefault()
            openSub()
            return
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            entry.el?.click()
          }
        },
        pointermove(event: PointerEvent) {
          if (event.pointerType === 'touch') return
          context.focus(entry)
          if (config.sub) {
            child.enter()
            if (!child.open() && !hoverTimer)
              hoverTimer = setTimeout(() => {
                hoverTimer = undefined
                openSub()
              }, 150)
          }
        },
        pointerleave() {
          if (config.sub) {
            clearTimeout(hoverTimer)
            hoverTimer = undefined
            child.leave()
          }
        },
      },
    }
  }
  const children = createMemo(() => (
    <IndicatorContext value={config.checked ?? (() => false)}>{own.children}</IndicatorContext>
  ))
  return (
    <Dynamic
      component={own.as ?? 'button'}
      {...spread(part(), { ...rest })}
      ref={(el: HTMLElement) => {
        entry.el = el
        own.ref?.(el)
      }}
    >
      {children()}
    </Dynamic>
  )
}
export function MenuItemIndicator(
  props: ComponentProps<'span'> & { forceMount?: boolean }
): JSX.Element {
  const checked = useContext(IndicatorContext)
  const rest = omit(props, 'forceMount')
  return (
    <Show when={props.forceMount || checked()}>
      <span
        aria-hidden="true"
        data-state={checked() === 'mixed' ? 'indeterminate' : checked() ? 'checked' : 'unchecked'}
        {...rest}
      />
    </Show>
  )
}
export function MenuRadioGroup<T extends ValidComponent = 'div'>(
  props: MenuRadioGroupProps<T>
): JSX.Element {
  const [internal, setInternal] = createSignal<string | undefined>(
    untrack(() => props.defaultValue)
  )
  const own = props as { as?: ValidComponent; children?: JSX.Element }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'children',
    'value',
    'defaultValue',
    'onValueChange'
  )
  const value = {
    value: () => props.value ?? internal(),
    change(next: string) {
      if (next === value.value()) return
      if (props.value === undefined) setInternal(next)
      props.onValueChange?.(next)
    },
  }
  return (
    <RadioContext value={value}>
      <MenuGroup {...rest} as={own.as ?? 'div'}>
        {own.children}
      </MenuGroup>
    </RadioContext>
  )
}
const GroupContext = createContext<{
  label(): string | undefined
  register(read: () => string): () => void
}>()
export type MenuGroupProps<T extends ValidComponent = 'div'> = ComponentProps<T> & { as?: T }
export function MenuGroup<T extends ValidComponent = 'div'>(props: MenuGroupProps<T>): JSX.Element {
  const own = props as { as?: ValidComponent; children?: JSX.Element }
  const rest = omit(props as Record<string, unknown>, 'as', 'children')
  const [revision, setRevision] = createSignal(0, { ownedWrite: true })
  const associations = isServer ? serverAssociations() : undefined
  let reads: (() => string)[] = []
  let version = 0
  const value = {
    label: () => {
      revision()
      return reads.at(-1)?.()
    },
    register(read: () => string) {
      reads.push(read)
      if (!isServer) setRevision(++version)
      return () => {
        reads = reads.filter((entry) => entry !== read)
        if (!isServer) setRevision(++version)
      }
    },
  }
  const children = createMemo(() => <GroupContext value={value}>{own.children}</GroupContext>)
  const element = (
    <Dynamic
      component={own.as ?? 'div'}
      role="group"
      aria-labelledby={
        associations ? associations.attribute('aria-labelledby', value.label) : value.label()
      }
      {...rest}
    >
      {children()}
    </Dynamic>
  )
  const result = associations ? associations.finish(element) : element
  return result
}
export function MenuGroupLabel(props: ComponentProps<'div'>): JSX.Element {
  const group = useContext(GroupContext)
  if (!group)
    throw new Error('Menu.GroupLabel must be rendered inside <Menu.Group> or <Menu.RadioGroup>')
  const id = createUniqueId()
  // eslint-disable-next-line solid/reactivity -- The group reads this registered getter reactively.
  onCleanup(group.register(() => (typeof props.id === 'string' ? props.id : id)))
  return <div id={id} aria-hidden="true" {...props} />
}
export function MenuSeparator(props: ComponentProps<'hr'>): JSX.Element {
  return <hr {...props} />
}
