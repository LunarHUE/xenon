import { booleanAttribute, setRef } from '../internal/host'
import { hoverCard } from '@xenon-ui/core/hover-card'
import { createHoverIntent } from '@xenon-ui/dom/hover-intent'
import { dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  createContext,
  createEffect,
  createMemo,
  createUniqueId,
  omit,
  onCleanup,
  onSettled,
  untrack,
  useContext,
} from 'solid-js'
import { Popover, HoverPositioner, createPopoverHandle, usePopover } from '../popover/popover'
import type {
  PopoverProps,
  PopoverHandle,
  PopoverRenderState,
  PopoverContentProps,
} from '../popover/popover'
import { getOverlayHandleContext } from '../internal/overlay-handle'
import { spread } from '../spread'

/** Connect detached preview links and typed payload commands to one mounted root. */
export type HoverCardHandle<Payload = unknown> = PopoverHandle<Payload>
/** Live visibility, selected trigger ID, and selected payload. Read properties inside JSX. */
export type HoverCardRenderState<Payload = unknown> = PopoverRenderState<Payload>
/** Create an owner-independent handle; commands are ignored while no Root is attached. */
export function createHoverCardHandle<Payload = unknown>(): HoverCardHandle<Payload> {
  return createPopoverHandle<Payload>()
}

/** Nonmodal preview root props with hover and keyboard-focus timing. */
export type HoverCardProps<T extends ValidComponent = 'div', Payload = unknown> = Omit<
  PopoverProps<T, Payload>,
  | 'modal'
  | 'initialFocus'
  | 'finalFocus'
  | 'restoreFocus'
  | 'closeOnFocusOutside'
  | 'onFocusOutside'
> & {
  /** Delay before opening by pointer or keyboard focus, in milliseconds. Defaults to 600. */
  openDelay?: number
  /** Delay after pointer and focus leave the preview, in milliseconds. Defaults to 300. */
  closeDelay?: number
  /** Suppress trigger intent and cancel pending timers. Defaults to false. */
  disabled?: JSX.BooleanAttribute
}
/** Native anchor props. No click or key handler interferes with link navigation. */
export type HoverCardTriggerProps<T extends ValidComponent = 'a', Payload = unknown> = Omit<
  ComponentProps<T>,
  'as' | 'ref' | 'children'
> & {
  /** Host element or component; defaults to a. Custom components must forward attributes and refs. */
  as?: T
  /** Connect to a mounted Root outside the trigger's ancestry. */
  handle?: HoverCardHandle<Payload>
  /** Data selected when this trigger opens the card. */
  payload?: NoInfer<Payload>
  /** Link contents. */
  children?: JSX.Element
  /** Receives the trigger host. */
  ref?: ComponentProps<T>['ref']
}
/** Nonmodal dialog props. Supply an accessible name through Title or aria-label. */
export type HoverCardContentProps<T extends ValidComponent = 'div'> = PopoverContentProps<T>
/** Fixed native-popover geometry wrapper options. */
export type HoverCardPositionerProps = ComponentProps<typeof Popover.Positioner>
/** Optional explicit anchor host props. */
export type HoverCardAnchorProps<T extends ValidComponent = 'div'> =
  import('../popover/popover').PopoverAnchorProps<T>
/** Measured arrow box props; the author supplies artwork. */
export type HoverCardArrowProps<T extends ValidComponent = 'div'> =
  import('../popover/popover').PopoverArrowProps<T>
/** Transition viewport props, including author-owned animation styles. */
export type HoverCardViewportProps = import('../popover/popover').PopoverViewportProps

type RootContext = ReturnType<typeof usePopover>
type TriggerEntry = Parameters<RootContext['registerTrigger']>[0]
interface Context {
  /** Shared popup state and native layer registration. */
  root: RootContext
  /** Owns hover/focus timers and travel geometry. */
  intent: ReturnType<typeof createHoverIntent>
  /** Mounted anchors eligible to open this preview. */
  entries: Set<TriggerEntry>
  /** Suppresses focus opening while Escape restores the trigger. */
  restoring: boolean
}
const HoverCardContext = createContext<Context | null>(null)
const contexts = new WeakMap<RootContext, Context>()
/** Read the nearest preview state; throws when called outside HoverCard.Root. */
export function useHoverCard(): Context {
  const context = useContext(HoverCardContext)
  if (!context) throw new Error('HoverCard parts must be rendered inside HoverCard.Root')
  return context
}

