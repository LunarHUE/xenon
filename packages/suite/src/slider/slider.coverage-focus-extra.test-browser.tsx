import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { Slider } from '@xenon-ui/solid/slider'

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { container, ...within(container) }
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

test('slider.focus.1 gives every native thumb a tab stop and focuses the thumb', async () => {
  const view = mount(() => (
    <Slider defaultValue={[20, 60]} aria-label="Budget">
      <Slider.Control>
        <Slider.Thumb index={0} aria-label="Minimum" />
        <Slider.Thumb index={1} aria-label="Maximum" />
      </Slider.Control>
    </Slider>
  ))
  await settle()
  const thumbs = view.getAllByRole('slider') as HTMLInputElement[]
  expect(thumbs).toHaveLength(2)
  for (const thumb of thumbs) {
    expect(thumb.tagName).toBe('INPUT')
    expect(thumb.type).toBe('range')
    expect(thumb.tabIndex).toBe(0)
  }
  thumbs[0]!.focus()
  await userEvent.tab()
  expect(thumbs[1]).toHaveFocus()
  thumbs[1]!.focus()
  expect(thumbs[1]).toHaveFocus()
  expect(view.getByRole('group', { name: 'Budget' })).not.toHaveFocus()
})

test('slider.focus.2 tabs each range thumb in DOM order and reverse order', async () => {
  const view = mount(() => (
    <>
      <button type="button">Before</button>
      <Slider defaultValue={[20, 60]} aria-label="Budget">
        <Slider.Control>
          <Slider.Thumb index={0} aria-label="Minimum" />
          <Slider.Thumb index={1} aria-label="Maximum" />
        </Slider.Control>
      </Slider>
      <button type="button">After</button>
    </>
  ))
  await settle()
  const before = view.getByRole('button', { name: 'Before' })
  const lower = view.getByRole('slider', { name: 'Minimum' })
  const upper = view.getByRole('slider', { name: 'Maximum' })
  const after = view.getByRole('button', { name: 'After' })
  before.focus()
  await userEvent.tab()
  expect(lower).toHaveFocus()
  await userEvent.tab()
  expect(upper).toHaveFocus()
  await userEvent.tab()
  expect(after).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(upper).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(lower).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(before).toHaveFocus()
})

test('slider.focus.4 skips every disabled thumb between focusable controls', async () => {
  const view = mount(() => (
    <>
      <button type="button">Before</button>
      <Slider disabled defaultValue={[20, 60]} aria-label="Budget">
        <Slider.Control>
          <Slider.Thumb index={0} aria-label="Minimum" />
          <Slider.Thumb index={1} aria-label="Maximum" />
        </Slider.Control>
      </Slider>
      <button type="button">After</button>
    </>
  ))
  await settle()
  const before = view.getByRole('button', { name: 'Before' })
  const after = view.getByRole('button', { name: 'After' })
  for (const thumb of view.getAllByRole('slider')) {
    expect(thumb).toBeDisabled()
    expect(thumb).toHaveAttribute('aria-disabled', 'true')
  }
  before.focus()
  await userEvent.tab()
  expect(after).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(before).toHaveFocus()
})

test('slider.focus.10 fires focus and blur once per transition with the native thumb currentTarget', async () => {
  const focus = vi.fn()
  const blur = vi.fn()
  const focusTargets: EventTarget[] = []
  const blurTargets: EventTarget[] = []
  const view = mount(() => (
    <>
      <button type="button">Before</button>
      <Slider defaultValue={[20]}>
        <Slider.Thumb
          aria-label="Volume"
          onFocus={(event) => {
            focus(event)
            focusTargets.push(event.currentTarget)
          }}
          onBlur={(event) => {
            blur(event)
            blurTargets.push(event.currentTarget)
          }}
        />
      </Slider>
      <button type="button">After</button>
    </>
  ))
  await settle()
  const before = view.getByRole('button', { name: 'Before' })
  const thumb = view.getByRole('slider', { name: 'Volume' })
  const after = view.getByRole('button', { name: 'After' })
  before.focus()
  await userEvent.tab()
  expect(thumb).toHaveFocus()
  await userEvent.tab()
  expect(after).toHaveFocus()
  expect(focus).toHaveBeenCalledOnce()
  expect(blur).toHaveBeenCalledOnce()
  expect(focusTargets).toEqual([thumb])
  expect(blurTargets).toEqual([thumb])
})

test('slider.roles.16 marks the disabled root and every rendered part', async () => {
  const view = mount(() => (
    <Slider disabled defaultValue={[20]} aria-label="Budget" data-testid="root">
      <Slider.Label data-testid="label">Budget</Slider.Label>
      <Slider.Control data-testid="control">
        <Slider.Track data-testid="track" />
        <Slider.Range data-testid="range" />
        <Slider.Thumb data-testid="thumb" aria-label="Amount" />
      </Slider.Control>
      <Slider.ValueText data-testid="value" />
    </Slider>
  ))
  await settle()
  for (const id of ['root', 'label', 'control', 'track', 'range', 'thumb', 'value']) {
    expect(view.getByTestId(id)).toHaveAttribute('data-disabled', '')
  }
  expect(view.getByTestId('thumb')).toHaveAttribute('aria-disabled', 'true')
  expect(view.getByTestId('thumb')).toBeDisabled()
})
