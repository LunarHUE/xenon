import { render } from '@solidjs/web'
import { Progress } from '@xenon-ui/solid/progress'
import { within } from '@testing-library/dom'
import axe from 'axe-core'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'

const cleanups: (() => void)[] = []
afterEach(() =>
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
)

// These rules exercise finite ARIA and accessible-name checks without relying on
// color, geometry, landmark coverage, or manual-review results.
const rules = [
  'aria-allowed-attr',
  'aria-valid-attr',
  'aria-valid-attr-value',
  'aria-required-attr',
  'aria-roles',
  'aria-progressbar-name',
]

test.each(['div', 'article'] as const)(
  '%s keeps resolved accessible names and valid ARIA through determinate and indeterminate updates',
  async (as) => {
    const root = document.createElement('div')
    document.body.append(root)
    const [value, setValue] = createSignal<number | undefined>(25)
    const dispose = render(
      () => (
        <>
          <span id="aria-progress-name">Archive upload</span>
          <span id="aria-progress-description">Files transferred</span>
          <Progress
            as={as}
            value={value()}
            aria-labelledby="aria-progress-name"
            aria-describedby="aria-progress-description"
          />
        </>
      ),
      root
    )
    cleanups.push(() => {
      dispose()
      root.remove()
    })
    flush()
    const progress = within(root).getByRole('progressbar', { name: 'Archive upload' })
    for (const value of [25, undefined, 100, 0]) {
      setValue(value)
      flush()
      expect(within(root).getByRole('progressbar', { name: 'Archive upload' })).toBe(progress)
      expect(progress).toHaveAccessibleDescription('Files transferred')
      for (const attribute of ['aria-labelledby', 'aria-describedby']) {
        for (const id of progress.getAttribute(attribute)!.split(/\s+/)) {
          expect(document.getElementById(id)).toBeInTheDocument()
          expect(root.contains(document.getElementById(id))).toBe(true)
        }
      }
      const results = await axe.run(root, { runOnly: { type: 'rule', values: rules } })
      expect(results.violations.map(({ id }) => id)).toEqual([])
      expect(results.incomplete.map(({ id }) => id)).toEqual([])
      if (value === undefined) expect(progress).not.toHaveAttribute('aria-valuenow')
      else expect(progress).toHaveAttribute('aria-valuenow', String(value))
    }
  }
)
