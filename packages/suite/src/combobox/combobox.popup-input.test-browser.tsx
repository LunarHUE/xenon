import { Combobox } from '@xenon/solid/combobox'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, For, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const items = [
  { value: 'solid', label: 'Solid' },
  { value: 'react', label: 'React', disabled: true },
  { value: 'svelte', label: 'Svelte' },
]

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
  return within(container)
}

function Parts() {
  return (
    <>
      <Combobox.Trigger aria-label="Framework">
        <Combobox.Value placeholder="Choose framework" />
      </Combobox.Trigger>
      <Combobox.Positioner>
        <Combobox.Content
          aria-label="Choose framework"
          style={{ background: 'white', padding: '1em' }}
        >
          <Combobox.Input aria-label="Search frameworks" />
          <Combobox.Viewport aria-label="Frameworks" />
        </Combobox.Content>
      </Combobox.Positioner>
    </>
  )
}

test('popup search opens by keyboard, skips disabled options, restores focus, and clears its query', async () => {
  const view = mount(() => (
    <Combobox items={items} inputPlacement="popup" defaultValue="solid">
      <Parts />
    </Combobox>
  ))
  const trigger = view.getByRole('combobox', { name: 'Framework' })
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  const input = (await view.findByRole('combobox', {
    name: 'Search frameworks',
  })) as HTMLInputElement
  await vi.waitFor(() => expect(document.activeElement).toBe(input))
  expect(input.value).toBe('')
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
  await vi.waitFor(() => expect(document.activeElement).toBe(trigger))
  expect(trigger.textContent).toBe('Svelte')
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  await userEvent.keyboard('{Enter}')
  const reopened = (await view.findByRole('combobox', {
    name: 'Search frameworks',
  })) as HTMLInputElement
  await vi.waitFor(() => expect(document.activeElement).toBe(reopened))
  await userEvent.keyboard('sol{Escape}')
  await vi.waitFor(() => expect(document.activeElement).toBe(trigger))
  expect(trigger.textContent).toBe('Svelte')
  await userEvent.keyboard(' ')
  const again = (await view.findByRole('combobox', {
    name: 'Search frameworks',
  })) as HTMLInputElement
  await vi.waitFor(() => expect(document.activeElement).toBe(again))
  expect(again.value).toBe('')
})

test('Tab and outside clicks dismiss without stealing intentional outside focus', async () => {
  const view = mount(() => (
    <>
      <Combobox items={items} inputPlacement="popup">
        <Parts />
      </Combobox>
      <button>Next control</button>
    </>
  ))
  const trigger = view.getByRole('combobox', { name: 'Framework' })
  const next = view.getByRole('button', { name: 'Next control' })
  await userEvent.click(trigger)
  const input = await view.findByRole('combobox', { name: 'Search frameworks' })
  await vi.waitFor(() => expect(document.activeElement).toBe(input))
  await userEvent.tab()
  await vi.waitFor(() => expect(document.activeElement).toBe(next))
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  await userEvent.click(trigger)
  await view.findByRole('combobox', { name: 'Search frameworks' })
  await userEvent.click(next)
  await vi.waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
  expect(document.activeElement).toBe(next)
})

test('controlled visibility and value stay owned by the caller', async () => {
  const [open, setOpen] = createSignal(false)
  const change = vi.fn()
  const view = mount(() => (
    <>
      <button onClick={() => setOpen(true)}>Open externally</button>
      <Combobox
        items={items}
        inputPlacement="popup"
        open={open()}
        onOpenChange={setOpen}
        value="solid"
        onValueChange={change}
      >
        <Parts />
      </Combobox>
    </>
  ))
  await userEvent.click(view.getByRole('button', { name: 'Open externally' }))
  const input = await view.findByRole('combobox', { name: 'Search frameworks' })
  await vi.waitFor(() => expect(document.activeElement).toBe(input))
  await userEvent.keyboard('sve{ArrowDown}{Enter}')
  await vi.waitFor(() => expect(open()).toBe(false))
  expect(change).toHaveBeenCalledWith('svelte')
  expect(view.getByRole('combobox', { name: 'Framework' }).textContent).toBe('Solid')
})

