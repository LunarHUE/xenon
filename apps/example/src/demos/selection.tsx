import { CheckboxGroup } from '@xenon/solid/checkbox-group'
import { Listbox } from '@xenon/solid/listbox'
import type { ListboxValue } from '@xenon/solid/listbox'
import { Select } from '@xenon/solid/select'
import { Combobox } from '@xenon/solid/combobox'
import { Field } from '@xenon/solid/field'
import { For, createSignal } from 'solid-js'
import { Bench, Keys, Readout, Section } from '../ui'

const papers = [
  { value: 'cotton', label: 'Cotton rag' },
  { value: 'kraft', label: 'Kraft paper' },
  { value: 'newsprint', label: 'Newsprint' },
  { value: 'vellum', label: 'Vellum', disabled: true },
  { value: 'washi', label: 'Washi' },
]

/** Native checkboxes share an array selection and a group description. */
export function CheckboxGroupDemo() {
  const [value, setValue] = createSignal<string[]>(['letters'])
  return (
    <Section
      index="33"
      title="Checkbox group"
      blurb="Independent choices, one shared value. Pick the studio updates you want to receive."
    >
      <Bench caption="Studio correspondence" note="multiple choices · native checkboxes">
        <CheckboxGroup class="stack" name="updates" value={value()} onValueChange={setValue}>
          <CheckboxGroup.Label class="fieldset__label">Keep me posted</CheckboxGroup.Label>
          <CheckboxGroup.Description class="fieldset__hint">
            Choose any combination. Each checkbox has its own tab stop.
          </CheckboxGroup.Description>
          <label class="field">
            <CheckboxGroup.Item class="check" value="letters" /> Studio letters
          </label>
          <label class="field">
            <CheckboxGroup.Item class="check" value="workshops" /> Upcoming workshops
          </label>
          <label class="field">
            <CheckboxGroup.Item class="check" value="editions" /> New editions
          </label>
          <label class="field">
            <CheckboxGroup.Item class="check" value="residencies" disabled />{' '}
            <span class="field__muted">Residencies, coming later</span>
          </label>
        </CheckboxGroup>
        <Readout rows={[['selected', value().join(', ') || 'none']]} />
      </Bench>
    </Section>
  )
}

/** Inline multiple selection with arrow navigation and typeahead. */
export function ListboxDemo() {
  const [value, setValue] = createSignal<ListboxValue>(['ink'])
  const supplies = [
    { value: 'ink', label: 'Printing ink', detail: '01 / colour' },
    { value: 'roller', label: 'Rubber roller', detail: '02 / application' },
    { value: 'plate', label: 'Carving plate', detail: '03 / surface' },
    { value: 'press', label: 'Tabletop press', detail: '04 / reserved', disabled: true },
  ]
  return (
    <Section
      index="34"
      title="Listbox"
      blurb="A visible list of choices. Assemble a printmaking kit with the keyboard or pointer."
    >
      <Bench caption="Workshop supplies" note="multiple selection · typeahead">
        <Listbox
          class="selection-list"
          aria-label="Workshop supplies"
          selectionMode="multiple"
          value={value()}
          onValueChange={setValue}
        >
          <For each={supplies}>
            {(item) => (
              <Listbox.Item
                class="selection-option"
                value={item.value}
                textValue={item.label}
                disabled={item.disabled}
              >
                <span>
                  {item.label}
                  <small class="selection-option__detail">{item.detail}</small>
                </span>
                <span class="selection-option__check" aria-hidden="true">
                  ✓
                </span>
              </Listbox.Item>
            )}
          </For>
        </Listbox>
        <p class="prose">
          <Keys>↑</Keys> <Keys>↓</Keys> move through available supplies. <Keys>Space</Keys> changes
          the focused choice. Type a name to jump to it.
        </p>
        <Readout
          rows={[
            [
              'kit',
              Array.isArray(value())
                ? (value() as string[]).join(', ') || 'empty'
                : String(value() ?? 'empty'),
            ],
          ]}
        />
      </Bench>
    </Section>
  )
}

