import { navigationMenu } from '@tenon/core/navigation-menu'
import type { AnyPart } from '@tenon/core'
import { createFloatingLayer } from '@tenon/dom/floating-layer'
import type { FloatingLayerOptions } from '@tenon/dom/floating-layer'
import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
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
import { createPositioner } from '../positioning/positioning'
import type { Positioner, PositionerOptions } from '../positioning/positioning'
import { OverlayPortal } from '../internal/overlay-portal'
import { FloatingViewport } from '../internal/floating-viewport'
import type { FloatingViewportProps } from '../internal/floating-viewport'

/** Polymorphic host attributes. Custom components must forward attributes and refs. */
type Host<T extends ValidComponent> = ComponentProps<T> & {
  /** Host tag or forwarding component; defaults depend on the part. */
  as?: T
  /** Receives the native host used for registration and geometry. */
  ref?: (element: HTMLElement) => void
}
type DismissPolicy = Pick<
  FloatingLayerOptions,
  | 'closeOnEscape'
  | 'closeOnOutside'
  | 'closeOnFocusOutside'
  | 'onEscapeKeyDown'
  | 'onPointerOutside'
  | 'onFocusOutside'
>

/** Root navigation policy. Null closes controlled selection; undefined selects uncontrolled state. */
export type NavigationMenuProps<T extends ValidComponent = 'nav'> = Omit<
  Host<T>,
  'onValueChange' | 'defaultValue'
> &
  DismissPolicy & {
    /** Selected item, or null for closed. */
    value?: string | null
    /** Initial selection, read once and defaulting to null. */
    defaultValue?: string | null
    /** Reports different selection requests after uncontrolled state updates. */
    onValueChange?: (value: string | null) => void
    /** Axis for list arrows, defaulting to horizontal. */
    orientation?: 'horizontal' | 'vertical'
    /** Horizontal direction; otherwise sampled from the root's nearest dir attribute. */
    dir?: 'ltr' | 'rtl'
    /** Enable mouse-hover opening, defaulting to true. Touch never starts hover timers. */
    openOnHover?: boolean
    /** Initial hover delay in milliseconds, defaulting to 200. Open panels switch immediately. */
    openDelay?: number
    /** Delay after leaving a trigger or panel, defaulting to 150 milliseconds. */
    closeDelay?: number
  }
