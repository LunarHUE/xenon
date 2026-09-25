import { Progress } from '@xenon-ui/solid/progress'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { afterEach, expect, test } from 'vitest'
import { expectNoViolations } from '../a11y'

const cleanups: (() => void)[] = []

function mount(children: () => JSX.Element) {
  const root = document.createElement('div')
  document.body.append(root)
  const dispose = render(children, root)
  cleanups.push(() => {
    dispose()
    root.remove()
  })
  return root
}

afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
})

test('progress.a11y.4: a named 24 by 24 progressbar passes axe target-size when the rule is enabled', async () => {
  const root = mount(() => (
    <Progress value={40} aria-label="Upload progress" style={{ width: '24px', height: '24px' }} />
  ))
  await expectNoViolations(root, ['target-size'])
  const progress = root.querySelector('[role="progressbar"]')!
  expect(progress).toHaveAttribute('aria-valuenow', '40')
})
