import { createSignal, For } from 'solid-js'
import {
  Combobox,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxContent,
  ComboboxInput,
  ComboboxViewport,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
} from '../ui/combobox'

const releases = [
  {
    label: 'Solid 0.4.x',
    framework: 'Solid',
    versions: ['0.4.5', '0.4.4', '0.4.3', '0.4.2', '0.4.1', '0.4.0'],
  },
  { label: 'Solid 0.3.x', framework: 'Solid', versions: ['0.3.2', '0.3.1', '0.3.0'] },
  { label: 'Solid 0.2.x', framework: 'Solid', versions: ['0.2.1', '0.2.0'] },
  { label: 'Solid 0.1.x', framework: 'Solid', versions: ['0.1.1', '0.1.0'] },
  { label: 'React', framework: 'React', versions: ['0.1.0'] },
  { label: 'Svelte', framework: 'Svelte', versions: ['0.1.0'] },
].map((group) => ({
  label: group.label,
  items: group.versions.map((version) => ({
    value: `${group.framework.toLowerCase()}@${version}`,
    label: `${group.framework} ${version}`,
    framework: group.framework,
    version,
  })),
}))
const frameworks = releases.flatMap((group) => group.items)
const components = ['Accordion', 'Button', 'Checkbox', 'Combobox', 'Dialog', 'Popover', 'Tabs'].map(
  (label) => ({ value: label.toLowerCase(), label })
)

export default function ComboboxPreview() {
  const [value, setValue] = createSignal<string | undefined>('solid@0.4.5')
  return (
    <div class="grid gap-8 sm:grid-cols-2">
      <div class="min-w-0 space-y-3">
        <h3 id={`combobox-framework`} class="text-sm">
          Framework
        </h3>
        <Combobox
          items={frameworks}
          value={value()}
          onValueChange={setValue}
          name={`combobox-framework`}
        >
          <ComboboxTrigger aria-labelledby={`combobox-framework`}>
            <ComboboxValue />
          </ComboboxTrigger>
          <ComboboxContent aria-label="Choose framework">
            <ComboboxInput
              aria-label="Search frameworks"
              placeholder="Search frameworks…"
              class="mb-[0.25em] border-0 border-b focus-visible:-outline-offset-2"
            />
            <ComboboxViewport aria-label="Frameworks">
              <For each={releases}>
                {(group) => (
                  <ComboboxGroup label={group.label}>
                    <For each={group.items}>
                      {(item) => (
                        <ComboboxItem value={item.value}>
                          <span class="flex items-center justify-between gap-[1em]">
                            {item.framework}
                            <span class="text-muted-foreground tabular-nums">{item.version}</span>
                          </span>
                        </ComboboxItem>
                      )}
                    </For>
                  </ComboboxGroup>
                )}
              </For>
            </ComboboxViewport>
            <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
        <p role="status" class="text-sm text-muted-foreground">
          Selected: {value() ?? 'none'}
        </p>
      </div>
      <div class="min-w-0 space-y-3">
        <h3 id={`combobox-component`} class="text-sm">
          Component / compact
        </h3>
        <Combobox items={components}>
          <ComboboxTrigger size="sm" aria-labelledby={`combobox-component`}>
            <ComboboxValue placeholder="Choose a component" />
          </ComboboxTrigger>
          <ComboboxContent aria-label="Choose component">
            {(items) => (
              <>
                <ComboboxInput
                  aria-label="Search components"
                  placeholder="Search components…"
                  class="mb-[0.25em] border-0 border-b focus-visible:-outline-offset-2"
                />
                <ComboboxViewport aria-label="Components">
                  <For each={items}>
                    {(item) => <ComboboxItem value={item.value}>{item.label}</ComboboxItem>}
                  </For>
                </ComboboxViewport>
                <ComboboxEmpty>No components found.</ComboboxEmpty>
              </>
            )}
          </ComboboxContent>
        </Combobox>
      </div>
      <div class="min-w-0 space-y-3 mb-50">
        <h3 id={`combobox-disabled`} class="text-sm">
          Disabled
        </h3>
        <Combobox items={frameworks} defaultValue="solid@0.4.5" disabled>
          <ComboboxTrigger aria-labelledby={`combobox-disabled`}>
            <ComboboxValue />
          </ComboboxTrigger>
        </Combobox>
      </div>
    </div>
  )
}
