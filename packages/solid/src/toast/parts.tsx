import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { Show, createMemo, omit, onCleanup } from 'solid-js'
import { Button } from '../button/button'
import type { ButtonProps } from '../button/button'
import { spread } from '../spread'
import { useToastContent } from './context'

/** Shared polymorphic text host props. */
type TextHost<T extends ValidComponent> = Omit<ComponentProps<T>, 'as'> & {
  /** Rendered host or a component forwarding attributes and ref. */
  as?: T
}
/** Title text attributes; omitted children use the current record's title. */
export type ToastTitleProps<T extends ValidComponent = 'div'> = TextHost<T>
/** Description text attributes; omitted children use the current record's description. */
export type ToastDescriptionProps<T extends ValidComponent = 'div'> = TextHost<T>
/** Registers the rendered title ID, with reactive record text as its default children. */
export function ToastTitle<T extends ValidComponent = 'div'>(
  props: ToastTitleProps<T>
): JSX.Element {
  const context = useToastContent('Title')
  const own = props as ToastTitleProps<'div'>
  const content = () => (own.children === undefined ? context.record().title : own.children)
  const id = () => (own.id === false ? undefined : (own.id ?? context.id('title')))
  onCleanup(
    context.register('title', () =>
      content() === undefined || content() === null || content() === false ? undefined : id()
    )
  )
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'id')
  return (
    <Dynamic component={own.as ?? 'div'} {...rest} id={id()}>
      {content()}
    </Dynamic>
  )
}
/** Registers the rendered description ID, with reactive record text as its default children. */
export function ToastDescription<T extends ValidComponent = 'div'>(
  props: ToastDescriptionProps<T>
): JSX.Element {
  const context = useToastContent('Description')
  const own = props as ToastDescriptionProps<'div'>
  const content = () => (own.children === undefined ? context.record().description : own.children)
  const id = () => (own.id === false ? undefined : (own.id ?? context.id('description')))
  onCleanup(
    context.register('description', () =>
      content() === undefined || content() === null || content() === false ? undefined : id()
    )
  )
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'id')
  return (
    <Dynamic component={own.as ?? 'div'} {...rest} id={id()}>
      {content()}
    </Dynamic>
  )
}
/** Action-button attributes with optional persistence after an accepted action. */
export type ToastActionProps<T extends ValidComponent = 'button'> = ButtonProps<T> & {
  /** Dismiss after the record action unless prevented, defaulting to true. False leaves the toast open. */
  closeOnAction?: boolean
}
/**
 * Runs the record action after an uncanceled author click and then dismisses by
 * default. Children override the action label. preventDefault in either handler
 * keeps the toast open. Native and polymorphic Button activation rules apply.
 */
export function ToastAction<T extends ValidComponent = 'button'>(
  props: ToastActionProps<T>
): JSX.Element {
  const context = useToastContent('Action')
  const own = props as ToastActionProps<'button'>
  const rest = omit(props as Record<string, unknown>, 'children', 'closeOnAction')
  const children = createMemo(() =>
    own.children === undefined ? context.record().action?.label : own.children
  )
  const attributes = () =>
    spread(
      {
        attrs: context.result().parts.action.attrs,
        on: {
          click(event: MouseEvent) {
            context.record().action?.onClick(event)
            if (!event.defaultPrevented && own.closeOnAction !== false) context.dismiss('action')
          },
        },
      },
      rest
    )
  return (
    <Show when={own.children !== undefined || context.record().action != null}>
      <Button {...attributes()}>{children()}</Button>
    </Show>
  )
}
/** Button attributes for explicit dismissal; the default label is Dismiss notification. */
export type ToastCloseProps<T extends ValidComponent = 'button'> = ButtonProps<T>
/** Dismisses only its enclosing record after an uncanceled, enabled Button click. */
export function ToastClose<T extends ValidComponent = 'button'>(
  props: ToastCloseProps<T>
): JSX.Element {
  const context = useToastContent('Close')
  const rest = omit(props as Record<string, unknown>, 'children')
  const children = createMemo(() => (props as ToastCloseProps<'button'>).children)
  return <Button {...spread(context.result().parts.close, rest)}>{children()}</Button>
}