interface Entry {
  disabled(): boolean
  value(): string
  element?: HTMLElement
}
interface Context {
  dismissPolicy(): DismissPolicy
  association(read: () => string | undefined): string | undefined
  direction(): 'ltr' | 'rtl'
  value(): string | null
  change(value: string | null): void
  result(): ReturnType<typeof navigationMenu>
  id(part: 'trigger' | 'content', value: string): string
  claim(part: 'trigger' | 'content', value: string, id: string): void
  register(entry: Entry): () => void
  trigger(): HTMLElement | undefined
  panel(value?: string | null): HTMLElement | undefined
  setPanel(value: string, el: HTMLElement): void
  root(): HTMLElement | undefined
  enter(value?: string): void
  leave(): void
  cancel(): void
  focus(value: string, last?: boolean): void
  flushFocus(): void
  navigate(event: KeyboardEvent): void
  beforeChange(listener: () => void): () => void
}
const Context = createContext<Context | null>(null)
const ItemContext = createContext<(() => string) | null>(null)
function useNavigation(name: string) {
  const context = useContext(Context)
  if (!context)
    throw new Error(`NavigationMenu.${name} must be rendered inside NavigationMenu.Root`)
  return context
}
/** Visible native tab stops, preserving ordinary links, inputs, and nested buttons. */
function stops(root: HTMLElement | undefined): HTMLElement[] {
  if (!root) return []
  return Array.from(
    root.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]')
  ).filter(
    (el) =>
      el.tabIndex >= 0 &&
      !el.matches(':disabled') &&
      !el.closest('[hidden],[inert]') &&
      el.getClientRects().length > 0
  )
}
/** Owns the scalar panel selection and navigation registry. Initialization emits no callback. */
export function NavigationMenuRoot<T extends ValidComponent = 'nav'>(
  props: NavigationMenuProps<T>
): JSX.Element {
  const own = props as NavigationMenuProps<'nav'>
  const [internal, setInternal] = createSignal<string | null>(
    untrack(() => own.defaultValue ?? null)
  )
  const [root, setRoot] = createSignal<HTMLElement>()
  const [version, setVersion] = createSignal(0, { ownedWrite: true })
  const [ambient, setAmbient] = createSignal<'ltr' | 'rtl'>('ltr')
  const entries: Entry[] = []
  const panels = new Map<string, HTMLElement>()
  const ids = new Map<string, string>()
  const base = createUniqueId()
  const before = new Set<() => void>()
  let pendingFocus: { item: string; last: boolean } | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  const cancel = () => {
    clearTimeout(timer)
    timer = undefined
  }
  const value = () => (own.value === undefined ? internal() : own.value)
  const id = (part: string, item: string) => {
    const key = `${part}:${item}`
    if (!ids.has(key)) ids.set(key, `${base}-${part}-${ids.size}`)
    return ids.get(key)!
  }
  const change = (next: string | null) => {
    cancel()
    if (next === untrack(value)) return
    pendingFocus = undefined
    before.forEach((listener) => listener())
    if (own.value === undefined) setInternal(next)
    own.onValueChange?.(next)
  }
  const result = () =>
    navigationMenu({
      value: value(),
      orientation: own.orientation,
      ids: { trigger: (item) => id('trigger', item), content: (item) => id('content', item) },
      onValueChange: change,
    })
  const associations = isServer ? serverAssociations() : undefined
  const context: Context = {
    dismissPolicy: () => ({
      closeOnEscape: own.closeOnEscape,
      closeOnOutside: own.closeOnOutside,
      closeOnFocusOutside: own.closeOnFocusOutside,
      onEscapeKeyDown: own.onEscapeKeyDown,
      onPointerOutside: own.onPointerOutside,
      onFocusOutside: own.onFocusOutside,
    }),
    direction: () => own.dir ?? ambient(),
    association: (read) => (associations ? associations.attribute('aria-controls', read) : read()),
    value,
    change,
    result,
    id,
    root,
    cancel,
    claim(part, item, claimed) {
      ids.set(`${part}:${item}`, claimed)
    },
    register(entry) {
      entries.push(entry)
      if (!isServer) setVersion((v) => v + 1)
      return () => {
        entries.splice(entries.indexOf(entry), 1)
        if (!isServer) setVersion((v) => v + 1)
      }
    },
    trigger() {
      version()
      return entries.find((entry) => entry.value() === value())?.element
    },
    panel(item = value()) {
      version()
      return item === null ? undefined : panels.get(item)
    },
    setPanel(item, element) {
      panels.set(item, element)
      if (!isServer) setVersion((v) => v + 1)
    },
    enter(item) {
      cancel()
      if (item === undefined || own.openOnHover === false) return
      if (value() !== null) change(item)
      else
        timer = setTimeout(() => {
          const entry = entries.find((candidate) => candidate.value() === item)
          if (
            own.openOnHover !== false &&
            entry?.element?.isConnected &&
            !entry.disabled() &&
            !entry.element.matches(':disabled')
          )
            change(item)
        }, own.openDelay ?? 200)
    },
    leave() {
      cancel()
      timer = setTimeout(() => change(null), own.closeDelay ?? 150)
    },
    focus(item, last = false) {
      change(item)
      pendingFocus = { item, last }
      onSettled(() => context.flushFocus())
    },
    flushFocus() {
      if (!pendingFocus || value() !== pendingFocus.item) return
      const panel = context.panel(pendingFocus.item)
      if (
        !panel ||
        panel.ownerDocument.defaultView?.getComputedStyle(panel).visibility === 'hidden'
      )
        return
      const elements = stops(panel)
      const target = pendingFocus.last ? elements.at(-1) : elements[0]
      if (target) {
        target.focus()
        pendingFocus = undefined
      }
    },
    navigate(event) {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.isComposing
      )
        return
      const list = event.currentTarget as HTMLElement
      const elements = stops(list).filter((el) => !el.closest('[data-navigation-panel]'))
      const index = elements.indexOf(event.target as HTMLElement)
      if (index < 0) return
      const vertical = own.orientation === 'vertical'
      const rtl = (own.dir ?? ambient()) === 'rtl'
      const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'
      const backward = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
      let next: HTMLElement | undefined
      if (event.key === forward) next = elements[(index + 1) % elements.length]
      if (event.key === backward) next = elements[(index - 1 + elements.length) % elements.length]
      if (event.key === 'Home') next = elements[0]
      if (event.key === 'End') next = elements.at(-1)
      if (next) {
        event.preventDefault()
        next.focus()
      }
    },
    beforeChange(listener) {
      before.add(listener)
      return () => before.delete(listener)
    },
  }
  onSettled(() => {
    setAmbient(root()?.closest('[dir]')?.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr')
  })
  onCleanup(cancel)
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'ref',
    'children',
    'value',
    'defaultValue',
    'onValueChange',
    'orientation',
    'openOnHover',
    'openDelay',
    'closeDelay',
    'closeOnEscape',
    'closeOnOutside',
    'closeOnFocusOutside',
    'onEscapeKeyDown',
    'onPointerOutside',
    'onFocusOutside'
  )
  const children = createMemo(() => <Context value={context}>{own.children}</Context>)
  const element = (
    <Dynamic
      component={own.as ?? 'nav'}
      ref={(el: HTMLElement) => {
        setRoot(el)
        own.ref?.(el)
      }}
      {...spread(result().parts.root, { 'aria-label': 'Main navigation', ...rest })}
    >
      {children()}
    </Dynamic>
  )
  // eslint-disable-next-line solid/components-return-once -- Server associations finalize one synchronous render.
  return associations ? associations.finish(element) : element
}
/** Native list with optional arrow and Home/End shortcuts. Every native tab stop remains tabbable. */
export function NavigationMenuList<T extends ValidComponent = 'ul'>(props: Host<T>): JSX.Element {
  const context = useNavigation('List')
  const own = props as Host<'ul'>
  const rest = omit(props as Record<string, unknown>, 'as', 'children')
  return (
    <Dynamic
      component={own.as ?? 'ul'}
      {...spread(
        { attrs: context.result().parts.list.attrs, on: { keydown: context.navigate } } as AnyPart,
        rest
      )}
    >
      {own.children}
    </Dynamic>
  )
}
/** Native list item providing a stable, nonempty or empty string identity for its trigger and content. */
export function NavigationMenuItem<T extends ValidComponent = 'li'>(
  props: Omit<Host<T>, 'value'> & { value: string }
): JSX.Element {
  const own = props as unknown as Omit<Host<'li'>, 'value'> & { value: string }
  useNavigation('Item')
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'value')
  const children = createMemo(() => (
    <ItemContext value={() => own.value}>{own.children}</ItemContext>
  ))
  return (
    <Dynamic component={own.as ?? 'li'} {...rest}>
      {children()}
    </Dynamic>
  )
}
/** Native disclosure button. Enter/Space use native click; ArrowDown opens and focuses the first panel tab stop. */
export function NavigationMenuTrigger<T extends ValidComponent = 'button'>(
  props: Host<T>
): JSX.Element {
  const context = useNavigation('Trigger')
  const item = useContext(ItemContext)
  if (!item) throw new Error('NavigationMenu.Trigger must be rendered inside NavigationMenu.Item')
  const own = props as Host<'button'>
  const entry: Entry = { value: item, disabled: () => !!own.disabled }
  if (own.id) context.claim('trigger', item(), own.id)
  onCleanup(context.register(entry))
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children')
  const part = () => {
    const original = context.result().parts.trigger(item(), !!own.disabled)
    return {
      attrs: {
        ...original.attrs,
        'aria-controls': context.association(
          () => context.result().parts.trigger(item(), !!own.disabled).attrs['aria-controls']
        ),
      },
      on: {
        ...original.on,
        pointerenter(event: PointerEvent) {
          if (event.pointerType === 'mouse' && !own.disabled) context.enter(item())
        },
        pointerleave(event: PointerEvent) {
          if (event.pointerType === 'mouse') context.leave()
        },
        keydown(event: KeyboardEvent) {
          if (own.disabled || event.altKey || event.ctrlKey || event.metaKey || event.isComposing)
            return
          if (
            event.key ===
            (context.result().parts.root.attrs['data-orientation'] === 'vertical'
              ? context.direction() === 'rtl'
                ? 'ArrowLeft'
                : 'ArrowRight'
              : 'ArrowDown')
          ) {
            event.preventDefault()
            context.focus(item())
          }
          if (
            event.key === 'Tab' &&
            !event.shiftKey &&
            context.value() === item() &&
            stops(context.panel()).length
          ) {
            event.preventDefault()
            context.focus(item())
          }
        },
      },
    } as AnyPart
  }
  return (
    <Dynamic
      component={own.as ?? 'button'}
      ref={(el: HTMLElement) => {
        entry.element = el
        own.ref?.(el)
      }}
      {...spread(part(), rest)}
    >
      {own.children}
    </Dynamic>
  )
}
/** Native anchor props plus current-page semantics and cancellable selection notification. */
export type NavigationMenuLinkProps<T extends ValidComponent = 'a'> = Omit<Host<T>, 'onSelect'> & {
  /** Adds aria-current=page when true. */
  current?: boolean
  /** Runs after an uncanceled click. preventDefault keeps the panel open and cancels native navigation. */
  onSelect?: (event: MouseEvent) => void
}
/** Preserves native href, target, modifier-key, and download behavior. Uncanceled activation closes the panel. */
export function NavigationMenuLink<T extends ValidComponent = 'a'>(
  props: NavigationMenuLinkProps<T>
): JSX.Element {
  const context = useNavigation('Link')
  const own = props as NavigationMenuLinkProps<'a'>
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'current', 'onSelect')
  const part = () => ({
    attrs: context.result().parts.link(own.current).attrs,
    on: {
      click(event: MouseEvent) {
        own.onSelect?.(event)
        if (!event.defaultPrevented) context.change(null)
      },
    },
  })
  return (
    <Dynamic component={own.as ?? 'a'} {...spread(part() as AnyPart, rest)}>
      {own.children}
    </Dynamic>
  )
}
/** Panel attributes. Supply value when placing panels together outside their Item, such as inside Viewport. */
export type NavigationMenuContentProps<T extends ValidComponent = 'div'> = Host<T> & {
  /** Panel identity; omit only when inheriting an enclosing Item value. */
  value?: string
}
/** Kept-mounted panel, hidden while unselected. Arrow keys walk panel tab stops without wrapping; Tab retains logical trigger order across portals. */
export function NavigationMenuContent<T extends ValidComponent = 'div'>(
  props: NavigationMenuContentProps<T>
): JSX.Element {
  const context = useNavigation('Content')
  const inherited = useContext(ItemContext)
  const own = props as NavigationMenuContentProps<'div'>
  const item = () => own.value ?? inherited?.()
  if (item() === undefined)
    throw new Error('NavigationMenu.Content requires value or NavigationMenu.Item')
  if (own.id) context.claim('content', item()!, own.id)
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'ref', 'value')
  const keydown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return
    const elements = stops(context.panel(item()))
    const index = elements.indexOf(event.target as HTMLElement)
    if (event.key === 'Tab' && index >= 0) {
      if (event.shiftKey && index === 0) {
        event.preventDefault()
        context.trigger()?.focus()
      }
      if (!event.shiftKey && index === elements.length - 1) {
        const trigger = context.trigger()
        const all = stops(trigger?.ownerDocument.body).filter(
          (el) => !context.panel()?.contains(el)
        )
        const next = trigger ? all[all.indexOf(trigger) + 1] : undefined
        if (next) {
          event.preventDefault()
          next.focus()
          context.change(null)
        }
      }
      return
    }
    const target = event.target as HTMLElement
    if (
      target.matches('input,textarea,select') ||
      target.closest('[contenteditable]:not([contenteditable="false"])')
    )
      return
    let next = index
    if (
      event.key === 'ArrowDown' ||
      event.key === (context.direction() === 'rtl' ? 'ArrowLeft' : 'ArrowRight')
    )
      next++
    else if (
      event.key === 'ArrowUp' ||
      event.key === (context.direction() === 'rtl' ? 'ArrowRight' : 'ArrowLeft')
    )
      next--
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = elements.length - 1
    else return
    event.preventDefault()
    elements[Math.max(0, Math.min(next, elements.length - 1))]?.focus()
  }
  return (
    <Dynamic
      component={own.as ?? 'div'}
      ref={(el: HTMLElement) => {
        context.setPanel(item()!, el)
        own.ref?.(el)
      }}
      {...spread(
        {
          attrs: { ...context.result().parts.content(item()!).attrs, 'data-navigation-panel': '' },
          on: {
            keydown,
            pointerenter: (event: PointerEvent) => {
              if (event.pointerType === 'mouse') context.enter()
            },
            pointerleave: (event: PointerEvent) => {
              if (event.pointerType === 'mouse') context.leave()
            },
          },
        } as AnyPart,
        rest
      )}
    >
      {own.children}
    </Dynamic>
  )
}
const PositionerContext = createContext<
  (Positioner & { setArrow(el: HTMLElement | undefined): void }) | null
