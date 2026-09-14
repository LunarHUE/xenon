import type { AnyPart, DialogOptions, DialogResult, DrawerSide } from '@tenon/core'
import { createDialogController } from '@tenon/dom'
import type { DrawerDragThreshold, LayerPointerOutsideEvent } from '@tenon/dom'
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
import { createPresence } from './presence'
import { spread } from '../spread'

/** Shared root options consumed by the dialog, alert dialog, and drawer adapters. */
interface Own {
  /** Controlled visibility while defined; undefined uses internal state. */
  open?: boolean
  /** Initial uncontrolled visibility, read once at setup. Defaults to false. */
  defaultOpen?: boolean
  /** Reports a different visibility request after updating uncontrolled state. Same-state requests and initialization are silent. */
  onOpenChange?: (open: boolean) => void
  /** Use modal native presentation and focus containment by default. Alert dialogs always remain modal. */
  modal?: boolean
  /** Retain closed content, hidden after exit, without an active native session. Defaults to false. */
  forceMount?: boolean
  /** Allow Escape and native cancel dismissal requests. Defaults to true; native cancel is always prevented. */
  closeOnEscape?: boolean
  /** Allow outside-pointer dismissal. Defaults to true for dialogs/drawers; alert dialogs always disable it. */
  closeOnOutside?: boolean
  /** Focus target for each new native session; false skips scope placement, not native browser focus. Alerts otherwise prefer Cancel. */
  initialFocus?: HTMLElement | false
  /** Preferred eligible focus target when the session ends; updates affect the current session. Otherwise restoration uses captured openers. */
  finalFocus?: HTMLElement
  /** Cancelable layer Escape callback; preventDefault vetoes dismissal. Not called for native cancel or when Escape dismissal is disabled. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  /** Deferred outside-pointer callback; wrapper preventDefault vetoes dismissal without canceling the native pointer event. */
  onPointerOutside?: (event: LayerPointerOutsideEvent) => void
  /** Fallback content ID, also used by trigger aria-controls. Registered content IDs take precedence in associations. */
  contentId?: string
  /** Fallback title association when no title is registered; also the default rendered Title ID. Omission generates an ID only for the part. */
  titleId?: string
  /** Fallback description association when none is registered; also the default Description ID. Omission generates an ID only for the part. */
  descriptionId?: string
  /** Receives the rendered root wrapper, not the native dialog. */
  ref?: (el: HTMLElement) => void
}
/** Shared dialog root options combined with the selected wrapper host props. */
export type DialogProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & {
    /** Root wrapper host, defaulting to div; content remains a native dialog. */
    as?: T
  }
/** Dialog root props with modal and outside-dismissal options removed for alert policy. */
export type AlertDialogProps<T extends ValidComponent = 'div'> = Omit<
  DialogProps<T>,
  'modal' | 'closeOnOutside'
