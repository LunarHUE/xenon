import { Checkbox } from '@tenon/solid'
import type { JSX } from '@solidjs/web'
import { For, createSignal } from 'solid-js'

import { Bench, Readout, Section } from '../ui'

const TASKS = ['Write the spec', 'Wire the core', 'Ship the adapter']

export function CheckboxDemo(): JSX.Element {
  const [subscribed, setSubscribed] = createSignal(true)
  const [done, setDone] = createSignal([true, false, false])

  const every = () => done().every(Boolean)
  const some = () => done().some(Boolean)

  return (
    <Section
      index="02"
      title="Checkbox"
      blurb="The control is the input. The browser keeps form participation, label association and
        reset; the library keeps state, mixed values and the non-native hosts honest."
    >
      <Bench caption="Controlled and not" note="checked · defaultChecked">
        <div class="stack">
          <label class="field">
            <Checkbox class="check" defaultChecked />
            <span>Uncontrolled, starts checked</span>
          </label>
          <label class="field">
            <Checkbox
              class="check"
              checked={subscribed()}
              onCheckedChange={(next) => setSubscribed(next)}
            />
            <span>Controlled by a signal</span>
          </label>
          <label class="field">
            <Checkbox class="check" disabled />
            <span class="field__muted">Disabled</span>
          </label>
          <label class="field">
            <Checkbox class="check" readonly defaultChecked />
            <span>Read only: focusable, keeps its value</span>
          </label>
          <label class="field">
            <Checkbox class="check" required invalid />
            <span>Required and invalid</span>
          </label>
        </div>
        <Readout rows={[['checked', String(subscribed())]]} />
      </Bench>

      <Bench caption="Mixed" note="indeterminate">
        <div class="stack">
          <label class="field">
            <Checkbox
              class="check"
              checked={every()}
              indeterminate={some() && !every()}
              onCheckedChange={(next) => setDone((list) => list.map(() => next))}
            />
            <span>All three</span>
          </label>
          <div class="stack stack--indent">
            <For each={TASKS}>
              {(task, index) => (
                <label class="field">
                  <Checkbox
                    class="check"
                    checked={done()[index()] ?? false}
                    onCheckedChange={(next) => setDone((list) => list.with(index(), next))}
                  />
                  <span>{task}</span>
                </label>
              )}
            </For>
          </div>
        </div>
        <p class="prose">
          Mixed is its own flag, not a third value of <code>checked</code>. It wins for{' '}
          <code>aria-checked="mixed"</code> and <code>data-state</code>, and clicking the parent
          proposes the opposite of <code>checked</code> without clearing it behind your back.
        </p>
        <Readout
          rows={[
            [
              'data-state',
              some() && !every() ? 'indeterminate' : every() ? 'checked' : 'unchecked',
            ],
            ['done', `${done().filter(Boolean).length} of ${TASKS.length}`],
          ]}
        />
      </Bench>

      <Bench caption="Button host" note="as">
        <div class="stack">
          <div class="field">
            <Checkbox class="check" as="button" name="beta" value="on" />
            <span>A button with role="checkbox"</span>
          </div>
        </div>
        <p class="prose">
          Off the native host there is nothing to submit, so naming one renders a hidden input
          beside it that carries the value into the form. Without a <code>name</code> that input
          never appears.
        </p>
      </Bench>
    </Section>
  )
}
