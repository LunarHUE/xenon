import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockTitle,
  CodeBlockContent,
  CodeBlockTrigger,
  CodeBlockAction,
  CodeBlockCopy,
} from '../codeblock'
import { CopyButton } from '../copybutton'
import { Icon } from '../ui/icon'
import { ExternalLink } from 'lucide'

export interface Snippet {
  filename: string
  lang: string
  code: string
  html: string
}

export interface CodeBlockSnippets {
  /** Short source shown in a plain block. */
  short: Snippet
  /** Medium source for the collapsed and expanded specimens. */
  medium: Snippet
  /** Source taller than the viewport, to exercise the sticky trigger bar. */
  long: Snippet
}

function Source(props: { snippet: Snippet; collapsible?: boolean; defaultOpen?: boolean }) {
  return (
    <CodeBlock
      code={props.snippet.code}
      html={props.snippet.html}
      lang={props.snippet.lang}
      collapsible={props.collapsible}
      defaultOpen={props.defaultOpen}
    >
      <CodeBlockHeader>
        <CodeBlockTitle>{props.snippet.filename}</CodeBlockTitle>
        <CodeBlockAction as="a" href="/dev/button/" aria-label="Open Button playground">
          <Icon icon={ExternalLink} />
        </CodeBlockAction>
        <CodeBlockCopy />
      </CodeBlockHeader>
      <CodeBlockContent />
      {props.collapsible && <CodeBlockTrigger />}
    </CodeBlock>
  )
}

export default function CodeBlockPreview(props: { snippets: CodeBlockSnippets }) {
  return (
    <div class="space-y-10">
      <div class="space-y-3">
        <h3 class="text-sm text-muted-foreground">Collapsible, collapsed by default</h3>
        <Source snippet={props.snippets.medium} collapsible />
      </div>

      <div class="grid gap-8 lg:grid-cols-2">
        <div class="min-w-0 space-y-3">
          <h3 class="text-sm text-muted-foreground">Collapsible, expanded by default</h3>
          <Source snippet={props.snippets.medium} collapsible defaultOpen />
        </div>
        <div class="min-w-0 space-y-3">
          <h3 class="text-sm text-muted-foreground">Plain block, no trigger</h3>
          <Source snippet={props.snippets.short} />
        </div>
      </div>

      <div class="space-y-3">
        <h3 class="text-sm text-muted-foreground">
          Long snippet: expand and scroll, the bar sticks to the viewport bottom
        </h3>
        <Source snippet={props.snippets.long} collapsible />
      </div>

      <div class="space-y-3">
        <h3 class="text-sm text-muted-foreground">Copy button on its own</h3>
        <div class="flex items-center gap-4">
          <CopyButton text="bun add @xenon-ui/solid" />
          <code class="font-mono text-xs">bun add @xenon-ui/solid</code>
        </div>
      </div>
    </div>
  )
}