/** Own delayed intent while reusing Popover's presence, registration, and native layer lifecycle. */
function HoverCardRoot<T extends ValidComponent = 'div', Payload = unknown>(
  props: HoverCardProps<T, Payload>
): JSX.Element {
  let local: Context | undefined
  const rest = omit(
    props as Record<string, unknown>,
    'children',
    'openDelay',
    'closeDelay',
    'disabled',
    'onEscapeKeyDown',
    'onOpenChange'
  )
  function Bridge(bridge: { children?: JSX.Element }): JSX.Element {
    const root = usePopover('HoverCard.Root')
    const entries = new Set<TriggerEntry>()
    const intent = createHoverIntent({
      trigger: root.trigger,
      triggers: () => [...entries].flatMap((entry) => (entry.element ? [entry.element] : [])),
      content: root.content,
      open: () => root.result().state.open,
      disabled: () => booleanAttribute(props.disabled),
      openDelay: () => props.openDelay ?? 600,
      focusDelay: () => props.openDelay ?? 600,
      closeDelay: () => props.closeDelay ?? 300,
      hoverable: () => true,
      closeOnPress: () => false,
      onOpen(element) {
        const entry = [...entries].find((entry) => entry.element === element)
        if (entry) root.activate(entry, false)
      },
      onClose: () => root.change(false),
    })
    const context: Context = { root, intent, entries, restoring: false }
    local = context
    contexts.set(root, context)
    createEffect(
      () => [props.disabled, props.openDelay, props.closeDelay],
      () => untrack(() => intent.refresh())
    )
    onCleanup(() => {
      intent.dispose()
      contexts.delete(root)
    })
    const children = createMemo(() => (
      <HoverCardContext value={context}>{bridge.children}</HoverCardContext>
    ))
    return <>{children()}</>
  }
  return (
    <Popover.Root
      {...rest}
      modal={false}
      initialFocus={false}
      restoreFocus={false}
      closeOnFocusOutside={false}
      onOpenChange={(open) => {
        if (!open) local?.intent.cancel()
        props.onOpenChange?.(open)
      }}
      onEscapeKeyDown={(event) => {
        props.onEscapeKeyDown?.(event)
        if (event.defaultPrevented || !local) return
        local.intent.cancel()
        const content = local.root.content()
        if (content?.contains(content.ownerDocument.activeElement)) {
          local.restoring = true
          local.root.trigger()?.focus({ preventScroll: true })
          local.restoring = false
        }
      }}
    >
      {(state: PopoverRenderState<Payload>) => (
        <Bridge>
          {(() => {
            const children = props.children
            return typeof children === 'function' ? children(state) : children
          })()}
        </Bridge>
      )}
    </Popover.Root>
  )
}

