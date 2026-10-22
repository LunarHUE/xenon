import { render } from '@solidjs/testing-library'
import type { ComponentProps } from '@solidjs/web'
import { createSignal, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { Progress } from './progress'

const ForwardedHost = (props: ComponentProps<'section'>) => <section {...props} />

test('forwarding host receives the ref and removes percentage styling when indeterminate', () => {
  const [value, setValue] = createSignal<number | undefined>(40)
  let ref: HTMLElement | undefined
  const view = render(() => (
    <Progress
      as={ForwardedHost}
      ref={(node) => {
        ref = node
      }}
      value={value()}
      aria-label="Transfer"
    />
  ))
  const progress = view.getByRole('progressbar')
  expect(progress).toBe(ref)
  expect(progress.tagName).toBe('SECTION')
  expect(progress.style.getPropertyValue('--progress-percentage')).toBe('40')
  setValue(undefined)
  flush()
  expect(view.getByRole('progressbar')).toBe(progress)
  expect(progress.style.getPropertyValue('--progress-percentage')).toBe('')
  expect(progress).not.toHaveAttribute('aria-valuenow')
  setValue(80)
  flush()
  expect(progress.style.getPropertyValue('--progress-percentage')).toBe('80')
})

test('author descriptions and external name text update independently of progress state', () => {
  const [name, setName] = createSignal('Upload archive')
  const [description, setDescription] = createSignal('Keep this window open')
  const [value, setValue] = createSignal<number | undefined>()
  const view = render(() => (
    <>
      <span id="transfer-name">{name()}</span>
      <span id="transfer-description">{description()}</span>
      <Progress
        value={value()}
        aria-labelledby="transfer-name"
        aria-describedby="transfer-description"
      />
    </>
  ))
  const progress = view.getByRole('progressbar', { name: 'Upload archive' })
  expect(progress).toHaveAccessibleDescription('Keep this window open')
  setName('Upload complete')
  setDescription('You may close this window')
  setValue(100)
  flush()
  expect(view.getByRole('progressbar', { name: 'Upload complete' })).toBe(progress)
  expect(progress).toHaveAccessibleDescription('You may close this window')
  expect(progress).toHaveAttribute('data-state', 'complete')
  expect(progress).not.toHaveAttribute('aria-live')
})

test('formatter dependencies update text without changing numeric value or percentage', () => {
  const [unit, setUnit] = createSignal('files')
  const view = render(() => (
    <Progress
      value={3}
      max={4}
      aria-label="Copy"
      format={({ value, max }) => `${value} of ${max} ${unit()}`}
    />
  ))
  const progress = view.getByRole('progressbar')
  expect(progress).toHaveAttribute('aria-valuetext', '3 of 4 files')
  setUnit('documents')
  flush()
  expect(progress).toHaveAttribute('aria-valuetext', '3 of 4 documents')
  expect(progress).toHaveAttribute('aria-valuenow', '3')
  expect(progress.style.getPropertyValue('--progress-percentage')).toBe('75')
})