>(null)
/** Fixed-position native hosting attributes and collision options. */
export type NavigationMenuPositionerProps = Omit<ComponentProps<'div'>, keyof PositionerOptions> &
  Omit<PositionerOptions, 'strategy'>
/** Native nonmodal popup anchored to the selected trigger. Opening never moves focus automatically. */
export function NavigationMenuPositioner(props: NavigationMenuPositionerProps): JSX.Element {
  const context = useNavigation('Positioner')
  const [element, setElement] = createSignal<HTMLDivElement>()
  const [arrow, setArrow] = createSignal<HTMLElement>()
  const [shown, setShown] = createSignal(false)
  const open = () => context.value() !== null
  const positioner = createPositioner({
    anchor: context.trigger,
    floating: element,
    arrow,
    enabled: () => open() && shown(),
    options: () => ({
      strategy: 'fixed',
      side: props.side,
      align: props.align,
      sideOffset: props.sideOffset,
      alignOffset: props.alignOffset,
      collisionBoundary: props.collisionBoundary,
      collisionPadding: props.collisionPadding,
      flip: props.flip,
      shift: props.shift,
      tether: props.tether,
      fallbackPlacements: props.fallbackPlacements,
      hideWhenDetached: props.hideWhenDetached,
      pointerEvents: props.pointerEvents,
      matchAnchorSize: props.matchAnchorSize,
      arrowPadding: props.arrowPadding,
      autoUpdate: props.autoUpdate,
      onPositioned: props.onPositioned,
      onError: props.onError,
      dir: props.dir,
    }),
  })
  let controller: ReturnType<typeof createFloatingLayer> | undefined
  createEffect(
    () => ({
      element: element(),
      open: open(),
      trigger: context.trigger(),
      root: context.root(),
      positioned: positioner.state().positioned,
      policy: context.dismissPolicy(),
    }),
    (state) => {
      if (!state.element) return
      const options = {
        ...state.policy,
        content: state.element,
        open: state.open,
        active: state.open,
        positioned: state.positioned,
        trigger: state.trigger,
        branches: state.root ? [state.root] : [],
        initialFocus: false as const,
        restoreFocus: false,
        onDismiss(reason: string) {
          if (
            reason === 'escape' &&
            state.element?.contains(state.element.ownerDocument.activeElement)
          )
            state.trigger?.focus()
          context.change(null)
        },
      }
      if (!controller) controller = createFloatingLayer(state.element, options)
      else controller.update(options)
      setShown(controller.isShown())
      if (state.positioned && state.open) context.flushFocus()
    }
  )
  onCleanup(() => controller?.dispose())
  const rest = omit(
    props as Record<string, unknown>,
    'children',
    'ref',
    'style',
    'side',
    'align',
    'sideOffset',
    'alignOffset',
    'collisionBoundary',
    'collisionPadding',
    'flip',
    'shift',
    'tether',
    'fallbackPlacements',
    'hideWhenDetached',
    'pointerEvents',
    'matchAnchorSize',
    'arrowPadding',
    'autoUpdate',
    'onPositioned',
    'onError',
    'dir'
  )
  const children = createMemo(() => (
    <PositionerContext value={{ ...positioner, setArrow }}>{props.children}</PositionerContext>
  ))
  return (
    <div
      {...rest}
      ref={(el) => {
        setElement(el)
        if (typeof props.ref === 'function') props.ref(el)
      }}
      popover="manual"
      hidden={!open()}
      data-part="positioner"
      data-state={open() ? 'open' : 'closed'}
      style={
        typeof props.style === 'string'
          ? `margin:0;inset:auto;border:0;padding:0;background:transparent;overflow:visible;${props.style};visibility:${positioner.positionerProps().style.visibility};pointer-events:${positioner.positionerProps().style['pointer-events']}`
          : {
              margin: '0',
              inset: 'auto',
              border: '0',
              padding: '0',
              background: 'transparent',
              overflow: 'visible',
              ...props.style,
              ...positioner.positionerProps().style,
            }
      }
    >
      {children()}
    </div>
  )
}
/** Shared panel viewport with measured CSS dimensions and inert outgoing snapshots. Place Content parts inside. */
export function NavigationMenuViewport(props: Omit<FloatingViewportProps, 'source'>): JSX.Element {
  const context = useNavigation('Viewport')
  return (
    <FloatingViewport
      {...props}
      data-part="viewport"
      source={{
        open: () => context.value() !== null,
        trigger: context.trigger,
        content: context.panel,
        beforeChange: context.beforeChange,
      }}
    />
  )
}
/** Presentation-only measured arrow. Requires Positioner; provide arrow artwork as children. */
export function NavigationMenuArrow(props: Host<'div'>): JSX.Element {
  const positioner = useContext(PositionerContext)
  if (!positioner)
    throw new Error('NavigationMenu.Arrow must be rendered inside NavigationMenu.Positioner')
  onCleanup(() => {
    if (!isServer) positioner.setArrow(undefined)
  })
  const rest = omit(props, 'ref', 'children', 'as')
  return (
    <Dynamic
      component={props.as ?? 'div'}
      ref={(el: HTMLElement) => {
        positioner.setArrow(el)
        props.ref?.(el)
      }}
      {...positioner.arrowProps()}
      {...rest}
    >
      {props.children}
    </Dynamic>
  )
}
/** Site navigation parts using nav, ul, li, buttons and native anchors. Content stays mounted and hidden while closed. */
export const NavigationMenu = Object.assign(NavigationMenuRoot, {
  /** Navigation landmark, selection provider and interaction policy. */
  Root: NavigationMenuRoot,
  /** Native list with optional arrow and Home/End shortcuts. */
  List: NavigationMenuList,
  /** Native list item providing a string identity to its descendants. */
  Item: NavigationMenuItem,
  /** Disclosure button with mouse hover and keyboard opening. */
  Trigger: NavigationMenuTrigger,
  /** Native anchor preserving navigation and supporting cancellable selection. */
  Link: NavigationMenuLink,
  /** Retained panel hidden while inactive and named by its trigger. */
  Content: NavigationMenuContent,
  /** Moves popup hosts while preserving Solid context and native modal ancestry. */
  Portal: OverlayPortal,
  /** Fixed native popup host anchored to the selected trigger. */
  Positioner: NavigationMenuPositioner,
  /** Measures shared content and retains inert outgoing snapshots for CSS transitions. */
  Viewport: NavigationMenuViewport,
  /** Registers presentation-only arrow geometry within Positioner. */
  Arrow: NavigationMenuArrow,
})
