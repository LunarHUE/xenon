import type { AnyPart } from '@xenon-ui/core'
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
import { toolbarHosts } from '../internal/toolbar-host'

/** Toolbar-owned button props layered over the shared Button adapter. */
interface ButtonOwn {
  /** Blocks activation when true or inherited from Toolbar/Group. Defaults to false. */
  disabled?: boolean
  /** Keep disabled buttons in the navigation order. Defaults to true; false excludes them. */
  focusableWhenDisabled?: boolean
  /** Receives the actual item host, used for navigation focus and ordering. */
  ref?: (el: HTMLElement) => void
}

/** Toolbar-owned link ref, replacing the native host ref prop. */
interface LinkOwn {
  /** Receives the anchor registered for navigation. */
  ref?: (el: HTMLElement) => void
}

/** Separator props whose defaults depend on the enclosing toolbar. */
interface SeparatorOwn {
  /** Explicit separator axis; omission chooses the axis perpendicular to the toolbar. */
  orientation?: 'horizontal' | 'vertical'
  /** Forwarded to the Separator host. */
  ref?: (el: HTMLElement) => void
}

/** Group-owned inherited policy and ref. */
interface GroupOwn {
  /** OR-combined with the enclosing disabled state for descendant buttons. Defaults to false. */
  disabled?: boolean
  /** Receives the rendered group host. */
  ref?: (el: HTMLElement) => void
}

/** Polymorphic host props plus toolbar button policy; see ToolbarButton for inherited behavior. */
export type ToolbarButtonProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  keyof ButtonOwn | 'as'
> &
  ButtonOwn & {
    /** Host forwarded to Button, defaulting to button; custom components must forward props/ref. */
    as?: T
  }

/** Anchor props for a toolbar link; no polymorphic as prop or inherited disabled option. */
export type ToolbarLinkProps = Omit<ComponentProps<'a'>, keyof LinkOwn | 'as'> & LinkOwn

/** Polymorphic separator props with a toolbar-relative default orientation. */
export type ToolbarSeparatorProps<T extends ValidComponent = 'hr'> = Omit<
  ComponentProps<T>,
  keyof SeparatorOwn | 'as'
> &
  SeparatorOwn & {
    /** Host forwarded to Separator, defaulting to hr. */
    as?: T
  }

/** Polymorphic grouping props; remaining attributes override generated group semantics. */
export type ToolbarGroupProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof GroupOwn | 'as'
> &
  GroupOwn & {
    /** Group host or forwarding component, defaulting to div. */
    as?: T
  }

/**
 * Registers a Button in the enclosing toolbar and inherits disabled state.
 * Disabled items remain navigation destinations unless focusableWhenDisabled is
 * false. Author handlers run before navigation and can cancel it; remaining
 * attributes can override the generated tab index. Registration and removal follow
 * the settled owner lifetime, and the forwarded ref supplies the focus target.
 * @throws If rendered outside Toolbar.
 */
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

  /** Composes navigation with author props, then supplies resolved disabled behavior to Button. */
  const merged = () => {
    const out = spread(context.part(entry), { ...rest })
    out['disabled'] = disabled()
    out['focusableWhenDisabled'] = focusableWhenDisabled()
    return out as unknown as ButtonProps
  }

  return <Button {...merged()} ref={ref} />
}

/**
 * Registers an anchor that remains navigable when Toolbar or Group is disabled.
 * Delegates host behavior to Button with as=a; a supplied href enables native link
 * semantics, while an absent href uses generic button behavior. Author events can
 * cancel navigation and attributes can override the generated tab index.
 * @throws If rendered outside Toolbar.
 */
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

/**
 * Renders Separator perpendicular to the toolbar unless orientation is supplied.
 * Does not register as a navigation item. Remaining props and ref pass to Separator.
 * @throws If rendered outside Toolbar.
 */
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

/**
 * Adds group role and styling hooks while sharing the enclosing navigation registry.
 * Descendant buttons inherit the OR-combined disabled state; links do not. The group
 * adds no tab stop, and author attributes override generated ones through spread.
 * @throws If rendered outside Toolbar.
 */
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

// Composed controls can preserve their semantics while delegating toolbar focus.
toolbarHosts.add(ToolbarButton)
