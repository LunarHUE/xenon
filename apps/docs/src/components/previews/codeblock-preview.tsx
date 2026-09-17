import { For } from 'solid-js'
import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockTitle,
  CodeBlockContent,
  CodeBlockFooter,
  CodeBlockAction,
  CodeBlockCopy,
} from '../codeblock'
import { CopyButton } from '../copybutton'
import { Icon } from '../icon'
import { ExternalLink } from 'lucide'

export interface Snippet {
  filename: string
  lang: string
  code: string
  html: string
}

function Specimens(props: { theme: 'light' | 'dark'; snippets: Snippet[] }) {
  return (
    <section
      data-theme={props.theme}
      class="border border-border bg-background p-6 text-foreground sm:p-8"
    >
      <h2 class="mb-8 text-sm capitalize text-muted-foreground">{props.theme}</h2>
      <div class="grid gap-8 lg:grid-cols-2">
        <For each={props.snippets}>
          {(snippet, index) => (
            <div class="min-w-0 space-y-3">
              <h3 class="text-sm text-muted-foreground">
                {index() === 0 ? 'Default snippet' : 'Long line / footer / extra action'}
              </h3>
              <CodeBlock code={snippet.code} html={snippet.html} lang={snippet.lang}>
                <CodeBlockHeader>
                  <CodeBlockTitle>{snippet.filename}</CodeBlockTitle>
                  {index() === 1 && (
                    <CodeBlockAction as="a" href="/dev/button/" aria-label="Open Button playground">
                      <Icon icon={ExternalLink} />
                    </CodeBlockAction>
                  )}
                  <CodeBlockCopy />
                </CodeBlockHeader>
                <CodeBlockContent />
                {index() === 1 && (
                  <CodeBlockFooter>
                    <span class="text-muted-foreground">Anatomy source for the Button page.</span>
                  </CodeBlockFooter>
                )}
              </CodeBlock>
            </div>
          )}
        </For>
        <div class="space-y-3">
          <h3 class="text-sm text-muted-foreground">Copy button on its own</h3>
          <div class="flex items-center gap-4">
            <CopyButton text="bun add @xenon/solid" />
            <code class="font-mono text-xs">bun add @xenon/solid</code>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function CodeBlockPreview(props: { snippets: Snippet[] }) {
  return (
    <div class="space-y-8">
      <Specimens theme="light" snippets={props.snippets} />
      <Specimens theme="dark" snippets={props.snippets} />
    </div>
  )
}