test('externally closing popup search clears an uncontrolled query but respects a controlled query', async () => {
  const [open, setOpen] = createSignal(false)
  const [controlled, setControlled] = createSignal(false)
  const view = mount(() => (
    <Combobox
      items={items}
      inputPlacement="popup"
      open={open()}
      onOpenChange={setOpen}
      inputValue={controlled() ? 'Solid' : undefined}
    >
      <Parts />
    </Combobox>
  ))
  const trigger = view.getByRole('combobox', { name: 'Framework' })
  await userEvent.click(trigger)
  const input = await view.findByRole('combobox', { name: 'Search frameworks' })
  await vi.waitFor(() => expect(document.activeElement).toBe(input))
  await userEvent.keyboard('sve')
  setOpen(false)
  flush()
  await vi.waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
  await userEvent.click(trigger)
  const reopened = (await view.findByRole('combobox', {
    name: 'Search frameworks',
  })) as HTMLInputElement
  expect(reopened.value).toBe('')
  setControlled(true)
  flush()
  await vi.waitFor(() => expect(reopened.value).toBe('Solid'))
  await userEvent.keyboard('{Escape}')
  await userEvent.click(trigger)
  expect(
    ((await view.findByRole('combobox', { name: 'Search frameworks' })) as HTMLInputElement).value
  ).toBe('Solid')
})

test('Content callbacks receive filtered root items without replacing the search input', async () => {
  const [collection, setCollection] = createSignal(items)
  const rendered = vi.fn()
  const view = mount(() => (
    <Combobox items={collection()} inputPlacement="popup">
      <Combobox.Trigger aria-label="Framework">
        <Combobox.Value />
      </Combobox.Trigger>
      <Combobox.Positioner>
        <Combobox.Content aria-label="Choose framework">
          {(options) => {
            rendered()
            return (
              <>
                <Combobox.Input aria-label="Search frameworks" />
                <Combobox.Viewport aria-label="Frameworks">
                  <For each={options}>
                    {(item) => <Combobox.Item value={item.value}>{item.label}</Combobox.Item>}
                  </For>
                </Combobox.Viewport>
              </>
            )
          }}
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox>
  ))
  await userEvent.click(view.getByRole('combobox', { name: 'Framework' }))
  const input = (await view.findByRole('combobox', {
    name: 'Search frameworks',
  })) as HTMLInputElement
  await vi.waitFor(() => expect(document.activeElement).toBe(input))
  expect(view.getAllByRole('option')).toHaveLength(3)
  await userEvent.keyboard('sv')
  await vi.waitFor(() => expect(view.getAllByRole('option')).toHaveLength(1))
  expect(view.getByRole('option').textContent).toBe('Svelte')
  expect(document.activeElement).toBe(input)
  expect(input.selectionStart).toBe(2)
  setCollection([...items, { value: 'sv-new', label: 'SV new release' }])
  flush()
  await vi.waitFor(() => expect(view.getAllByRole('option')).toHaveLength(2))
  expect(view.getByRole('combobox', { name: 'Search frameworks' })).toBe(input)
  expect(rendered).toHaveBeenCalledTimes(1)
  await userEvent.keyboard('{ArrowDown}{Enter}')
  await vi.waitFor(() =>
    expect(view.getByRole('combobox', { name: 'Framework' }).textContent).toBe('Svelte')
  )
})

test('Viewport callbacks can render the collection without receiving a second items prop', async () => {
  const view = mount(() => (
    <Combobox items={items} inputPlacement="popup">
      <Combobox.Trigger aria-label="Framework">
        <Combobox.Value />
      </Combobox.Trigger>
      <Combobox.Positioner>
        <Combobox.Content aria-label="Choose framework">
          <Combobox.Input aria-label="Search frameworks" />
          <Combobox.Viewport aria-label="Frameworks">
            {(options) => (
              <For each={options}>
                {(item) => <Combobox.Item value={item.value}>{item.label}</Combobox.Item>}
              </For>
            )}
          </Combobox.Viewport>
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox>
  ))
  await userEvent.click(view.getByRole('combobox', { name: 'Framework' }))
  const input = await view.findByRole('combobox', { name: 'Search frameworks' })
  await vi.waitFor(() => expect(document.activeElement).toBe(input))
  await userEvent.keyboard('no match')
  await vi.waitFor(() => expect(view.queryAllByRole('option')).toHaveLength(0))
})
