import { Toolbar } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { For, Show, createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

async function focused(node: HTMLElement) {
  await expect
    .poll(() => {
      flush()
      return document.activeElement
    })
    .toBe(node)
}

// Candidate contract: registration sorts once; later DOM-only moves are currently
// documented as unobserved. Keep this requested behavior visible for issue review.
test('candidate: reordered keyed toolbar hosts retain identity and native arrows follow their current DOM order', async () => {
  const [items, setItems] = createSignal(['a', 'b', 'c'])
  const activated = vi.fn()
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <Toolbar aria-label="Actions">
        <For each={items()}>
          {(value) => <Toolbar.Button onClick={activated}>{value}</Toolbar.Button>}
        </For>
      </Toolbar>
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
  const b = m.getByRole('button', { name: 'b' })
  setItems(['c', 'b', 'a'])
  flush()
  await expect.poll(() => m.getByRole('toolbar').textContent).toBe('cba')
  expect(m.getByRole('button', { name: 'b' })).toBe(b)
  b.focus()
  await userEvent.keyboard('{ArrowRight}')
  await focused(m.getByRole('button', { name: 'a' }))
  await userEvent.keyboard('{ArrowLeft}')
  await focused(b)
  await userEvent.keyboard('{Home}')
  await focused(m.getByRole('button', { name: 'c' }))
  await userEvent.keyboard('{End}')
  await focused(m.getByRole('button', { name: 'a' }))
  expect(activated).not.toHaveBeenCalled()
})

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
