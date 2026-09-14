import { createFloatingLayer } from '@tenon/dom/floating-layer'
import type { ComponentProps, JSX } from '@solidjs/web'
import {
  Show,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  omit,
  onCleanup,
  useContext,
  untrack,
} from 'solid-js'
import { createPositioner } from '../positioning'
import type { Positioner, PositionerOptions } from '../positioning'
import type { Presence } from './presence'

/** Live lifecycle and anchor readers supplied by a selection control. */
export interface SelectionPopupSource {
  /** Anchor and focus-return element. */
  trigger(): HTMLElement | undefined
  /** Listbox surface used for layer registration. */
  content(): HTMLElement | undefined
  /** Logical visibility. */
  open(): boolean
  /** Presence retained through exit animations. */
  life: Presence
  /** Inline layout direction. */
  dir(): 'ltr' | 'rtl'
  /** Initial focus target; false retains focus on the input or trigger. */
  initial(): HTMLElement | false | undefined
  /** Whether dismissal restores focus to the anchor. */
  restore(): boolean
  /** Request closure after an eligible layer dismissal. */
  onDismiss(reason: string): void
}
/** Native wrapper and geometry options for a selection popup. */
export type SelectionPopupProps = Omit<ComponentProps<'div'>, keyof PositionerOptions | 'ref'> &
  Omit<PositionerOptions, 'strategy'> & {
    /** State and lifecycle owned by the public component. */
    source: SelectionPopupSource
    /** Receives the native popover wrapper. */
    ref?: (el: HTMLDivElement) => void
  }
/** Geometry controller with the one measured arrow slot. */
export interface SelectionPositioner extends Positioner {
  /** Attach or clear the decorative arrow layout box. */
  setArrow(el: HTMLElement | undefined): void
}
const PositionContext = createContext<SelectionPositioner>()
/** Read geometry for Content and Arrow; throws outside a selection Positioner. */
export function useSelectionPositioner(): SelectionPositioner {
  const value = useContext(PositionContext)
  if (!value) throw new Error('Selection content must be rendered inside its Positioner')
  return value
}
/** Hosts a nonmodal selection popup with fixed geometry, exit presence, and dismissal. */
export function SelectionPopup(props: SelectionPopupProps): JSX.Element {
  // The root supplies one source object for this component lifetime; its readers stay reactive.
  const context = untrack(() => props.source)
  const rest = omit(
    props as Record<string, unknown>,
    'source',
    'children',
    'ref',
    'side',
    'align',
    'strategy',
    'sideOffset',
    'alignOffset',
    'flip',
    'shift',
    'collisionPadding',
    'collisionBoundary',
    'arrowPadding',
    'matchAnchorSize',
    'tether',
    'fallbackPlacements',
    'hideWhenDetached',
    'dir',
    'autoUpdate',
    'onPositioned',
    'onError'
  )
  /** Own one physical wrapper lifetime and the positioner context for its children. */
  function Mounted(): JSX.Element {
    const [element, setElement] = createSignal<HTMLDivElement>()
    /** Native-show result prevents measuring the wrapper while it is still hidden. */
    const [shown, setShown] = createSignal(false)
    const [arrow, setArrow] = createSignal<HTMLElement>()
    const positioning = createPositioner({
      anchor: context.trigger,
      arrow,
      floating: element,
      enabled: () => shown() && (context.open() || context.life.status() === 'exiting'),
      options: () => ({
        strategy: 'fixed',
        sideOffset: props.sideOffset,
        alignOffset: props.alignOffset,
        flip: props.flip,
        shift: props.shift,
        collisionPadding: props.collisionPadding,
        collisionBoundary: props.collisionBoundary,
        arrowPadding: props.arrowPadding,
        matchAnchorSize: props.matchAnchorSize,
        tether: props.tether,
        fallbackPlacements: props.fallbackPlacements,
        hideWhenDetached: props.hideWhenDetached,
        autoUpdate: props.autoUpdate,
        onPositioned: props.onPositioned,
        onError: props.onError,
        side: props.side ?? 'bottom',
        align: props.align ?? 'start',
        dir: context.dir(),
      }),
    })
    let controller: ReturnType<typeof createFloatingLayer> | undefined
    let attached: HTMLElement | undefined
    createEffect(
      () => ({
        element: element(),
        options: {
          content: context.content(),
          trigger: context.trigger(),
          open: context.open(),
          active: context.open() || context.life.status() === 'exiting',
          positioned: positioning.state().positioned,
          initialFocus: context.initial(),
          finalFocus: context.trigger(),
          restoreFocus: context.restore(),
          onDismiss(reason: string) {
            context.onDismiss(reason)
          },
        },
      }),
      (value) => {
        if (!value.element || !value.options.content) return
        const options = { ...value.options, content: value.options.content }
        if (attached !== value.element) {
          controller?.dispose()
          attached = value.element
          controller = createFloatingLayer(value.element, options)
        } else controller?.update(options)
        setShown(controller?.isShown() ?? false)
      }
    )
    onCleanup(() => controller?.dispose())
    /** Reset native popover defaults, retain author styling, then enforce positioning visibility. */
    const wrapperStyle = () => {
      const baseline = {
        margin: '0',
        inset: 'auto',
        border: '0',
        padding: '0',
        background: 'transparent',
        color: 'inherit',
        width: 'max-content',
        overflow: 'visible',
      }
      const visibility = positioning.positionerProps().style
      const author = props.style
      if (typeof author === 'string')
        return `margin:0;inset:auto;border:0;padding:0;background:transparent;color:inherit;width:max-content;overflow:visible;${author};visibility:${visibility.visibility};pointer-events:${visibility['pointer-events']}`
      return { ...baseline, ...author, ...visibility } as JSX.CSSProperties
    }
    const children = createMemo(() => (
      <PositionContext value={{ ...positioning, setArrow }}>{props.children}</PositionContext>
    ))
    return (
      <div
        {...rest}
        {...positioning.positionerProps()}
        style={wrapperStyle()}
        dir={context.dir()}
        popover="manual"
        data-state={context.open() ? 'open' : 'closed'}
        ref={(el) => {
          setElement(el)
          props.ref?.(el)
        }}
      >
        {children()}
      </div>
    )
  }
  return (
    <Show when={context.life.present()}>
      <Mounted />
    </Show>
  )
}
