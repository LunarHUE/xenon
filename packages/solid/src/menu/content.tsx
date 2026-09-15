import { isServer } from '@solidjs/web'
import { createFloatingLayer } from '@xenon/dom/floating-layer'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  Show,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  flush,
  omit,
  onCleanup,
  onSettled,
  untrack,
  useContext,
} from 'solid-js'
import { createPositioner } from '../positioning'
import type { Positioner, PositionerOptions } from '../positioning'
import { spread } from '../spread'
import { useMenu } from './context'
import { FloatingViewport } from '../internal/floating-viewport'
import type { FloatingViewportProps } from '../internal/floating-viewport'

/**
 * Native wrapper props and {@link PositionerOptions}, with fixed positioning strategy.
 * Menu context owns direction: the inherited dir option is ignored here; set dir
 * on Menu instead. Default placement is bottom/start for a root and right/start
 * for an LTR submenu or left/start for an RTL submenu.
 */
export type MenuPositionerProps = Omit<ComponentProps<'div'>, keyof PositionerOptions | 'ref'> &
  Omit<PositionerOptions, 'strategy'> & {
    /** Receives the manual-popover wrapper after its internal element ref is recorded. */
    ref?: (el: HTMLDivElement) => void
  }
/** Polymorphic menu surface props; the surrounding Positioner owns native presentation. */
export type MenuContentProps<T extends ValidComponent = 'div'> = ComponentProps<T> & {
  /** Rendered menu host, defaulting to div; custom components must forward props and ref. */
  as?: T
  /** Receives the content host after the menu context records it. */
  ref?: (el: HTMLElement) => void
}
/** Positioner controller supplied to its descendant content for resolved placement hooks. */
const PositionContext = createContext<
  Positioner & { setArrow(element: HTMLElement | undefined): void }
>()
/**
 * Renders a fixed-position manual-popover wrapper while menu presence requires it.
 *
 * @remarks
 * Anchors to the current menu trigger and defaults placement according to root or
 * submenu context. {@link createPositioner} owns coordinates and observation;
 * calculation is enabled only after native showing and while open or exiting.
 * {@link createFloatingLayer} owns native presentation and dismissal, creating
 * its focus scope only once positioned. Initial focus comes from the menu's
 * requested edge or content fallback; final focus targets its trigger according
 * to the menu's current restoration policy.
 *
 * Escape requests closure of this menu. Other layer dismissals close the entire
 * menu chain without restoring focus. Native presentation and positioning remain
 * active during exit. Physical unmount disposes the layer; replacing the wrapper
 * ref disposes its previous controller. Closed force-mounted wrappers remain
 * rendered without an active native layer.
 *
 * The wrapper is always a div with popover=manual. Author styles override the
 * native-popover baseline, but managed visibility and pointer-events win. Generated
 * positioning props, direction, popover mode, state, and ref override overlapping
 * wrapper props. Supply visual menu styling on Content as appropriate.
 * @throws If rendered outside Menu or Menu.Sub.
 */
