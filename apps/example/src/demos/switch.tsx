import { Switch } from '@tenon/solid/switch'
import type { JSX } from '@solidjs/web'
import { createSignal } from 'solid-js'

import { Bench, Keys, Readout, Section } from '../ui'

export function SwitchDemo(): JSX.Element {
  const [wifi, setWifi] = createSignal(true)
  const [roaming, setRoaming] = createSignal(false)

  return (
    <Section
      index="03"
      title="Switch"
      blurb="A checkbox that reads as on or off. Same core, role='switch', and Enter deliberately
        left alone so it can still submit the form."
    >
      <Bench caption="On, off" note="checked">
        <div class="stack">
          <label class="field field--wide">
            <span>Wi-Fi</span>
            <Switch class="track" checked={wifi()} onCheckedChange={(next) => setWifi(next)} />
          </label>
          <label class="field field--wide">
            <span class={{ field__muted: !wifi() }}>Data roaming</span>
            <Switch
              class="track"
              checked={roaming()}
              disabled={!wifi()}
              onCheckedChange={(next) => setRoaming(next)}
            />
          </label>
          <label class="field field--wide">
            <span>Airplane mode, read only</span>
            <Switch class="track" readonly />
          </label>
        </div>
        <p class="prose">
          <Keys>Space</Keys> toggles on every host. <Keys>Enter</Keys> never does: on a native input
          it belongs to the form, and one key doing two jobs is how accidental submissions happen.
        </p>
        <Readout
          rows={[
            ['wifi', String(wifi())],
            ['roaming', String(roaming())],
          ]}
        />
      </Bench>

      <Bench caption="Button host" note="as">
        <div class="stack">
          <div class="field field--wide">
            <span>Rendered as a button, with a thumb of your own</span>
            <Switch class="track track--parts" as="button">
              <span class="thumb" />
            </Switch>
          </div>
        </div>
        <p class="prose">
          There are no indicator or thumb parts to import. The track is the element you styled, the
          thumb is whatever you put inside it, and both read <code>data-state</code> off the host.
        </p>
      </Bench>
    </Section>
  )
}
