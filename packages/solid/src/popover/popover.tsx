import type { AnyPart, PopoverResult } from '@tenon/core'
import { popover } from '@tenon/core/popover'
import { createPositioner } from '../positioning/positioning'
import type { Positioner, PositionerOptions } from '../positioning/positioning'
import { createFloatingLayer } from '@tenon/dom/floating-layer'
import type { FloatingLayerOptions } from '@tenon/dom/floating-layer'
import type { LayerPointerOutsideEvent } from '@tenon/dom'
import { Dynamic, isServer } from '@solidjs/web'
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
import { Button } from '../button/button'
import type { ButtonProps } from '../button/button'
import { serverAssociations } from '../field/server-associations'
import { createPresence } from '../internal/presence'
import { spread } from '../spread'

interface Own {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  forceMount?: boolean
  closeOnEscape?: boolean
  closeOnOutside?: boolean
  closeOnFocusOutside?: boolean
  onFocusOutside?: FloatingLayerOptions['onFocusOutside']
  initialFocus?: HTMLElement | false
  finalFocus?: HTMLElement
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerOutside?: (event: LayerPointerOutsideEvent) => void
  contentId?: string
  titleId?: string
  descriptionId?: string
  ref?: (el: HTMLElement) => void
}
export type PopoverProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & { as?: T }
export type PopoverContentProps<T extends ValidComponent = 'div'> = ComponentProps<T> & {
  as?: T
  ref?: (el: HTMLElement) => void
}
export type PopoverTriggerProps<T extends ValidComponent = 'button'> = ButtonProps<T>
export type PopoverCloseProps<T extends ValidComponent = 'button'> = ButtonProps<T>
export type PopoverTitleProps<T extends ValidComponent = 'h2'> = ComponentProps<T> & {
  as?: T
  ref?: (el: HTMLElement) => void
}
export type PopoverDescriptionProps<T extends ValidComponent = 'p'> = ComponentProps<T> & {
  as?: T
  ref?: (el: HTMLElement) => void
}
interface Context {
  own: Own
  result(): PopoverResult
  change(open: boolean): void
  content(): HTMLElement | undefined
  setContent(el: HTMLElement): void
  register(name: 'title' | 'description' | 'content', id: () => string): () => void
  id(name: 'title' | 'description' | 'content'): string
  association(
    name: 'aria-labelledby' | 'aria-describedby' | 'aria-controls',
    read: () => string | undefined
  ): string | undefined
  trigger(): HTMLElement | undefined
  setTrigger(el: HTMLElement | undefined): void
  registerTrigger(entry: { element?: HTMLElement }): () => void
  activeTrigger(entry: { element?: HTMLElement }): boolean
  anchor(): HTMLElement | undefined
  setAnchor(el: HTMLElement | undefined): void
}
const PopoverContext = createContext<Context>()
export function usePopover(name: string): Context {
  const context = useContext(PopoverContext)
  if (!context) throw new Error(`${name} must be rendered inside a <Popover>`)
  return context
}
function PopoverRoot<T extends ValidComponent = 'div'>(props: PopoverProps<T>): JSX.Element {
  const own = props as Own & { as?: ValidComponent }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'ref',
    'children',
    'open',
    'defaultOpen',
    'onOpenChange',
    'modal',
    'forceMount',
    'closeOnEscape',
    'closeOnOutside',
    'closeOnFocusOutside',
    'onFocusOutside',
    'initialFocus',
    'finalFocus',
    'onEscapeKeyDown',
    'onPointerOutside',
    'contentId',
    'titleId',
    'descriptionId'
  )
  const base = createUniqueId()
  const [internal, setInternal] = createSignal(untrack(() => own.defaultOpen ?? false))
  const [content, setContent] = createSignal<HTMLElement>()
  const [trigger, setTrigger] = createSignal<HTMLElement | undefined>(undefined, {
    ownedWrite: true,
  })
  let triggers: { element?: HTMLElement }[] = []
  const [anchor, setAnchor] = createSignal<HTMLElement | undefined>(undefined, { ownedWrite: true })
  const [revision, setRevision] = createSignal(0, { ownedWrite: true })
  let version = 0
  const entries: Record<'title' | 'description' | 'content', (() => string)[]> = {
    title: [],
    description: [],
    content: [],
  }
  const id = (name: 'title' | 'description' | 'content') => own[`${name}Id`] ?? `${base}-${name}`
  const registered = (name: 'title' | 'description' | 'content') => {
    revision()
    return entries[name].map((read) => read()).join(' ') || undefined
  }
  const open = () => own.open ?? internal()
  const change = (next: boolean) => {
    if (untrack(open) === next) return
    if (own.open === undefined) setInternal(next)
    own.onOpenChange?.(next)
  }
  const life = createPresence({ open, forceMount: () => own.forceMount ?? false })
  const compute = () => {
    return popover({
      ids: {
        content: registered('content') ?? id('content'),
        title: registered('title') ?? own.titleId,
        description: registered('description') ?? own.descriptionId,
      },
      open: open(),
      modal: own.modal,
      status: life.status(),
      forceMount: own.forceMount,
      onOpenChange: change,
    })
  }
  const memo = createMemo(compute)
  const result = isServer ? compute : memo
  const associations = isServer ? serverAssociations() : undefined
  const context: Context = {
    own,
    result,
    change,
    content,
    trigger,
    setTrigger,
    registerTrigger(entry) {
      triggers.push(entry)
      return () => {
        triggers = triggers.filter((item) => item !== entry)
        if (!isServer && untrack(trigger) === entry.element) setTrigger(triggers[0]?.element)
      }
    },
    activeTrigger(entry) {
      return trigger() ? trigger() === entry.element : triggers[0] === entry
    },
    anchor,
    setAnchor,
    setContent: (el) => {
      life.ref(el)
      setContent(el)
    },
    id,
    register(name, read) {
      entries[name].push(read)
      if (!isServer) setRevision(++version)
      return () => {
        entries[name] = entries[name].filter((entry) => entry !== read)
        if (!isServer) setRevision(++version)
      }
    },
    association: (name, read) => (associations ? associations.attribute(name, read) : read()),
  }
  const inner = createMemo(() => (
    <PopoverContext value={context}>
      {(props as { children?: JSX.Element }).children}
    </PopoverContext>
  ))
  const element = (
    <Dynamic
      component={own.as ?? 'div'}
      ref={own.ref}
      {...spread(result().parts.root, { ...rest })}
    >
      {inner()}
    </Dynamic>
  )
  // eslint-disable-next-line solid/components-return-once -- Server associations finalize one synchronous render.
  return associations ? associations.finish(element) : element
}
// Button's interaction gate consumes the canonical onClick prop.
function buttonProps(part: AnyPart, props: Record<string, unknown>) {
  const merged = spread(part, props)
  for (const key of Object.keys(merged)) {
    if (key.toLowerCase() !== 'onclick' || key === 'onClick') continue
    merged.onClick = merged[key]
    delete merged[key]
  }
  return merged
}

