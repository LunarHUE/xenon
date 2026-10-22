import { Toolbar } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { Show, createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test } from 'vitest'
import { userEvent } from 'vitest/browser'

async function focused(node: HTMLElement) {
  await expect
    .poll(() => {
      flush()
      return document.activeElement
    })
    .toBe(node)
}

test('removing the active item with every survivor disabled leaves no roving stop until one is enabled', async () => {
  const [activePresent, setActivePresent] = createSignal(true)
  const [disabled, setDisabled] = createSignal(true)
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <>
        <button>Before</button>
        <Toolbar aria-label="Actions">
          <Show when={activePresent()}>
            <Toolbar.Button>Active</Toolbar.Button>
          </Show>
          <Toolbar.Button disabled={disabled()} focusableWhenDisabled={false}>
            Survivor
          </Toolbar.Button>
        </Toolbar>
        <button>After</button>
      </>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  const m = within(container)
  const toolbar = m.getByRole('toolbar')
  m.getByRole('button', { name: 'Active' }).focus()
  setActivePresent(false)
  flush()
  await expect
    .poll(() => {
      flush()
      return toolbar.querySelectorAll('[tabindex="0"]').length
    })
    .toBe(0)
  expect(toolbar).toHaveAttribute('tabindex', '-1')
  const before = m.getByRole('button', { name: 'Before' })
  before.focus()
  await userEvent.keyboard('{Tab}')
  await focused(m.getByRole('button', { name: 'After' }))
  setDisabled(false)
  flush()
  const survivor = m.getByRole('button', { name: 'Survivor' })
  await expect
    .poll(() => {
      flush()
      return survivor.getAttribute('tabindex')
    })
    .toBe('0')
  before.focus()
  await userEvent.keyboard('{Tab}')
  await focused(survivor)
  expect(toolbar).not.toHaveAttribute('tabindex')
})

test('a generic disabled survivor that opted out of focus stays out of the Tab sequence after active removal', async () => {
  const [activePresent, setActivePresent] = createSignal(true)
  const [disabled, setDisabled] = createSignal(true)
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <>
        <button>Before</button>
        <Toolbar aria-label="Actions">
          <Show when={activePresent()}>
            <Toolbar.Button>Active</Toolbar.Button>
          </Show>
          <Toolbar.Button as="div" disabled={disabled()} focusableWhenDisabled={false}>
            Survivor
          </Toolbar.Button>
        </Toolbar>
        <button>After</button>
      </>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  const m = within(container)
  m.getByRole('button', { name: 'Active' }).focus()
  setActivePresent(false)
  flush()
  const survivor = m.getByRole('button', { name: 'Survivor' })
  await expect
    .poll(() => {
      flush()
      return survivor.getAttribute('tabindex')
    })
    .toBe('-1')
  expect(survivor).toHaveAttribute('aria-disabled', 'true')
  const before = m.getByRole('button', { name: 'Before' })
  before.focus()
  await userEvent.keyboard('{Tab}')
  await focused(m.getByRole('button', { name: 'After' }))
  setDisabled(false)
  flush()
  await expect
    .poll(() => {
      flush()
      return survivor.getAttribute('tabindex')
    })
    .toBe('0')
  before.focus()
  await userEvent.keyboard('{Tab}')
  await focused(survivor)
})
