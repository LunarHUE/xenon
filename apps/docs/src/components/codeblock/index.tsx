import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { Collapsible } from '@xenon/solid/collapsible'
import { ChevronDown } from 'lucide'
import { createContext, createSignal, omit, untrack, useContext } from 'solid-js'
import { Button, type ButtonProps } from '../ui/button'
import { CopyButton, type CopyButtonProps } from '../copybutton'
import { Icon } from '../icon'
import { cn } from '../../lib/utils'

interface CodeBlockContextValue {
  code: () => string
  html: () => string
  lang: () => string | undefined
  /** Whether the block clips its source behind a trigger bar. */
  collapsible: () => boolean
  /** Expanded state; always true for a block that is not collapsible. */
  open: () => boolean
}

const CodeBlockContext = createContext<CodeBlockContextValue>()

function useCodeBlock(name: string): CodeBlockContextValue {
  const context = useContext(CodeBlockContext)
  if (!context) throw new Error(`${name} must be rendered inside CodeBlock`)
  return context
}

/** Five 24px lines plus the content's vertical padding. */
const DEFAULT_COLLAPSED_HEIGHT = '160px'

export interface CodeBlockProps extends Omit<ComponentProps<'figure'>, 'children'> {
  /** Plain source, used by the copy action. */
  code: string
  /** Highlighted markup from `highlight()`. */
  html: string
  lang?: string
  /**
   * Clip the source to `collapsedHeight` behind a `CodeBlockTrigger` bar.
   * The source stays in the DOM while collapsed so it remains searchable.
   */
  collapsible?: boolean
  /** Initial expanded state of a collapsible block. Default false. */
  defaultOpen?: boolean
  /** Visible height while collapsed. Default 160px, about five lines. */
  collapsedHeight?: string
  children?: JSX.Element
}

/** Bordered container. Provides the source and markup to its parts through context. */
export function CodeBlock(props: CodeBlockProps): JSX.Element {
  const rest = omit(
    props,
    'code',
    'html',
    'lang',
    'collapsible',
    'defaultOpen',
    'collapsedHeight',
    'class',
    'style',
    'children'
  )
  const [open, setOpen] = createSignal(untrack(() => props.defaultOpen ?? false))
  const collapsible = () => props.collapsible ?? false
  let root: HTMLElement | undefined

  /** Keep the block's top edge on screen when a tall expanded block collapses. */
  const change = (next: boolean) => {
    setOpen(next)
    if (next || !root) return
    const { top } = root.getBoundingClientRect()
    if (top < 0) root.scrollIntoView({ block: 'start', behavior: 'instant' })
  }

  const figureClass = () =>
    cn(
      'flex min-w-0 flex-col border border-foreground bg-background font-mono text-xs text-foreground',
      props.class
    )
  const figureStyle = () => ({
    '--code-block-collapsed-height': props.collapsedHeight ?? DEFAULT_COLLAPSED_HEIGHT,
    ...(typeof props.style === 'object' ? props.style : {}),
  })

  return (
    <CodeBlockContext
      value={{
        code: () => props.code,
        html: () => props.html,
        lang: () => props.lang,
        collapsible,
        open: () => !collapsible() || open(),
      }}
    >
      {collapsible() ? (
        <Collapsible
          as="figure"
          {...rest}
          ref={(el) => (root = el)}
          forceMount
          open={open()}
          onOpenChange={change}
          data-slot="code-block"
          class={figureClass()}
          style={figureStyle()}
        >
          {props.children}
        </Collapsible>
      ) : (
        <figure
          {...rest}
          ref={(el) => (root = el)}
          data-slot="code-block"
          class={figureClass()}
          style={figureStyle()}
        >
          {props.children}
        </figure>
      )}
    </CodeBlockContext>
  )
}

const barClass = 'flex min-h-10 items-center gap-2 bg-muted px-4 py-1'

/** Filename bar. Only a flex row; children decide the layout. */
export function CodeBlockHeader(props: ComponentProps<'div'>): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <div
      {...rest}
      data-slot="code-block-header"
      class={cn(barClass, 'border-b border-dashed border-muted-foreground', props.class)}
    />
  )
}

/** Muted label that pushes whatever follows it to the end of the bar. */
export function CodeBlockTitle(props: ComponentProps<'span'>): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <span
      {...rest}
      data-slot="code-block-title"
      class={cn('me-auto truncate leading-[18px] text-muted-foreground', props.class)}
    />
  )
}