export function PopoverTrigger<T extends ValidComponent = 'button'>(
  props: ButtonProps<T>
): JSX.Element {
  const context = usePopover('Popover.Trigger')
  let element: HTMLElement | undefined
  const entry: { element?: HTMLElement } = {}
  onCleanup(context.registerTrigger(entry))
  onSettled(() => {
    if (element && !untrack(context.trigger)) context.setTrigger(element)
  })
  const rest = omit(props as Record<string, unknown>, 'ref', 'children')
  const part = () => {
    const original = context.result().parts.trigger
    const active = context.activeTrigger(entry)
    return {
      attrs: {
        ...original.attrs,
        'aria-expanded': context.result().state.open && active ? 'true' : 'false',
        'aria-controls':
          typeof (props as { as?: ValidComponent }).as === 'function'
            ? active
              ? original.attrs['aria-controls']
              : undefined
            : context.association('aria-controls', () =>
                context.activeTrigger(entry)
                  ? context.result().parts.trigger.attrs['aria-controls']
                  : undefined
              ),
      },
      on: {
        click: () => {
          const same = context.trigger() === element
          if (element) context.setTrigger(element)
          context.change(same ? !context.result().state.open : true)
        },
      },
    } as AnyPart
  }
  return (
    <Button
      ref={(el: HTMLElement) => {
        element = el
        entry.element = el
        ;(props as { ref?: (el: HTMLElement) => void }).ref?.(el)
      }}
      {...buttonProps(part(), { ...rest })}
    >
      {(props as { children?: JSX.Element }).children}
    </Button>
  )
}
export function PopoverClose<T extends ValidComponent = 'button'>(
  props: ButtonProps<T>
): JSX.Element {
  const context = usePopover('Popover.Close')
  return (
    <Button
      {...buttonProps(context.result().parts.close, {
        ...props,
        'aria-label': (props as { 'aria-label'?: string })['aria-label'] ?? 'Close popover',
      })}
    />
  )
}
const PositionerContext = createContext<
  Positioner & { setArrow(el: HTMLElement | undefined): void }
