import { RadioGroup } from '@tenon/solid'
import type { JSX } from '@solidjs/web'
import { createSignal } from 'solid-js'

import { Bench, Keys, Readout, Section } from '../ui'

export function RadioGroupDemo(): JSX.Element {
  const [ship, setShip] = createSignal<string | number>('standard')
  const [seat, setSeat] = createSignal<string | number>('aisle')

  return (
    <Section
      index="08"
      title="Radio group"
      blurb="Native radios by default, because the browser already owns the arrow keys, the shared
        name and the reset. Off that host the engine has to do all three itself."
    >
      <Bench caption="Native inputs" note="as · name">
        <RadioGroup
          class="radios"
          name="shipping"
          value={ship()}
          onValueChange={(next) => setShip(next)}
          aria-label="Shipping"
        >
          <label class="field">
            <RadioGroup.Item class="radio" value="standard" />
            <span>Standard, four days</span>
          </label>
          <label class="field">
            <RadioGroup.Item class="radio" value="express" />
            <span>Express, one day</span>
          </label>
          <label class="field">
            <RadioGroup.Item class="radio" value="courier" disabled />
            <span class="field__muted">Courier, unavailable here</span>
          </label>
          <label class="field">
            <RadioGroup.Item class="radio" value="pickup" />
            <span>Pick up in store</span>
          </label>
        </RadioGroup>
        <p class="prose">
          Every item is a real <code>input[type=radio]</code> sharing one <code>name</code>, so{' '}
          <Keys>↑</Keys> <Keys>↓</Keys> are the browser's and the group never prevents their
          default. Courier carries the native <code>disabled</code> attribute, which is why arrowing
          past it lands on pick up without the library counting anything. Leave the name off and the
          group still mints one, because two radios that do not share a name are not a group.
        </p>
        <Readout
          rows={[
            ['value', String(ship())],
            ['name', 'shipping, on all four inputs'],
          ]}
        />
      </Bench>

      <Bench caption="Button host" note="as · arrow selection">
        <RadioGroup
          class="radios radios--row"
          orientation="horizontal"
          value={seat()}
          onValueChange={(next) => setSeat(next)}
          aria-label="Seat"
        >
          <RadioGroup.Item class="chip" as="button" value="window">
            window
          </RadioGroup.Item>
          <RadioGroup.Item class="chip" as="button" value="middle" disabled>
            middle
          </RadioGroup.Item>
          <RadioGroup.Item class="chip" as="button" value="aisle">
            aisle
          </RadioGroup.Item>
        </RadioGroup>
        <p class="prose">
          With no input to lean on, the engine claims the arrows and selection follows focus, as the
          APG asks. <Keys>Space</Keys> selects; <Keys>Enter</Keys> deliberately does nothing, so it
          stays free for the form around it. The disabled item is gone from the ring entirely, and
          each button gets a hidden input beside it only when the group is named.
        </p>
        <Readout rows={[['value', String(seat())]]} />
      </Bench>
    </Section>
  )
}