/** Link opener with delayed hover/focus and immediate switching between already-open previews. */
export function HoverCardTrigger<T extends ValidComponent = 'a', Payload = unknown>(
  props: HoverCardTriggerProps<T, Payload>
): JSX.Element {
  const inherited = useContext(HoverCardContext)
  const handle = untrack(() => props.handle)
  const context = () => {
    if (!handle) return inherited
    const root = getOverlayHandleContext(handle)
    return root ? contexts.get(root) : undefined
  }
  if (!handle && !inherited) throw new Error('HoverCard.Trigger requires a Root or handle')
  const generated = createUniqueId()
  const own = props as HoverCardTriggerProps<'a', Payload>
  const entry: TriggerEntry = { id: () => own.id || generated, payload: () => props.payload }
  const register = (value: Context) => {
    value.entries.add(entry)
    const release = value.root.registerTrigger(entry)
    return () => {
      value.entries.delete(entry)
      if (!isServer && untrack(value.root.trigger) === entry.element) {
        value.intent.cancel()
        value.root.change(false)
      }
      release()
    }
  }
  if (handle)
    createEffect(context, (value) => {
      if (!value) return
      const release = register(value)
      if (entry.element && !untrack(value.root.trigger)) value.root.setTrigger(entry.element)
      return release
    })
  else {
    onCleanup(register(inherited!))
    onSettled(() => {
      if (entry.element && !untrack(inherited!.root.trigger))
        inherited!.root.setTrigger(entry.element)
    })
  }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'ref',
    'children',
    'handle',
    'payload',
    'id'
  )
  const attributes = () => {
    const current = context()
    const root = current?.root
    const part = hoverCard({
      open: root?.result().state.open,
      current: root?.activeTrigger(entry) ?? false,
      ids: {
        trigger: entry.id(),
        content: root?.result().parts.content.attrs.id as string | undefined,
      },
    }).parts.trigger
    return spread(
      {
        attrs: {
          ...part.attrs,
          'aria-controls': root?.association('aria-controls', () =>
            root.activeTrigger(entry) && root.result().state.open
              ? (root.result().parts.content.attrs.id as string | undefined)
              : undefined
          ),
        },
        on: {
          pointerenter: (event) => context()?.intent.triggerEnter(event),
          pointerleave: (event) => context()?.intent.triggerLeave(event),
          pointerdown: (event) => context()?.intent.press(event),
          focusin: (event) => {
            const current = context()
            if (!current?.restoring) current?.intent.focusIn(event)
          },
          focusout: (event) => context()?.intent.focusOut(event),
        },
      },
      { ...rest }
    )
  }
  const Host = dynamic(() => props.as ?? 'a')
  return (
    <Host
      {...attributes()}
      ref={(element: HTMLElement) => {
        entry.element = element
        setRef(() => props.ref, element)
      }}
    >
      {props.children}
    </Host>
  )
}

/** Hoverable focus region inside Positioner. It never takes focus automatically. */
export function HoverCardContent<T extends ValidComponent = 'div'>(
  props: HoverCardContentProps<T>
): JSX.Element {
  const context = useHoverCard()
  const rest = omit(props as Record<string, unknown>, 'children')
  const attributes = () =>
    spread(
      {
        attrs: {},
        on: {
          pointerenter: (event) => context.intent.contentEnter(event),
          pointerleave: (event) => context.intent.contentLeave(event),
          focusin: (event) => context.intent.focusIn(event),
          focusout: (event) => context.intent.focusOut(event),
        },
      },
      { ...rest }
    )
  const children = createMemo(() => (props as { children?: JSX.Element }).children)
  const element = createMemo(() => (
    <Popover.Content {...attributes()}>{children()}</Popover.Content>
  ))
  return <>{element()}</>
}

/**
 * Nonmodal link previews. Compose Portal > Positioner > Content > Viewport; place
 * Arrow inside Positioner. Hover and keyboard focus open after 600ms by default,
 * leaving both regions closes after 300ms, and touch never opens a preview.
 */
export const HoverCard = Object.assign(HoverCardRoot, {
  /** Visibility and intent provider. */
  Root: HoverCardRoot,
  /** Create a typed detached trigger and imperative command handle. */
  createHandle: createHoverCardHandle,
  /** Native link opener with delayed intent. */
  Trigger: HoverCardTrigger,
  /** Move content while preserving modal ancestry and Solid ownership. */
  Portal: Popover.Portal,
  /** Native top-layer host and fixed positioning. */
  Positioner: HoverPositioner,
  /** Nonmodal preview dialog and focus region. */
  Content: HoverCardContent,
  /** Optional content transition and scrolling host. */
  Viewport: Popover.Viewport,
  /** Optional explicit geometry anchor. */
  Anchor: Popover.Anchor,
  /** Measured arrow host with author-supplied artwork. */
  Arrow: Popover.Arrow,
  /** Accessible dialog title. */
  Title: Popover.Title,
  /** Accessible dialog description. */
  Description: Popover.Description,
})