>()
export type PopoverPositionerProps = Omit<ComponentProps<'div'>, keyof PositionerOptions | 'ref'> &
  Omit<PositionerOptions, 'strategy'> & { ref?: (el: HTMLDivElement) => void }
export function PopoverPositioner(props: PopoverPositionerProps): JSX.Element {
  const context = usePopover('Popover.Positioner')
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
    'matchAnchorSize',
    'arrowPadding',
    'autoUpdate',
    'onPositioned',
    'onError'
  )
  function Mounted(): JSX.Element {
    const [element, setElement] = createSignal<HTMLDivElement>()
    const [arrow, setArrow] = createSignal<HTMLElement | undefined>(undefined, { ownedWrite: true })
    const [shown, setShown] = createSignal(false)
    const active = () => context.result().state.open || context.result().state.status === 'exiting'
    const positioner = createPositioner({
      anchor: () => context.anchor() ?? context.trigger(),
      floating: element,
      arrow,
      enabled: () => active() && shown(),
      options: () => ({
        side: props.side,
        align: props.align,
        strategy: 'fixed',
        sideOffset: props.sideOffset,
        alignOffset: props.alignOffset,
        collisionBoundary: props.collisionBoundary,
        collisionPadding: props.collisionPadding,
        flip: props.flip,
        shift: props.shift,
        tether: props.tether,
        fallbackPlacements: props.fallbackPlacements,
        hideWhenDetached: props.hideWhenDetached,
        matchAnchorSize: props.matchAnchorSize,
        arrowPadding: props.arrowPadding,
        autoUpdate: props.autoUpdate,
        dir: props.dir,
        onPositioned: props.onPositioned,
        onError: props.onError,
      }),
    })
    let controller: ReturnType<typeof createFloatingLayer> | undefined
    let attached: HTMLElement | undefined
    createEffect(
      () => ({
        element: element(),
        content: context.content(),
        options: {
          open: context.result().state.open,
          active: active(),
          positioned: positioner.state().positioned,
          trigger: context.trigger(),
          modal: context.result().state.modal,
          initialFocus: context.own.initialFocus,
          finalFocus: context.own.finalFocus,
          closeOnEscape: context.own.closeOnEscape,
          closeOnOutside: context.own.closeOnOutside,
          closeOnFocusOutside: context.own.closeOnFocusOutside,
          onEscapeKeyDown: context.own.onEscapeKeyDown,
          onPointerOutside: context.own.onPointerOutside,
          onFocusOutside: context.own.onFocusOutside,
          onDismiss: () => context.change(false),
        },
      }),
      (value) => {
        if (!value.element || !value.content) return
        const options = { ...value.options, content: value.content }
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
      const visibility = positioner.positionerProps().style
      const author = props.style
      if (typeof author === 'string')
        return `margin:0;inset:auto;border:0;padding:0;background:transparent;color:inherit;width:max-content;overflow:visible;${author};visibility:${visibility.visibility};pointer-events:${visibility['pointer-events']}`
      return { ...baseline, ...author, ...visibility } as JSX.CSSProperties
    }
    const inner = createMemo(() => (
      <PositionerContext value={{ ...positioner, setArrow }}>{props.children}</PositionerContext>
    ))
    return (
      <div
        ref={(el) => {
          setElement(el)
          props.ref?.(el)
        }}
        {...rest}
        popover="manual"
        hidden={!active()}
        data-state={context.result().state.open ? 'open' : 'closed'}
        data-part="positioner"
        style={wrapperStyle()}
      >
        {inner()}
      </div>
    )
  }
  return (
    <Show when={context.result().state.present}>
      <Mounted />
    </Show>
  )
}
export function PopoverContent<T extends ValidComponent = 'div'>(
  props: PopoverContentProps<T>
): JSX.Element {
  const context = usePopover('Popover.Content')
  const positioner = useContext(PositionerContext)
  if (!positioner) throw new Error('Popover.Content must be rendered inside Popover.Positioner')
  const own = props as {
    as?: ValidComponent
    id?: string
    ref?: (el: HTMLElement) => void
    children?: JSX.Element
    'aria-label'?: string
  }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'id', 'children')
  onCleanup(context.register('content', () => own.id ?? context.id('content')))
  const children = createMemo(() => own.children)
  const attributes = () =>
    spread(context.result().parts.content, {
      'aria-labelledby': own['aria-label']
        ? undefined
        : context.association(
            'aria-labelledby',
            () => context.result().parts.content.attrs['aria-labelledby']
          ),
      'aria-describedby': context.association(
        'aria-describedby',
        () => context.result().parts.content.attrs['aria-describedby']
      ),
      'data-side': positioner.state().side,
      'data-align': positioner.state().align,
      'data-placement': positioner.state().placement,
      ...rest,
      id: own.id ?? context.id('content'),
    })
  return (
    <Dynamic
      component={own.as ?? 'div'}
      ref={(el: HTMLElement) => {
        context.setContent(el)
        own.ref?.(el)
      }}
      {...attributes()}
    >
      {children()}
    </Dynamic>
  )
}
export type PopoverAnchorProps<T extends ValidComponent = 'div'> = ComponentProps<T> & {
  as?: T
  ref?: (el: HTMLElement) => void
}
export function PopoverAnchor<T extends ValidComponent = 'div'>(
  props: PopoverAnchorProps<T>
): JSX.Element {
  const context = usePopover('Popover.Anchor')
  onCleanup(() => {
    if (!isServer) context.setAnchor(undefined)
  })
  const own = props as {
    as?: ValidComponent
    ref?: (el: HTMLElement) => void
    children?: JSX.Element
  }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children')
  return (
    <Dynamic
      component={own.as ?? 'div'}
      ref={(el: HTMLElement) => {
        context.setAnchor(el)
        own.ref?.(el)
      }}
      {...rest}
    >
      {own.children}
    </Dynamic>
  )
}
export type PopoverArrowProps<T extends ValidComponent = 'div'> = PopoverAnchorProps<T>
export function PopoverArrow<T extends ValidComponent = 'div'>(
  props: PopoverArrowProps<T>
): JSX.Element {
  const positioner = useContext(PositionerContext)
  if (!positioner) throw new Error('Popover.Arrow must be rendered inside Popover.Positioner')
  onCleanup(() => {
    if (!isServer) positioner.setArrow(undefined)
  })
  const own = props as {
    as?: ValidComponent
    ref?: (el: HTMLElement) => void
    children?: JSX.Element
  }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children')
  return (
    <Dynamic
      component={own.as ?? 'div'}
      ref={(el: HTMLElement) => {
        positioner.setArrow(el)
        own.ref?.(el)
      }}
      {...positioner.arrowProps()}
      {...rest}
    >
      {own.children}
    </Dynamic>
  )
}
export function PopoverTitle<T extends ValidComponent = 'h2'>(
  props: PopoverTitleProps<T>
): JSX.Element {
  const context = usePopover('Popover.Title')
  const own = props as { as?: ValidComponent; id?: string; ref?: (el: HTMLElement) => void }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children')
  onCleanup(context.register('title', () => own.id ?? context.id('title')))
  return (
    <Dynamic component={own.as ?? 'h2'} ref={own.ref} {...{ id: context.id('title'), ...rest }}>
      {(props as { children?: JSX.Element }).children}
    </Dynamic>
  )
}
export function PopoverDescription<T extends ValidComponent = 'p'>(
  props: PopoverDescriptionProps<T>
): JSX.Element {
  const context = usePopover('Popover.Description')
  const own = props as { as?: ValidComponent; id?: string; ref?: (el: HTMLElement) => void }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children')
  onCleanup(context.register('description', () => own.id ?? context.id('description')))
  return (
    <Dynamic
      component={own.as ?? 'p'}
      ref={own.ref}
      {...{ id: context.id('description'), ...rest }}
    >
      {(props as { children?: JSX.Element }).children}
    </Dynamic>
  )
}

export const Popover = Object.assign(PopoverRoot, {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Positioner: PopoverPositioner,
  Anchor: PopoverAnchor,
  Arrow: PopoverArrow,
  Title: PopoverTitle,
  Description: PopoverDescription,
  Close: PopoverClose,
})
