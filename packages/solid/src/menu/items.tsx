import { booleanAttribute, setRef } from '../internal/host'
import { dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  Show,
  createContext,
  createEffect,
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

/** Item-owned interaction and typeahead props, replacing matching host props. */
interface ItemOwn {
  /** Block selection/submenu opening while retaining arrow and pointer focus. Defaults to false; no native disabled attribute is added. */
  disabled?: JSX.BooleanAttribute
  /** Typeahead text, defaulting to current host textContent and then an empty string. */
  textValue?: string
  /** Close this menu and ancestors after selection. Defaults to true for plain items, false for checkbox/radio items; ignored by SubTrigger. */
  closeOnSelect?: boolean
  /**
   * Receives a new cancelable menu.select Event synchronously before checked/radio
   * commit and closure. It is passed directly, not dispatched on the DOM. Preventing
   * its default vetoes both steps and cancels the activating click. Not called for
   * disabled items, submenu triggers, initialization, or canceled author clicks.
   */
  onSelect?: (event: Event) => void
  /** Receives the visible host used for ordering, pointer/keyboard focus, and programmatic click. */
  ref?: unknown
}
/** Polymorphic item props; remaining attributes and author handlers override/precede generated behavior. */
export type MenuItemProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  keyof ItemOwn | 'as'
> &
  Omit<ItemOwn, 'ref'> & {
    ref?: ComponentProps<T>['ref']
    /** Rendered host, defaulting to button. Custom components must forward props/ref. */
    as?: T
  }
/** Boolean checked state or mixed presentation; mixed activates to true. */
export type MenuChecked = boolean | 'mixed'
/** Menu item props with controlled/uncontrolled checkbox membership. */
export type MenuCheckboxItemProps<T extends ValidComponent = 'button'> = MenuItemProps<T> & {
  /** Controlled checked state while defined; undefined uses internal state. */
  checked?: MenuChecked
  /** Initial uncontrolled state, defaulting to false; later changes are ignored. */
  defaultChecked?: MenuChecked
  /** Reports the next boolean after an uncanceled selection and uncontrolled state update; mixed becomes true. */
  onCheckedChange?: (checked: boolean) => void
}
/** Menu item props with identity supplied to the enclosing Menu.RadioGroup. */
export type MenuRadioItemProps<T extends ValidComponent = 'button'> = MenuItemProps<T> & {
  /** String key compared exactly with the radio group's current value. */
  value: string
}
/** Group host props with controlled/uncontrolled radio selection; no native form-state binding. */
export type MenuRadioGroupProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  'onChange' | 'defaultValue' | 'value'
> & {
  /** Group host, defaulting to div. */
  as?: T
  /** Controlled selection while defined; undefined uses internal state. */
  value?: string
  /** Initial uncontrolled selection; later changes are ignored. Omission starts empty. */
  defaultValue?: string
  /** Reports a different selected key after updating uncontrolled state; initialization is silent. */
  onValueChange?: (value: string) => void
}

/** Current item checked state; indicators outside an item see false. */
const IndicatorContext = /* @__PURE__ */ createContext<() => MenuChecked>(() => false)
/** Nearest radio group selection and deduplicated change request. */
const RadioContext = /* @__PURE__ */ createContext<{
  /** Current controlled or internal selection. */
  value(): string | undefined
  /** Ignore equal values, update uncontrolled state, then notify the author. */
  change(value: string): void
}>()
/** Plain menu item that closes all menu ancestors after uncanceled selection by default. Requires Menu context. */
export function MenuItem<T extends ValidComponent = 'button'>(
  props: MenuItemProps<T>
): JSX.Element {
  return createItem(props)
}
/**
 * Checkbox menu item that stays open by default and provides state to ItemIndicator.
 * onSelect cancellation precedes checked changes. No hidden form input, validation,
 * or checked-state form-reset handler is installed. Requires Menu context.
 */
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
/**
 * Radio menu item that stays open by default and selects its exact string value.
 * Reselecting the current value still invokes onSelect but emits no value change.
 * No hidden input or native radio grouping is installed.
 * @throws If Menu or Menu.RadioGroup context is missing.
 */
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
/**
 * Registers in the parent menu while opening the enclosing Menu.Sub.
 * Click, the forward horizontal arrow, or a 150ms non-touch hover requests its
 * first item. Hover leave cancels pending opening and starts the child's leave
 * policy. onSelect and closeOnSelect do not apply; disabled state blocks opening.
 * @throws If there is no enclosing Menu.Sub with a parent menu.
 */
export function MenuSubTrigger<T extends ValidComponent = 'button'>(
  props: MenuItemProps<T>
): JSX.Element {
  return createItem(props, { sub: true })
}
/**
 * Builds shared item semantics, owner-bound registration, and selection ordering.
 *
 * @remarks
 * Author handlers run before core handlers through spread. Non-touch pointer moves
 * focus even disabled entries. Core navigation/typeahead runs before Enter/Space
 * keydown clicks, so buffered Space may be consumed by typeahead. Composition and
 * Alt/Ctrl/Meta suppress key handling; there is no repeat guard. Literal button
 * hosts default to type=button; custom hosts must forward the clickable ref.
 * Cleanup unregisters the entry and clears its submenu hover timer.
 */
function createItem<T extends ValidComponent>(
  props: MenuItemProps<T>,
  config: {
    /** Optional checked-item role; also changes the default close-on-select policy. */
    role?: 'menuitemcheckbox' | 'menuitemradio'
    /** Checked state exposed to ARIA, styling, and descendant indicators. */
    checked?: () => MenuChecked
    /** Applies the checked/radio proposal after onSelect permits it. */
    commit?: () => void
    /** Register with the parent and treat this entry as the child menu's opener. */
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
    disabled: () => booleanAttribute(own.disabled),
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
  createEffect(context.open, (open) => {
    if (!open) {
      clearTimeout(hoverTimer)
      hoverTimer = undefined
    }
  })
  /** Orders disabled blocking, submenu opening, cancelable selection, state commit, and optional ancestor closure. */
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
  const Host = dynamic(() => own.as ?? 'button')
  return (
    <Host
      {...spread(part(), { ...rest })}
      ref={(el: HTMLElement) => {
        entry.el = el
        setRef(() => own.ref, el)
      }}
    >
      {children()}
    </Host>
  )
}
/**
 * Renders a span for checked or mixed state, or whenever forceMount is true.
 * Outside an item it sees unchecked state without throwing. Author span props
 * override the generated aria-hidden/data-state attributes.
 */
export function MenuItemIndicator(
  props: ComponentProps<'span'> & {
    /** Render even while unchecked. Defaults to false. */
    forceMount?: boolean
  }
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
/**
 * Provides string radio selection and MenuGroup labeling to descendant radio items.
 * Controlled mode follows whether value is defined on each read. No form-reset
 * or hidden-input behavior is installed. The group itself needs no Menu context;
 * its radio items require both providers.
 */
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
/** Last-label association registry for one group. */
const GroupContext = /* @__PURE__ */ createContext<{
  /** Current ID from the most recently registered label, or undefined. */
  label(): string | undefined
  /** Append a live ID reader and return owner cleanup that removes that reader. */
  register(read: () => string): () => void
}>()
/** Polymorphic group host props; author attributes override generated grouping semantics. */
export type MenuGroupProps<T extends ValidComponent = 'div'> = Omit<ComponentProps<T>, 'as'> & {
  /** Group host, defaulting to div. */
  as?: T
}
/**
 * Renders group role and names it from the last registered GroupLabel.
 * Server naming waits for child serialization. Label getters stay live, and their
 * cleanup restores the previous registration. Does not require Menu context or
 * participate in item navigation.
 */
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
  const Host = dynamic(() => own.as ?? 'div')
  const element = (
    <Host
      role="group"
      aria-labelledby={
        associations ? associations.attribute('aria-labelledby', value.label) : value.label()
      }
      {...rest}
    >
      {children()}
    </Host>
  )
  const result = associations ? associations.finish(element) : element
  return result
}
/**
 * Renders a div and registers its author/generated ID with the nearest group.
 * Defaults to aria-hidden=true; author attributes override it. The ID getter is
 * live and removed with the owner. Only the last label names the group.
 * @throws If rendered outside Menu.Group or Menu.RadioGroup.
 */
export function MenuGroupLabel(props: ComponentProps<'div'>): JSX.Element {
  const group = useContext(GroupContext)
  if (!group)
    throw new Error('Menu.GroupLabel must be rendered inside <Menu.Group> or <Menu.RadioGroup>')
  const id = createUniqueId()
  // eslint-disable-next-line solid/reactivity -- The group reads this registered getter reactively.
  onCleanup(group.register(() => (typeof props.id === 'string' ? props.id : id)))
  return <div id={id} aria-hidden="true" {...props} />
}
/** Native hr with author props unchanged; adds no navigation registration and requires no Menu context. */
export function MenuSeparator(props: ComponentProps<'hr'>): JSX.Element {
  return <hr {...props} />
}
