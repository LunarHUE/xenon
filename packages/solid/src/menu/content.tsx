import { createFloatingLayer } from '@tenon/dom/floating-layer'
import { Dynamic } from '@solidjs/web'
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
  useContext,
} from 'solid-js'
import { createPositioner } from '../positioning'
import type { Positioner, PositionerOptions } from '../positioning'
import { spread } from '../spread'
import { useMenu } from './context'

export type MenuPositionerProps = Omit<ComponentProps<'div'>, keyof PositionerOptions | 'ref'> &
  Omit<PositionerOptions, 'strategy'> & { ref?: (el: HTMLDivElement) => void }
export type MenuContentProps<T extends ValidComponent = 'div'> = ComponentProps<T> & {
  as?: T
  ref?: (el: HTMLElement) => void
}
const PositionContext = createContext<Positioner>()
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
    'dir',
    'autoUpdate',
    'onPositioned',
    'onError'
  )
  function Mounted(): JSX.Element {
    const [element, setElement] = createSignal<HTMLDivElement>()
    const [shown, setShown] = createSignal(false)
    const positioning = createPositioner({
      anchor: context.trigger,
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
        side:
          props.side ?? (context.parent ? (context.dir() === 'rtl' ? 'left' : 'right') : 'bottom'),
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
        setShown(controller?.isShown() ?? false)
      }
    )
    onCleanup(() => controller?.dispose())
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
      <PositionContext value={positioning}>{props.children}</PositionContext>
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
