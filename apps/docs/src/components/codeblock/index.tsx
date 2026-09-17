import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createContext, omit, useContext } from 'solid-js'
import { Button, type ButtonProps } from '../ui/button'
import { CopyButton, type CopyButtonProps } from '../copybutton'
import { cn } from '../../lib/utils'

interface CodeBlockContextValue {
  code: () => string
  html: () => string
  lang: () => string | undefined
}

const CodeBlockContext = createContext<CodeBlockContextValue>()

function useCodeBlock(name: string): CodeBlockContextValue {
  const context = useContext(CodeBlockContext)
  if (!context) throw new Error(`${name} must be rendered inside CodeBlock`)
  return context
}

export interface CodeBlockProps extends Omit<ComponentProps<'figure'>, 'children'> {
  /** Plain source, used by the copy action. */
  code: string
  /** Highlighted markup from `highlight()`. */
  html: string
  lang?: string
  children?: JSX.Element
}

/** Bordered container. Provides the source and markup to its parts through context. */
export function CodeBlock(props: CodeBlockProps): JSX.Element {
  const rest = omit(props, 'code', 'html', 'lang', 'class', 'children')
  return (
    <CodeBlockContext
      value={{ code: () => props.code, html: () => props.html, lang: () => props.lang }}
    >
      <figure
        {...rest}
        data-slot="code-block"
        class={cn(
          'flex min-w-0 flex-col border border-foreground bg-background font-mono text-xs text-foreground',
          props.class
        )}
      >
        {props.children}
      </figure>
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

/** Same bar treatment below the content. */
export function CodeBlockFooter(props: ComponentProps<'div'>): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <div
      {...rest}
      data-slot="code-block-footer"
      class={cn(barClass, 'border-t border-dashed border-muted-foreground', props.class)}
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

/** Scroll region for the highlighted markup. Shiki's `pre` is the scroll target. */
export function CodeBlockContent(props: Omit<ComponentProps<'div'>, 'children'>): JSX.Element {
  const rest = omit(props, 'class')
  const context = useCodeBlock('CodeBlockContent')
  return (
    <div
      {...rest}
      data-slot="code-block-content"
      data-lang={context.lang()}
      class={cn(
        'min-w-0 [&>pre]:scroll-area [&>pre]:px-4 [&>pre]:py-5 [&>pre]:leading-6',
        '[&>pre]:focus-visible:outline-2 [&>pre]:focus-visible:-outline-offset-2 [&>pre]:focus-visible:outline-sidebar-primary',
        props.class
      )}
      innerHTML={context.html()}
    />
  )
}

export const codeBlockActionClass = cn(
  'border-0 bg-transparent text-foreground hover:bg-accent',
  '[&:not([data-disabled]):not([data-pending]):hover:not(:active)]:shadow-none',
  'motion-safe:[&:not([data-disabled]):not([data-pending]):hover:not(:active)]:translate-0'
)

/** Icon button sized for the bar. Every header or footer control goes through this. */
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
