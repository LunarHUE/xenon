import type { JSX } from '@solidjs/web'
import { X } from 'lucide'
import {
  CodeBlock,
  CodeBlockAction,
  CodeBlockContent,
  CodeBlockCopy,
  CodeBlockHeader,
  CodeBlockTitle,
  CodeBlockTrigger,
} from '.'
import { Icon } from '../ui/icon'

export interface DocsCodeProps {
  code: string
  html: string
  lang: string
  /** Filename or label in the header. Falls back to the language. */
  title?: string
  /** Muted note after the title, like "18 lines · Tailwind". The title turns full strength beside it. */
  meta?: string
  /**
   * Id of the region this block sits in. Adds a close action for it; the
   * Example script handles the click, since it owns the disclosure.
   */
  closes?: string
  collapsible?: boolean
  defaultOpen?: boolean
}

/**
 * The standard docs block, assembled from props alone. Astro can't pass Solid
 * children through the local renderer, so `Code.astro` renders this instead of
 * composing the CodeBlock parts itself.
 */
export function DocsCode(props: DocsCodeProps): JSX.Element {
  return (
    <CodeBlock
      code={props.code}
      html={props.html}
      lang={props.lang}
      collapsible={props.collapsible}
      defaultOpen={props.defaultOpen}
    >
      <CodeBlockHeader>
        {props.meta ? (
          <>
            <CodeBlockTitle class="me-0 shrink-0 text-foreground">
              {props.title ?? props.lang}
            </CodeBlockTitle>
            <span class="me-auto truncate leading-[18px] text-muted-foreground">{props.meta}</span>
          </>
        ) : (
          <CodeBlockTitle>{props.title ?? props.lang}</CodeBlockTitle>
        )}
        <CodeBlockCopy />
        {props.closes && (
          <CodeBlockAction aria-label="Hide code" aria-controls={props.closes} data-example-close>
            <Icon icon={X} class="size-4" />
          </CodeBlockAction>
        )}
      </CodeBlockHeader>
      <CodeBlockContent />
      {props.collapsible && <CodeBlockTrigger />}
    </CodeBlock>
  )
}
