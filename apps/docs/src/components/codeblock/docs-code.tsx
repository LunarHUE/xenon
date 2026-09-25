import type { JSX } from '@solidjs/web'
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockCopy,
  CodeBlockHeader,
  CodeBlockTitle,
  CodeBlockTrigger,
} from '.'

export interface DocsCodeProps {
  code: string
  html: string
  lang: string
  /** Filename or label in the header. Falls back to the language. */
  title?: string
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
        <CodeBlockTitle>{props.title ?? props.lang}</CodeBlockTitle>
        <CodeBlockCopy />
      </CodeBlockHeader>
      <CodeBlockContent />
      {props.collapsible && <CodeBlockTrigger />}
    </CodeBlock>
  )
}
