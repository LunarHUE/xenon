import type { AnyPart } from '@kit/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, omit, onSettled } from 'solid-js'

import { ToolbarContext, useToolbar } from './context'
import type { ToolbarContextValue, ToolbarEntry } from './context'
import { Button } from '../button'
import type { ButtonProps } from '../button'
import { Separator } from '../separator'
import type { SeparatorProps } from '../separator'
import { spread } from '../spread'

interface ButtonOwn {
  disabled?: boolean
  focusableWhenDisabled?: boolean
  ref?: (el: HTMLElement) => void
}

interface LinkOwn {
  ref?: (el: HTMLElement) => void
}

interface SeparatorOwn {
  orientation?: 'horizontal' | 'vertical'
  ref?: (el: HTMLElement) => void
}

interface GroupOwn {
  disabled?: boolean
  ref?: (el: HTMLElement) => void
}

export type ToolbarButtonProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  keyof ButtonOwn | 'as'
> &
  ButtonOwn & { as?: T }

export type ToolbarLinkProps = Omit<ComponentProps<'a'>, keyof LinkOwn | 'as'> & LinkOwn

export type ToolbarSeparatorProps<T extends ValidComponent = 'hr'> = Omit<
  ComponentProps<T>,
  keyof SeparatorOwn | 'as'
> &
  SeparatorOwn & { as?: T }

export type ToolbarGroupProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof GroupOwn | 'as'
> &
  GroupOwn & { as?: T }

export function ToolbarButton<T extends ValidComponent = 'button'>(
  props: ToolbarButtonProps<T>
): JSX.Element {
  const own = props as ButtonOwn
  const rest = omit(props as Record<string, unknown>, 'disabled', 'focusableWhenDisabled', 'ref')
  const context = useToolbar('Toolbar.Button')

  const disabled = () => context.disabled() || (own.disabled ?? false)
  const focusableWhenDisabled = () => own.focusableWhenDisabled ?? true
  const entry: ToolbarEntry = {
    el: null,
    disabled: () => disabled() && !focusableWhenDisabled(),
  }

  const ref = (node: HTMLElement) => {
    entry.el = node
    own.ref?.(node)
  }

  onSettled(() => context.register(entry))

  const merged = () => {
    const out = spread(context.part(entry), { ...rest })
    out['disabled'] = disabled()
    out['focusableWhenDisabled'] = focusableWhenDisabled()
    return out as unknown as ButtonProps
  }

  return <Button {...merged()} ref={ref} />
}

export function ToolbarLink(props: ToolbarLinkProps): JSX.Element {
  const own = props as LinkOwn
  const rest = omit(props as Record<string, unknown>, 'as', 'ref')
  const context = useToolbar('Toolbar.Link')
  const entry: ToolbarEntry = { el: null, disabled: () => false }

  const ref = (node: HTMLElement) => {
    entry.el = node
    own.ref?.(node)
  }

  onSettled(() => context.register(entry))

  const merged = () => {
    const out = spread(context.part(entry), { ...rest })
    out['as'] = 'a'
    return out as unknown as ButtonProps<'a'>
  }

  return <Button {...merged()} ref={ref} />
}

export function ToolbarSeparator<T extends ValidComponent = 'hr'>(
  props: ToolbarSeparatorProps<T>
): JSX.Element {
  const own = props as SeparatorOwn
  const rest = omit(props as Record<string, unknown>, 'orientation')
  const context = useToolbar('Toolbar.Separator')

  const orientation = () =>
    own.orientation ?? (context.orientation() === 'vertical' ? 'horizontal' : 'vertical')

  return <Separator {...(rest as SeparatorProps)} orientation={orientation()} />
}

export function ToolbarGroup<T extends ValidComponent = 'div'>(
  props: ToolbarGroupProps<T>
): JSX.Element {
  const own = props as GroupOwn & { as?: ValidComponent }
  const rest = omit(props as Record<string, unknown>, 'as', 'disabled', 'ref', 'children')
  const context = useToolbar('Toolbar.Group')

  const value: ToolbarContextValue = {
    ...context,
    disabled: () => context.disabled() || (own.disabled ?? false),
  }

  const content = createMemo(() => (
    <ToolbarContext value={value}>{(props as { children?: JSX.Element }).children}</ToolbarContext>
  ))

  const part = (): AnyPart => ({
    attrs: {
      role: 'group',
      'data-orientation': context.orientation(),
      'data-disabled': value.disabled() ? '' : undefined,
    },
    on: {},
  })

  const ref = (node: HTMLElement) => own.ref?.(node)

  return (
    <Dynamic
      component={(own.as ?? 'div') as ValidComponent}
      ref={ref}
      {...spread(part(), { ...rest })}
    >
      {content()}
    </Dynamic>
  )
}