/** A portaled select uses explicit option metadata and consumer-owned presentation. */
export function SelectDemo() {
  const [value, setValue] = createSignal<string | undefined>('cotton')
  return (
    <Section
      index="35"
      title="Select"
      blurb="Choose one paper stock. The selected label stays visible when the list closes."
    >
      <Bench caption="Paper counter" note="single selection · closed typeahead">
        <Field class="fieldset" id="paper-select">
          <Field.Label class="fieldset__label">Paper stock</Field.Label>
          <Field.Description class="fieldset__hint">
            Vellum is currently out of stock.
          </Field.Description>
          <Select items={papers} name="paper" value={value()} onValueChange={setValue}>
            <Select.Trigger class="selection-trigger">
              <Select.Value placeholder="Choose paper" />
              <span aria-hidden="true">↓</span>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner sideOffset={6} collisionPadding={16} matchAnchorSize="width">
                <Select.Content class="selection-popup">
                  <Select.Viewport class="selection-viewport">
                    <For each={papers}>
                      {(item) => (
                        <Select.Item class="selection-option" value={item.value}>
                          <span>{item.label}</span>
                          <span class="selection-option__check" aria-hidden="true">
                            ✓
                          </span>
                        </Select.Item>
                      )}
                    </For>
                  </Select.Viewport>
                </Select.Content>
              </Select.Positioner>
            </Select.Portal>
          </Select>
        </Field>
        <p class="prose">
          Open the list and use the arrows, then <Keys>Enter</Keys> to choose. <Keys>Escape</Keys>{' '}
          closes it without changing the paper.
        </p>
        <Readout rows={[['paper', value() ?? 'none']]} />
      </Bench>
    </Section>
  )
}

/** Search text stays separate from the committed option value. */
export function ComboboxDemo() {
  const [value, setValue] = createSignal<string | undefined>()
  const [query, setQuery] = createSignal('')
  const hasMatches = () =>
    papers.some((item) => item.label.toLowerCase().includes(query().toLowerCase()))
  return (
    <Section
      index="36"
      title="Combobox"
      blurb="Search the same paper shelf. Typing filters suggestions; accepting a suggestion makes the choice."
    >
      <Bench caption="Find a paper" note="editable search · single selection">
        <Field class="fieldset" id="paper-search">
          <Field.Label class="fieldset__label">Find paper stock</Field.Label>
          <Field.Description class="fieldset__hint">Try “kraft” or “washi”.</Field.Description>
          <Combobox
            items={papers}
            name="paper-search"
            value={value()}
            onValueChange={setValue}
            inputValue={query()}
            onInputValueChange={setQuery}
          >
            <div class="selection-search">
              <Combobox.Input class="input" placeholder="Search paper…" />
              <Combobox.Trigger
                class="selection-search__toggle"
                aria-label="Show paper suggestions"
              >
                ↓
              </Combobox.Trigger>
            </div>
            <Combobox.Portal>
              <Combobox.Positioner sideOffset={6} collisionPadding={16} matchAnchorSize="width">
                <Combobox.Content class="selection-popup" aria-label="Paper suggestions">
                  <Combobox.Viewport class="selection-viewport">
                    <For each={papers}>
                      {(item) => (
                        <Combobox.Item class="selection-option" value={item.value}>
                          <span>{item.label}</span>
                          <span class="selection-option__check" aria-hidden="true">
                            ✓
                          </span>
                        </Combobox.Item>
                      )}
                    </For>
                  </Combobox.Viewport>
                </Combobox.Content>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox>
          <p class="fieldset__hint" role="status">
            {hasMatches()
              ? 'Choose a suggestion to confirm your paper.'
              : 'No matching paper. Try a different name.'}
          </p>
        </Field>
        <Readout
          rows={[
            ['search', query() || 'empty'],
            ['selected paper', value() ?? 'none'],
          ]}
        />
      </Bench>
    </Section>
  )
}
