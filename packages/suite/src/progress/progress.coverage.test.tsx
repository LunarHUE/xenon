import { Progress } from '@xenon/solid/progress'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { afterEach, expect, test } from 'vitest'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'

const cleanups: (() => void)[] = []

function mount(children: () => JSX.Element) {
  const root = document.createElement('div')
  document.body.append(root)
  const dispose = render(children, root)
  cleanups.push(() => {
    dispose()
    root.remove()
  })
  return { root, ...within(root) }
}

afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
})

test('progress.roles.6: title supplies the accessible name when no aria-label is provided', () => {
  const m = mount(() => <Progress value={40} title="Upload progress" />)
  expect(m.getByRole('progressbar', { name: 'Upload progress' })).toHaveAttribute(
    'aria-valuenow',
    '40'
  )
})

test('progress.roles.16: an author label reference names the progressbar while formatted value remains aria-valuetext', () => {
  const m = mount(() => (
    <>
      <span id="upload-label">Uploading files</span>
      <Progress value={40} aria-labelledby="upload-label" />
    </>
  ))
  const progress = m.getByRole('progressbar', { name: 'Uploading files' })
  expect(progress).toHaveAttribute('aria-labelledby', 'upload-label')
  expect(progress).toHaveAttribute('aria-valuetext', '40%')
})

test('progress.state.21: a bound parent value updates aria-valuenow and author display text together', () => {
  const [value, setValue] = createSignal(20)
  const m = mount(() => (
    <Progress value={value()} aria-label="Upload progress">
      <span data-testid="bound-value">{value()}%</span>
    </Progress>
  ))
  expect(m.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20')
  expect(m.getByTestId('bound-value')).toHaveTextContent('20%')
  setValue(80)
  flush()
  expect(m.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '80')
  expect(m.getByTestId('bound-value')).toHaveTextContent('80%')
})
