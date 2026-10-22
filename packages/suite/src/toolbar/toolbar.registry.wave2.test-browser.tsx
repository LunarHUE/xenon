import { ToggleGroup, Toolbar } from '@xenon-ui/solid'
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

// Adopted contract (#44): keyboard navigation re-reads DOM order, so keyed moves that
// keep their hosts mounted change where arrows, Home and End go.
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

// The initial fallback stop sets no explicit active item, so a reorder must not
// re-resolve the navigation origin away from the focused host.
for (const composition of ['button', 'toggle-group'] as const) {
  for (const key of ['ArrowRight', 'Home'] as const) {
    test(`${composition} reorder keeps the focused fallback item as the ${key} origin`, async () => {
      const [items, setItems] = createSignal(['a', 'b', 'c'])
      const container = document.createElement('div')
      document.body.append(container)
      const dispose = render(
        () => (
          <Toolbar aria-label="Actions">
            {composition === 'button' ? (
              <For each={items()}>{(value) => <Toolbar.Button>{value}</Toolbar.Button>}</For>
            ) : (
              <ToggleGroup aria-label="Styles">
                <For each={items()}>
                  {(value) => (
                    <ToggleGroup.Item as={Toolbar.Button} value={value}>
                      {value}
                    </ToggleGroup.Item>
                  )}
                </For>
              </ToggleGroup>
            )}
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
      const a = m.getByRole('button', { name: 'a' })
      expect(a).toHaveAttribute('tabindex', '0')
      setItems(['c', 'b', 'a'])
      flush()
      await expect.poll(() => m.getByRole('toolbar').textContent).toBe('cba')
      a.focus()
      await userEvent.keyboard(`{${key}}`)
      const c = m.getByRole('button', { name: 'c' })
      await focused(c)
      await expect
        .poll(() => {
          flush()
          return c.getAttribute('tabindex')
        })
        .toBe('0')
      expect(a).toHaveAttribute('tabindex', '-1')
    })
  }
}

// An author handler runs before the generated keydown; a focus change it makes must
// survive the reorder that the same event discovers.
for (const composition of ['button', 'toggle-group'] as const) {
  test(`${composition} reorder keeps a stop that an author shortcut moved in the same keydown`, async () => {
    const [items, setItems] = createSignal(['a', 'b', 'c'])
    const container = document.createElement('div')
    document.body.append(container)
    const shortcut = (event: KeyboardEvent) => {
      if (event.key !== 'q') return
      const target = [...container.querySelectorAll('button')].find((b) => b.textContent === 'c')
      target?.focus()
    }
    const dispose = render(
      () => (
        <Toolbar aria-label="Actions">
          {composition === 'button' ? (
            <For each={items()}>
              {(value) => <Toolbar.Button onKeyDown={shortcut}>{value}</Toolbar.Button>}
            </For>
          ) : (
            <ToggleGroup aria-label="Styles">
              <For each={items()}>
                {(value) => (
                  <ToggleGroup.Item as={Toolbar.Button} value={value} onKeyDown={shortcut}>
                    {value}
                  </ToggleGroup.Item>
                )}
              </For>
            </ToggleGroup>
          )}
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
    setItems(['c', 'b', 'a'])
    flush()
    await expect.poll(() => m.getByRole('toolbar').textContent).toBe('cba')
    const a = m.getByRole('button', { name: 'a' })
    const c = m.getByRole('button', { name: 'c' })
    a.focus()
    await userEvent.keyboard('q')
    await focused(c)
    await expect
      .poll(() => {
        flush()
        return c.getAttribute('tabindex')
      })
      .toBe('0')
    expect(a).toHaveAttribute('tabindex', '-1')
    await userEvent.keyboard('{ArrowRight}')
    await focused(m.getByRole('button', { name: 'b' }))
  })
}