const contentClass = cn(
  'min-w-0 [&>pre]:scroll-area [&>pre]:px-4 [&>pre]:py-5 [&>pre]:leading-6',
  '[&>pre]:focus-visible:outline-2 [&>pre]:focus-visible:-outline-offset-2 [&>pre]:focus-visible:outline-sidebar-primary'
)

/** Collapsed: clip to the collapsed height and fade the last 56px into the trigger bar. */
const collapsibleContentClass = cn(
  'overflow-hidden [interpolate-size:allow-keywords] transition-[max-height] duration-300 ease-out motion-reduce:transition-none',
  'data-[state=closed]:max-h-[var(--code-block-collapsed-height)] data-[state=open]:max-h-max',
  'data-[state=closed]:[mask-image:linear-gradient(to_bottom,black_calc(100%-56px),transparent)]'
)

/**
 * Scroll region for the highlighted markup. Shiki's `pre` is the scroll target.
 * Inside a collapsible block it is the Collapsible content, kept mounted while closed.
 */
export function CodeBlockContent(
  props: Omit<ComponentProps<'div'>, 'children' | 'ref'>
): JSX.Element {
  const rest = omit(props, 'class')
  const context = useCodeBlock('CodeBlockContent')
  return context.collapsible() ? (
    <Collapsible.Content
      {...rest}
      hidden={undefined}
      data-slot="code-block-content"
      data-lang={context.lang()}
      class={cn(contentClass, collapsibleContentClass, props.class)}
      innerHTML={context.html()}
    />
  ) : (
    <div
      {...rest}
      data-slot="code-block-content"
      data-lang={context.lang()}
      class={cn(contentClass, props.class)}
      innerHTML={context.html()}
    />
  )
}

export interface CodeBlockTriggerProps extends Omit<ComponentProps<'button'>, 'children' | 'ref'> {
  /** Label while collapsed. Default "Show code". */
  showLabel?: string
  /** Label while expanded. Default "Collapse code". */
  hideLabel?: string
}

/**
 * Show / collapse bar below the content. Sticks to the viewport bottom while an
 * expanded block is taller than the screen, so it stays reachable.
 */
export function CodeBlockTrigger(props: CodeBlockTriggerProps): JSX.Element {
  const rest = omit(props, 'showLabel', 'hideLabel', 'class')
  const context = useCodeBlock('CodeBlockTrigger')
  if (!untrack(context.collapsible)) {
    throw new Error('CodeBlockTrigger requires a CodeBlock with the collapsible prop')
  }
  return (
    <Collapsible.Trigger
      {...rest}
      data-slot="code-block-trigger"
      class={cn(
        barClass,
        'group/code-block-trigger sticky bottom-0 z-10 w-full cursor-pointer justify-center border-t border-dashed border-muted-foreground font-sans text-sm text-foreground',
        'hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sidebar-primary',
        'data-disabled:cursor-not-allowed data-disabled:text-muted-foreground',
        props.class
      )}
    >
      <span>{context.open() ? (props.hideLabel ?? 'Collapse code') : (props.showLabel ?? 'Show code')}</span>
      <Icon
        icon={ChevronDown}
        class="size-4 transition-transform duration-200 ease-out motion-reduce:transition-none group-data-[state=open]/code-block-trigger:rotate-180"
      />
    </Collapsible.Trigger>
  )
}

export const codeBlockActionClass = cn(
  'border-0 bg-transparent text-foreground hover:bg-accent',
  '[&:not([data-disabled]):not([data-pending]):hover:not(:active)]:shadow-none',
  'motion-safe:[&:not([data-disabled]):not([data-pending]):hover:not(:active)]:translate-0'
)

/** Icon button sized for the bar. Every header control goes through this. */
export function CodeBlockAction<T extends ValidComponent = 'button'>(
  props: ButtonProps<T>
): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <Button<T>
      variant="outline"
      size="icon-sm"
      {...(rest as ButtonProps<T>)}
      data-slot="code-block-action"
      class={cn(codeBlockActionClass, props.class)}
    />
  )
}

/** Copy action bound to the block's source. */
export function CodeBlockCopy(props: Omit<CopyButtonProps, 'text'> = {}): JSX.Element {
  const rest = omit(props, 'class')
  const context = useCodeBlock('CodeBlockCopy')
  return (
    <CopyButton
      {...rest}
      text={context.code()}
      data-slot="code-block-copy"
      class={cn(codeBlockActionClass, props.class)}
    />
  )
}
