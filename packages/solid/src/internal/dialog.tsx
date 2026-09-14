import type { AnyPart, DialogOptions, DialogResult, DrawerSide } from '@tenon/core'
import { createDialogController } from '@tenon/dom'
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
import { createPresence } from './presence'
import { spread } from '../spread'

interface Own {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  forceMount?: boolean
  closeOnEscape?: boolean
  closeOnOutside?: boolean
  initialFocus?: HTMLElement | false
  finalFocus?: HTMLElement
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerOutside?: (event: LayerPointerOutsideEvent) => void
  contentId?: string
  titleId?: string
  descriptionId?: string
  ref?: (el: HTMLElement) => void
}
export type DialogProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & { as?: T }
export type AlertDialogProps<T extends ValidComponent = 'div'> = Omit<
  DialogProps<T>,
  'modal' | 'closeOnOutside'
>
interface DrawerOwn {
  side?: DrawerSide
  /** Dismiss distance in pixels. Defaults to 25% of the drawer size, at least 40px. */
  dragThreshold?: number
}
export type DrawerProps<T extends ValidComponent = 'div'> = DialogProps<T> & DrawerOwn
export type DialogContentProps = Omit<ComponentProps<'dialog'>, 'ref' | 'open'> & {
  ref?: (el: HTMLDialogElement) => void
}
export type DialogTriggerProps<T extends ValidComponent = 'button'> = ButtonProps<T>
export type DialogCloseProps<T extends ValidComponent = 'button'> = ButtonProps<T>
export type DialogTitleProps<T extends ValidComponent = 'h2'> = ComponentProps<T> & {
  as?: T
  ref?: (el: HTMLElement) => void
}
export type DialogDescriptionProps<T extends ValidComponent = 'p'> = ComponentProps<T> & {
  as?: T
  ref?: (el: HTMLElement) => void
}
type Kind = 'dialog' | 'alert' | 'drawer'
interface Context {
  kind: Kind
  own: Own & DrawerOwn
  result(): DialogResult
  change(open: boolean): void
  content(): HTMLDialogElement | undefined
  setContent(el: HTMLDialogElement): void
  register(name: 'title' | 'description' | 'content', id: () => string): () => void
  id(name: 'title' | 'description' | 'content'): string
  association(
    name: 'aria-labelledby' | 'aria-describedby',
    read: () => string | undefined
  ): string | undefined
  cancel(): HTMLElement | undefined
  setCancel(el: HTMLElement): void
}
const DialogContext = createContext<Context>()
export function useDialog(name: string): Context {
  const context = useContext(DialogContext)
  if (!context)
    throw new Error(`${name} must be rendered inside a <Dialog>, <AlertDialog>, or <Drawer>`)
  return context
}
export function createDialogRoot<T extends ValidComponent>(
  props: DialogProps<T>,
  config: { kind: Kind; compute(options: DialogOptions & { side?: DrawerSide }): DialogResult }
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
