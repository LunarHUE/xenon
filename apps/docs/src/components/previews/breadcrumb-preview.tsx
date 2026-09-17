import { createSignal, For } from 'solid-js'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb'
import { Button } from '../ui/button'
import {
  Combobox,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxContent,
  ComboboxInput,
  ComboboxViewport,
  ComboboxItem,
  ComboboxEmpty,
} from '../ui/combobox'

const components = ['Accordion', 'Button', 'Checkbox', 'Combobox', 'Dialog', 'Popover', 'Tabs'].map(
  (label) => ({ value: label.toLowerCase(), label })
)

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function Specimens(props: { theme: 'light' | 'dark' }) {
  const [component, setComponent] = createSignal<string | undefined>('button')
  const current = () => components.find((item) => item.value === component())?.label ?? 'Button'

  return (
    <section
      data-theme={props.theme}
      class="border border-border bg-background p-6 text-foreground sm:p-8"
    >
      <h2 class="mb-8 text-sm capitalize text-muted-foreground">{props.theme}</h2>
      <div class="space-y-10">
        <div class="space-y-3">
          <h3 class="text-sm text-muted-foreground">Context strip</h3>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#docs">Docs</BreadcrumbLink>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href="#components">Components</BreadcrumbLink>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>{current()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm text-muted-foreground">Current entry as a link</h3>
          <Breadcrumb aria-label="Location">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#components">Components</BreadcrumbLink>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href="#button" current>
                  Button
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div class="space-y-3">
          <h3 id={`${props.theme}-compact`} class="text-sm text-muted-foreground">
            Compact / component selector
          </h3>
          <div class="flex items-center gap-[14px]">
            <Button variant="outline" size="icon-sm" class="border-0" aria-label="Open navigation">
              <MenuIcon />
            </Button>
            <Breadcrumb>
              <BreadcrumbList variant="compact">
                <BreadcrumbItem>
                  <BreadcrumbLink href="#components">Components</BreadcrumbLink>
                  <BreadcrumbSeparator />
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <Combobox items={components} value={component()} onValueChange={setComponent}>
                    <ComboboxTrigger size="sm" aria-labelledby={`${props.theme}-compact`}>
                      <ComboboxValue />
                    </ComboboxTrigger>
                    <ComboboxContent aria-label="Choose component" class="min-w-56">
                      {(items) => (
                        <>
                          <ComboboxInput
                            aria-label="Search components"
                            placeholder="Search components…"
                            class="mb-[0.25em] border-0 border-b focus-visible:-outline-offset-2"
                          />
                          <ComboboxViewport aria-label="Components">
                            <For each={items}>
                              {(item) => (
                                <ComboboxItem value={item.value}>{item.label}</ComboboxItem>
                              )}
                            </For>
                          </ComboboxViewport>
                          <ComboboxEmpty>No components found.</ComboboxEmpty>
                        </>
                      )}
                    </ComboboxContent>
                  </Combobox>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function BreadcrumbPreview() {
  return (
    <div class="space-y-8">
      <Specimens theme="light" />
      <Specimens theme="dark" />
    </div>
  )
}
