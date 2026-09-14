import { ToggleGroup } from '@tenon/solid'
import type { JSX } from '@solidjs/web'
import { createSignal } from 'solid-js'

import { Bench, Keys, Readout, Section } from '../ui'

export function ToggleGroupDemo(): JSX.Element {
  const [align, setAlign] = createSignal<string | undefined>('left')
  const [marks, setMarks] = createSignal<readonly string[]>(['bold'])

  return (
    <Section
      index="07"
      title="Toggle group"
      blurb="Toggles that answer to one value. The group is the composite engine over a selection
        model, so the items are the same toggle buttons and only the bookkeeping is new."
    >
      <Bench caption="Single" note="mode · value">
        <ToggleGroup
          class="toggle-group"
          value={align()}
          onValueChange={(next) => setAlign(next)}
          aria-label="Alignment"
        >
          <ToggleGroup.Item class="toggle" value="left">
            left
          </ToggleGroup.Item>
          <ToggleGroup.Item class="toggle" value="center">
            center
          </ToggleGroup.Item>
          <ToggleGroup.Item class="toggle" value="right">
            right
          </ToggleGroup.Item>
        </ToggleGroup>
        <p class="prose">
          Single mode is not a radio group: pressing the item that is already down deselects it and
          the payload comes back <code>undefined</code>, never an empty string. The group is a bare{' '}
          <code>role="group"</code> with no <code>aria-orientation</code>, because horizontal is
          already what a group is assumed to be.
        </p>
        <Readout rows={[['value', align() ?? 'undefined']]} />
      </Bench>

      <Bench caption="Multiple" note="mode='multiple'">
        <ToggleGroup
          class="toggle-group"
          mode="multiple"
          value={marks()}
          onValueChange={(next) => setMarks(next)}
          aria-label="Marks"
        >
          <ToggleGroup.Item class="toggle" value="bold">
            bold
          </ToggleGroup.Item>
          <ToggleGroup.Item class="toggle" value="italic">
            italic
          </ToggleGroup.Item>
          <ToggleGroup.Item class="toggle" value="underline">
            underline
          </ToggleGroup.Item>
          <ToggleGroup.Item class="toggle" value="strike" disabled>
            strike
          </ToggleGroup.Item>
        </ToggleGroup>
        <p class="prose">
          Multiple mode always reports an array, down to the empty one. The strike item is disabled
          and still sits in the arrow ring: group items default to{' '}
          <code>focusableWhenDisabled</code>, so it answers <code>aria-disabled</code>, keeps its
          place and swallows the press.
        </p>
        <Readout rows={[['value', marks().length === 0 ? '[]' : marks().join(', ')]]} />
      </Bench>

      <Bench caption="Vertical" note="orientation · roving tabindex">
        <ToggleGroup class="toggle-group" orientation="vertical" aria-label="Layout">
          <ToggleGroup.Item class="toggle" value="rows">
            rows
          </ToggleGroup.Item>
          <ToggleGroup.Item class="toggle" value="columns">
            columns
          </ToggleGroup.Item>
          <ToggleGroup.Item class="toggle" value="grid">
            grid
          </ToggleGroup.Item>
        </ToggleGroup>
        <p class="prose">
          Whichever way it points, the whole group is one tab stop. <Keys>Tab</Keys> enters and
          leaves; <Keys>↑</Keys> <Keys>↓</Keys> here, <Keys>←</Keys> <Keys>→</Keys> above, and{' '}
          <Keys>Home</Keys> and <Keys>End</Keys> in both. Moving the ring never changes the value:{' '}
          <Keys>Space</Keys> does that, and only for the item you landed on.
        </p>
      </Bench>
    </Section>
  )
}