export function MenuPositioner(props: MenuPositionerProps): JSX.Element {
  const context = useMenu('Menu.Positioner')
  const rest = omit(
    props as Record<string, unknown>,
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
    'pointerEvents',
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
    const [arrow, setArrow] = createSignal<HTMLElement | undefined>(undefined, { ownedWrite: true })
    const positioning = createPositioner({
      anchor: context.anchor,
      floating: element,
      arrow,
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
        pointerEvents: props.pointerEvents,
        autoUpdate: props.autoUpdate,
        onPositioned: props.onPositioned,
        onError: props.onError,
        side:
          props.side ?? (context.parent ? (context.dir() === 'rtl' ? 'left' : 'right') : 'bottom'),
        align: props.align ?? 'start',
        dir: context.dir(),
      }),
    })
    let focusedRevision = 0
    createEffect(
      () => ({
        positioned: positioning.state().positioned,
        open: context.open(),
        revision: context.focusRevision(),
      }),
      (state) => {
        if (!state.positioned || !state.open || state.revision === focusedRevision) return
        onSettled(() =>
          untrack(() => {
            if (!positioning.state().positioned || !context.open()) return
            const target = context.initial()
            target?.focus({ preventScroll: true })
            if (target && target.ownerDocument.activeElement === target)
              focusedRevision = state.revision
          })
        )
      }
    )
    let controller: ReturnType<typeof createFloatingLayer> | undefined
    let attached: HTMLElement | undefined
    createEffect(
      () => ({
        element: element(),
        options: {
          content: context.content(),
          parent: context.parent?.layer(),
          trigger: context.trigger(),
          branches: context.triggerElements(),
          open: context.open(),
          active: context.open() || context.life.status() === 'exiting',
          positioned: positioning.state().positioned,
          initialFocus: context.initial(),
          finalFocus: context.trigger(),
          restoreFocus: context.restore(),
          onDismiss(reason: string) {
            if (reason === 'escape') context.change(false)
            else context.closeAll(false)
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
        context.setLayer(controller?.layer)
        setShown(controller?.isShown() ?? false)
      }
    )
    onCleanup(() => {
      controller?.dispose()
      if (!isServer) context.setLayer(undefined)
    })
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
/**
 * Renders the menu surface inside a Menu.Positioner belonging to a menu context.
 *
 * @remarks
 * Registers a live content-ID getter until owner cleanup. The ref records the
 * content for focus, presence, and layer behavior before invoking the author ref.
 * Attributes combine core menu semantics, presence hooks, and resolved placement.
 * Generated aria-labelledby uses the trigger ID unless aria-label is truthy;
 * explicit author attributes may override generated associations and semantics.
 *
 * Keyboard handling ignores canceled events, composition, and events whose
 * nearest role=menu ancestor is another surface. Tab, including Shift+Tab, focuses
 * the root trigger, requests closure of the whole chain without restoration, and
 * flushes pending updates before native tab navigation. It does not prevent Tab's
 * default. Item navigation and activation are implemented by the item handlers.
 *
 * In submenus, ArrowLeft closes this menu and focuses its trigger; RTL uses
 * ArrowRight. This back key prevents default and stops propagation. Pointer entry
 * cancels pending hover closure for this menu and its ancestors; submenu pointer
 * leave starts the context's 200ms grace delay for crossing the trigger/content gap.
 * @throws If no menu context or enclosing Menu.Positioner is available.
 */
export function MenuContent<T extends ValidComponent = 'div'>(
  props: MenuContentProps<T>
): JSX.Element {
  const context = useMenu('Menu.Content')
  const positioning = useContext(PositionContext)
  if (!positioning) throw new Error('Menu.Content must be rendered inside <Menu.Positioner>')
  const own = props as {
    id?: string
    as?: ValidComponent
    children?: JSX.Element
    ref?: (el: HTMLElement) => void
    'aria-label'?: string
  }
  const id = createUniqueId()
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children')
  onCleanup(context.setContentId(() => own.id ?? id))
  /** Compose surface attributes and boundary-level keyboard/hover handlers for spread. */
  const part = () => ({
    ...context.engine().parts.content,
    attrs: {
      ...context.engine().parts.content.attrs,
      ...context.life.part().attrs,
      'aria-labelledby': context.association('aria-labelledby', () =>
        own['aria-label'] ? undefined : context.triggerId()
      ),
      'data-side': positioning.state().side,
      'data-align': positioning.state().align,
    },
    on: {
      keydown(event: KeyboardEvent) {
        if (
          event.defaultPrevented ||
          event.isComposing ||
          (event.target as HTMLElement).closest('[role="menu"]') !== context.content()
        )
          return
        if (event.key === 'Tab') {
          let root = context
          while (root.parent) root = root.parent
          root.trigger()?.focus({ preventScroll: true })
          context.closeAll(false)
          // Remove the menu's tab stop before the browser performs native Tab navigation.
          flush()
        } else if (
          context.parent &&
          event.key === (context.dir() === 'rtl' ? 'ArrowRight' : 'ArrowLeft')
        ) {
          event.preventDefault()
          event.stopPropagation()
          context.change(false)
          context.trigger()?.focus()
        }
      },
      pointerenter() {
        context.enter()
      },
      pointerleave() {
        if (context.parent) context.leave()
      },
    },
  })
  const children = createMemo(() => own.children)
  return (
    <Dynamic
      component={own.as ?? 'div'}
      {...spread(part(), { ...rest, id: own.id ?? id })}
      ref={(el: HTMLElement) => {
        context.setContent(el)
        own.ref?.(el)
      }}
    >
      {children()}
    </Dynamic>
  )
}

/** Transition surface props; the enclosing menu provides lifecycle and trigger snapshots. */
export type MenuViewportProps = Omit<FloatingViewportProps, 'source'>
/**
 * Place inside Content to retain an inert DOM snapshot during trigger or payload
 * changes. Clones never register menu items or create Solid owners. See
 * {@link FloatingViewport} for CSS dimension variables and the sizing recipe.
 */
export function MenuViewport(props: MenuViewportProps): JSX.Element {
  const source = useMenu('Menu.Viewport')
  return <FloatingViewport {...props} source={source} />
}

/** Decorative arrow props. Its dimensions participate in positioner geometry. */
export type MenuArrowProps = Omit<ComponentProps<'div'>, 'ref'> & {
  /** Receives the decorative arrow host. */
  ref?: (element: HTMLDivElement) => void
}
/** Registers a decorative arrow with the surrounding Menu.Positioner. */
export function MenuArrow(props: MenuArrowProps): JSX.Element {
  const positioner = useContext(PositionContext)
  if (!positioner) throw new Error('Menu.Arrow must be rendered inside Menu.Positioner')
  const rest = omit(props as Record<string, unknown>, 'children', 'ref')
  const children = createMemo(() => props.children)
  onCleanup(() => {
    if (!isServer) positioner.setArrow(undefined)
  })
  return (
    <div
      {...positioner.arrowProps()}
      {...rest}
      ref={(element) => {
        positioner.setArrow(element)
        props.ref?.(element)
      }}
    >
      {children()}
    </div>
  )
}
