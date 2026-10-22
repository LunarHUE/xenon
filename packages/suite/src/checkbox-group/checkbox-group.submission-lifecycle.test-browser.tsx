import { CheckboxGroup } from '@xenon-ui/solid'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, For, Show, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

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
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}

test('checkbox-group.forms.5: actual submit projects selected controls in current DOM order after keyed reordering', async () => {
  const entries = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Gamma' },
  ]
  const [order, setOrder] = createSignal(entries)
  const submissions: FormDataEntryValue[][] = []
  const change = vi.fn()
  const view = mount(() => (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submissions.push(new FormData(event.currentTarget).getAll('choice'))
      }}
    >
      <CheckboxGroup name="choice" defaultValue={['a']} onValueChange={change} aria-label="Choices">
        <For each={order()}>
          {(entry) => <CheckboxGroup.Item value={entry.value} aria-label={entry.label} />}
        </For>
      </CheckboxGroup>
      <button type="submit">Save</button>
    </form>
  ))
  const alpha = view.getByRole('checkbox', { name: 'Alpha' })
  const gamma = view.getByRole('checkbox', { name: 'Gamma' })
  await userEvent.click(gamma)
  await userEvent.click(view.getByRole('button', { name: 'Save' }))
  expect(submissions).toEqual([['a', 'c']])
  setOrder([entries[2]!, entries[1]!, entries[0]!])
  await settle()
  expect(view.getByRole('checkbox', { name: 'Alpha' })).toBe(alpha)
  expect(view.getByRole('checkbox', { name: 'Gamma' })).toBe(gamma)
  await userEvent.click(view.getByRole('button', { name: 'Save' }))
  expect(submissions).toEqual([
    ['a', 'c'],
    ['c', 'a'],
  ])
  expect(change.mock.calls).toEqual([[['a', 'c']]])
})

test('checkbox-group.forms.16: moving an individually required child transfers native validation between owners and unmount clears it', async () => {
  const [owner, setOwner] = createSignal('choices-first')
  const [shown, setShown] = createSignal(true)
  const firstSubmit = vi.fn((event: SubmitEvent) => event.preventDefault())
  const secondSubmit = vi.fn((event: SubmitEvent) => event.preventDefault())
  const change = vi.fn()
  const view = mount(() => (
    <>
      <form id="choices-first" onSubmit={firstSubmit}>
        <button type="submit">Save first</button>
      </form>
      <form id="choices-second" onSubmit={secondSubmit}>
        <button type="submit">Save second</button>
      </form>
      <CheckboxGroup
        name="choice"
        defaultValue={['kept']}
        onValueChange={change}
        aria-label="Choices"
      >
        <CheckboxGroup.Item value="kept" form="choices-first" aria-label="Kept" />
        <Show when={shown()}>
          <CheckboxGroup.Item value="required" form={owner()} required aria-label="Required" />
        </Show>
      </CheckboxGroup>
    </>
  ))
  const first = view.container.querySelector<HTMLFormElement>('#choices-first')!
  const second = view.container.querySelector<HTMLFormElement>('#choices-second')!
  expect(first.checkValidity()).toBe(false)
  expect(second.checkValidity()).toBe(true)
  await userEvent.click(view.getByRole('button', { name: 'Save first' }))
  expect(firstSubmit).not.toHaveBeenCalled()
  expect(view.getByRole('checkbox', { name: 'Required' })).toHaveFocus()
  setOwner('choices-second')
  await settle()
  expect(first.checkValidity()).toBe(true)
  expect(second.checkValidity()).toBe(false)
  await userEvent.click(view.getByRole('button', { name: 'Save first' }))
  await userEvent.click(view.getByRole('button', { name: 'Save second' }))
  expect(firstSubmit).toHaveBeenCalledOnce()
  expect(secondSubmit).not.toHaveBeenCalled()
  setShown(false)
  await settle()
  expect(second.checkValidity()).toBe(true)
  await userEvent.click(view.getByRole('button', { name: 'Save second' }))
  expect(secondSubmit).toHaveBeenCalledOnce()
  expect(new FormData(first).getAll('choice')).toEqual(['kept'])
  expect(view.getByRole('checkbox', { name: 'Kept' })).toBeChecked()
  expect(change).not.toHaveBeenCalled()
})

test('checkbox-group.forms.13: a native disabled fieldset excludes selected controls until reenabled without erasing group selection', async () => {
  const [disabled, setDisabled] = createSignal(true)
  const submissions: FormDataEntryValue[][] = []
  const change = vi.fn()
  const view = mount(() => (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submissions.push(new FormData(event.currentTarget).getAll('choice'))
      }}
    >
      <fieldset disabled={disabled()}>
        <legend>Choices</legend>
        <CheckboxGroup name="choice" defaultValue={['a', 'b']} onValueChange={change}>
          <CheckboxGroup.Item value="a" aria-label="Alpha" />
          <CheckboxGroup.Item value="b" aria-label="Beta" />
        </CheckboxGroup>
      </fieldset>
      <button type="submit">Save</button>
    </form>
  ))
  await userEvent.click(view.getByRole('button', { name: 'Save' }))
  expect(submissions).toEqual([[]])
  for (const control of view.getAllByRole('checkbox')) {
    expect(control).toBeChecked()
    expect(control).toBeDisabled()
  }
  setDisabled(false)
  await settle()
  await userEvent.click(view.getByRole('button', { name: 'Save' }))
  expect(submissions).toEqual([[], ['a', 'b']])
  for (const control of view.getAllByRole('checkbox')) {
    expect(control).toBeChecked()
    expect(control).not.toBeDisabled()
  }
  expect(change).not.toHaveBeenCalled()
})
