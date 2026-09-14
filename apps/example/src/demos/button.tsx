import { Button } from '@tenon/solid/button'
import type { JSX } from '@solidjs/web'
import { createSignal, onSettled } from 'solid-js'

import { Bench, Keys, Readout, Section } from '../ui'

export function ButtonDemo(): JSX.Element {
  const [reached, setReached] = createSignal(0)
  const [pending, setPending] = createSignal(false)

  let timer: ReturnType<typeof setTimeout> | undefined
  onSettled(() => () => clearTimeout(timer))

  const count = () => setReached((n) => n + 1)

  const save = () => {
    count()
    setPending(true)
    timer = setTimeout(() => setPending(false), 1600)
  }

  return (
    <Section
      index="01"
      title="Button"
      blurb="One component over four hosts. A native button stays a native button; anything else
        gets role, tab stop and synthesized activation."
    >
      <Bench caption="Hosts" note="as">
        <div class="row">
          <Button class="btn" onClick={count}>
            button
          </Button>
          <Button class="btn" as="a" href="#button" onClick={count}>
            a + href
          </Button>
          <Button class="btn" as="input" value="input" onClick={count} />
          <Button class="btn" as="div" onClick={count}>
            div
          </Button>
        </div>
        <p class="prose">
          The link host keeps its native behavior: <Keys>Enter</Keys> follows it, <Keys>Space</Keys>{' '}
          does nothing, and it never claims <code>role="button"</code>. The div host gets the role,
          a tab stop, and a real click synthesized from the keyboard.
        </p>
      </Bench>

      <Bench caption="Blocked" note="disabled · pending">
        <div class="row">
          <Button class="btn" disabled onClick={count}>
            disabled
          </Button>
          <Button class="btn" disabled focusableWhenDisabled onClick={count}>
            disabled, focusable
          </Button>
          <Button class="btn" as="a" href="#button" disabled onClick={count}>
            disabled link
          </Button>
          <Button class="btn btn--accent" pending={pending()} onClick={save}>
            {pending() ? 'saving' : 'save'}
          </Button>
        </div>
        <p class="prose">
          Every button here shares one <code>onClick</code>. A disabled or pending button never lets
          it run, so the counter only moves for the ones that are live. The second button keeps its
          tab stop and answers <code>aria-disabled</code> instead of dropping out of the tab order.
          The disabled link drops its <code>href</code> entirely.
        </p>
        <Readout
          rows={[
            ['clicks that reached the handler', String(reached())],
            ['pending', String(pending())],
          ]}
        />
      </Bench>
    </Section>
  )
}