>
/** Drawer placement and handle-drag options added to the shared root props. */
interface DrawerOwn {
  /** Physical edge used for state hooks and handle drag direction. Defaults to bottom. */
  side?: DrawerSide
  /** Percent of drag-axis size, pixels, or rem. Defaults to 25% of the drawer size, at least 40px. */
  dragThreshold?: DrawerDragThreshold
}
/** Shared dialog behavior plus drawer side and drag threshold options. */
export type DrawerProps<T extends ValidComponent = 'div'> = DialogProps<T> & DrawerOwn
/** Native dialog props; the adapter owns open and forwards the ref to the dialog element. */
export type DialogContentProps = Omit<ComponentProps<'dialog'>, 'ref' | 'open'> & {
  /** Receives the native content after internal presence and controller refs are recorded. */
  ref?: (el: HTMLDialogElement) => void
}
/** {@link ButtonProps} for an opening trigger, including native/generic activation and disabled/pending gates. */
export type DialogTriggerProps<T extends ValidComponent = 'button'> = ButtonProps<T>
/** {@link ButtonProps} for a closing action; an author handler can cancel dismissal. */
export type DialogCloseProps<T extends ValidComponent = 'button'> = ButtonProps<T>
/** Polymorphic title props; the rendered ID is registered for content naming. */
export type DialogTitleProps<T extends ValidComponent = 'h2'> = ComponentProps<T> & {
  /** Rendered text host, defaulting to h2. */
  as?: T
  /** Receives the rendered text element. */
  ref?: (el: HTMLElement) => void
}
/** Polymorphic description props; the rendered ID is registered for content description. */
export type DialogDescriptionProps<T extends ValidComponent = 'p'> = ComponentProps<T> & {
  /** Rendered text host, defaulting to p. */
  as?: T
  /** Receives the rendered text element. */
  ref?: (el: HTMLElement) => void
}
/** Family variant selecting alert focus/dismissal policy and drawer-specific consumers. */
type Kind = 'dialog' | 'alert' | 'drawer'
/** Root-owned reactive state, element refs, and cross-part ID registration. */
interface Context {
  /** Configured family variant, fixed when the root is created. */
  kind: Kind
  /** Live author options read by content and family-specific adapters. */
  own: Own & DrawerOwn
  /** Current core snapshot; server reads recompute to include registrations made during rendering. */
  result(): DialogResult
  /** Request different visibility, storing only uncontrolled state before notifying the author. */
  change(open: boolean): void
  /** Most recently attached native content; not cleared when it detaches. */
  content(): HTMLDialogElement | undefined
  /** Record native content for presence observation and dependent adapters. */
  setContent(el: HTMLDialogElement): void
  /** Append a live ID getter in registration order; return its removal callback for owner cleanup. */
  register(name: 'title' | 'description' | 'content', id: () => string): () => void
  /** Resolve an explicit root ID option or the generated fallback for this part. */
  id(name: 'title' | 'description' | 'content'): string
  /** Read a naming/description association now on the client, or defer its server attribute resolution. */
  association(
    name: 'aria-labelledby' | 'aria-describedby',
    read: () => string | undefined
  ): string | undefined
  /** Most recently attached alert Cancel target; undefined until registered and not cleared on detach. */
  cancel(): HTMLElement | undefined
  /** Record the alert Cancel element used as the default initial focus target. */
  setCancel(el: HTMLElement): void
}
/** Shared provider used by all three dialog families and their parts. */
const DialogContext = createContext<Context>()
/** Reads the nearest dialog-family context, throwing an error naming the consumer when absent. */
export function useDialog(name: string): Context {
  const context = useContext(DialogContext)
  if (!context)
    throw new Error(`${name} must be rendered inside a <Dialog>, <AlertDialog>, or <Drawer>`)
  return context
}
export function createDialogRoot<T extends ValidComponent>(
  props: DialogProps<T>,
  config: {
    /** Fixed family policy for content and specialized parts. */
    kind: Kind
    /** Core engine receiving resolved state and registered IDs; called again as reactive inputs change. */
    compute(
      options: DialogOptions & {
        /** Optional drawer edge passed through from root props. */
        side?: DrawerSide
      }
    ): DialogResult
  }
): JSX.Element {
  const { kind } = config
  const own = props as Own & DrawerOwn & { as?: ValidComponent }
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
    'initialFocus',
    'finalFocus',
    'onEscapeKeyDown',
    'onPointerOutside',
    'contentId',
    'titleId',
    'descriptionId',
    'side',
    'dragThreshold'
  )
  const base = createUniqueId()
  const [internal, setInternal] = createSignal(untrack(() => own.defaultOpen ?? false))
  const [content, setContent] = createSignal<HTMLDialogElement>()
  const [cancel, setCancel] = createSignal<HTMLElement>()
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
    return config.compute({
      ids: {
        content: registered('content') ?? id('content'),
        title: registered('title') ?? own.titleId,
        description: registered('description') ?? own.descriptionId,
      },
      open: open(),
      modal: own.modal,
      side: own.side,
      status: life.status(),
      forceMount: own.forceMount,
      onOpenChange: change,
    })
  }
  const memo = createMemo(compute)
  const result = isServer ? compute : memo
  const associations = isServer ? serverAssociations() : undefined
  const context: Context = {
    kind,
    own,
    result,
    change,
    content,
    cancel,
    setCancel,
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
    <DialogContext value={context}>{(props as { children?: JSX.Element }).children}</DialogContext>
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

export function DialogTrigger<T extends ValidComponent = 'button'>(
  props: ButtonProps<T>
): JSX.Element {
  const context = useDialog('Dialog.Trigger')
  return <Button {...buttonProps(context.result().parts.trigger, { ...props })} />
}
export function DialogClose<T extends ValidComponent = 'button'>(
  props: ButtonProps<T>
): JSX.Element {
  const context = useDialog('Dialog.Close')
  return <Button {...buttonProps(context.result().parts.close, { ...props })} />
}
export function DialogContent(props: DialogContentProps): JSX.Element {
  const context = useDialog('Dialog.Content')
  const rest = omit(props as Record<string, unknown>, 'ref', 'id', 'children')
  onCleanup(
    context.register(
      'content',
      // eslint-disable-next-line solid/reactivity -- The registry reads this getter from the root memo.
      () => (typeof props.id === 'string' ? props.id : undefined) ?? context.id('content')
    )
  )
  function Mounted(): JSX.Element {
    const [element, setElement] = createSignal<HTMLDialogElement>()
    const children = createMemo(() => props.children)
    const options = () => ({
      open: context.result().state.open,
      active: context.result().state.open || context.result().state.status === 'exiting',
      modal: context.result().state.modal,
      closeOnEscape: context.own.closeOnEscape,
      closeOnOutside: context.kind === 'alert' ? false : context.own.closeOnOutside,
      initialFocus:
        context.own.initialFocus ?? (context.kind === 'alert' ? context.cancel() : undefined),
      finalFocus: context.own.finalFocus,
      onOpenChange: context.change,
      onEscapeKeyDown: context.own.onEscapeKeyDown,
      onPointerOutside: context.own.onPointerOutside,
    })
    let controller: ReturnType<typeof createDialogController> | undefined
    let attached: HTMLDialogElement | undefined
    createEffect(
      () => ({ element: element(), options: options() }),
      (value) => {
        if (!value.element) return
        if (attached !== value.element) {
          controller?.dispose()
          attached = value.element
          controller = createDialogController(value.element, value.options)
        } else controller?.update(value.options)
      }
    )
    onCleanup(() => controller?.dispose())
    onSettled(() => {
      if (!import.meta.env.DEV) return
      const el = element()
      if (!el) return
      if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby'))
        console.warn(
          'Dialog.Content requires an accessible name. Render Dialog.Title or provide aria-label.'
        )
      if (context.kind === 'alert' && !el.getAttribute('aria-describedby'))
        console.warn(
          'AlertDialog.Content requires a description. Render AlertDialog.Description or provide aria-describedby.'
        )
    })
    const attributes = () =>
      spread(context.result().parts.content, {
        'aria-labelledby': props['aria-label']
          ? undefined
          : context.association(
              'aria-labelledby',
              () => context.result().parts.content.attrs['aria-labelledby']
            ),
        'aria-describedby': context.association(
          'aria-describedby',
          () => context.result().parts.content.attrs['aria-describedby']
        ),
        ...rest,
        id: (typeof props.id === 'string' ? props.id : undefined) ?? context.id('content'),
        ...(isServer ? { open: context.result().state.open || undefined } : {}),
      })
    return (
      <dialog
        ref={(el) => {
          context.setContent(el)
          setElement(el)
          props.ref?.(el)
        }}
        {...attributes()}
      >
        {children()}
      </dialog>
    )
  }
  return (
    <Show when={context.result().state.present}>
      <Mounted />
    </Show>
  )
}
export function DialogTitle<T extends ValidComponent = 'h2'>(
  props: DialogTitleProps<T>
): JSX.Element {
  const context = useDialog('Dialog.Title')
  const own = props as { as?: ValidComponent; id?: string; ref?: (el: HTMLElement) => void }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref')
  onCleanup(context.register('title', () => own.id ?? context.id('title')))
  return (
    <Dynamic component={own.as ?? 'h2'} ref={own.ref} {...{ id: context.id('title'), ...rest }} />
  )
}
export function DialogDescription<T extends ValidComponent = 'p'>(
  props: DialogDescriptionProps<T>
): JSX.Element {
  const context = useDialog('Dialog.Description')
  const own = props as { as?: ValidComponent; id?: string; ref?: (el: HTMLElement) => void }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref')
  onCleanup(context.register('description', () => own.id ?? context.id('description')))
  return (
    <Dynamic
      component={own.as ?? 'p'}
      ref={own.ref}
      {...{ id: context.id('description'), ...rest }}
    />
  )
}

export const dialogParts = {
  Trigger: DialogTrigger,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
}
