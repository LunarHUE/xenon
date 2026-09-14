import { Button, Progress } from '@tenon/solid'
import type { JSX } from '@solidjs/web'
import { createSignal } from 'solid-js'

import { Bench, Readout, Section } from '../ui'

const TOTAL = 48

export function ProgressDemo(): JSX.Element {
  const [done, setDone] = createSignal(18)

  const step = (by: number) => () => setDone((n) => Math.min(Math.max(n + by, 0), TOTAL))

  return (
    <Section
      index="13"
      title="Progress"
      blurb="A number, its bounds and a percentage. There is no bar and no fill part; the element
        publishes what it knows as a custom property and the stylesheet draws it."
    >
      <Bench caption="Determinate" note="value · format">
        <Progress
          class="meter"
          value={done()}
          max={TOTAL}
          format={(details) => `${details.value} of ${details.max} files`}
          aria-label="Upload"
        >
          <span class="meter__fill" />
        </Progress>
        <div class="row">
          <Button class="btn" onClick={step(-6)} disabled={done() === 0}>
            back
          </Button>
          <Button class="btn btn--accent" onClick={step(6)} disabled={done() === TOTAL}>
            advance
          </Button>
        </div>
        <p class="prose">
          The value is clamped into the range you gave rather than trusted, and{' '}
          <code>--progress-percentage</code> is written on the element as a bare number, so the fill
          is a <code>calc()</code> away and nothing about the shape of the bar is the library's
          business. <code>format</code> exists because a screen reader reading "thirty-seven
          percent" is less useful than hearing how many files are left.
        </p>
        <Readout
          rows={[
            ['aria-valuenow', String(done())],
            ['aria-valuetext', `${done()} of ${TOTAL} files`],
            ['data-state', done() === TOTAL ? 'complete' : 'loading'],
          ]}
        />
      </Bench>

      <Bench caption="Indeterminate" note="value undefined">
        <Progress class="meter" aria-label="Reticulating">
          <span class="meter__fill" />
        </Progress>
        <p class="prose">
          Leave the value out and the bar goes indeterminate: <code>aria-valuenow</code> disappears
          rather than reading zero, <code>data-state</code> says so, and the custom property is
          removed from the element instead of being left at its last number. The sweep is a keyframe
          animation in this app, keyed off that one attribute.
        </p>
        <Readout
          rows={[
            ['aria-valuenow', 'absent'],
            ['data-state', 'indeterminate'],
          ]}
        />
      </Bench>
    </Section>
  )
}
