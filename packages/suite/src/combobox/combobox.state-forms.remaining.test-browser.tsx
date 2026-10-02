import { Combobox } from '@xenon-ui/solid/combobox'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'pear', label: 'Pear' },
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
  return { container, ...within(container) }
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

function Parts() {
  return (
    <>
      <Combobox.Input aria-label="Fruit" />
      <Combobox.Positioner>
        <Combobox.Content
          aria-label="Fruit suggestions"
          style={{ background: 'white', padding: '12px' }}
        />
      </Combobox.Positioner>
    </>
  )
}

test('combobox.forms.7: external ownership submits the committed value and native Enter reaches that form', async () => {
  const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
  const change = vi.fn()
  const m = mount(() => (
    <>
      <form id="combobox-external-owner" onSubmit={submit}>
        <button type="submit">Save external fruit</button>
      </form>
      <Combobox
        items={items}
        form="combobox-external-owner"
        name="fruit"
        defaultValue="pear"
        onValueChange={change}
      >
        <Parts />
      </Combobox>
    </>
  ))
  const form = m.container.querySelector('form')!
  const native = m.container.querySelector('select')!
  const input = m.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
  expect(form.contains(native)).toBe(false)
  expect(form.contains(input)).toBe(false)
  expect(native.form).toBe(form)
  expect(new FormData(form).getAll('fruit')).toEqual(['pear'])
  expect(submit).not.toHaveBeenCalled()
  await userEvent.click(input)
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(submit).toHaveBeenCalledTimes(1)
  expect(submit.mock.calls[0]![0].target).toBe(form)
  expect(submit.mock.calls[0]![0].submitter).toBe(
    m.getByRole('button', { name: 'Save external fruit' })
  )
  expect(new FormData(form).getAll('fruit')).toEqual(['pear'])
  expect(input).toHaveValue('Pear')
  expect(change).not.toHaveBeenCalled()
})

test('combobox.forms.12: an unknown native value leaves query and commitment unchanged without callbacks', async () => {
  const change = vi.fn()
  const text = vi.fn()
  const m = mount(() => (
    <form>
      <Combobox
        items={items}
        name="fruit"
        defaultValue="pear"
        onValueChange={change}
        onInputValueChange={text}
      >
        <Parts />
      </Combobox>
    </form>
  ))
  const form = m.container.querySelector('form')!
  const native = m.container.querySelector('select')!
  native.add(new Option('Unknown browser value', 'unknown'))
  native.value = 'unknown'
  expect(native.value).toBe('unknown')
  native.dispatchEvent(new Event('change', { bubbles: true }))
  await settle()
  expect(native.value).toBe('pear')
  expect(m.getByRole('combobox', { name: 'Fruit' })).toHaveValue('Pear')
  expect(new FormData(form).getAll('fruit')).toEqual(['pear'])
  expect(change).not.toHaveBeenCalled()
  expect(text).not.toHaveBeenCalled()
})

test('combobox.roles.9: the inline input and separate open button expose matching expanded transitions', async () => {
  const m = mount(() => (
    <Combobox items={items}>
      <Combobox.Input aria-label="Fruit" />
      <Combobox.Trigger />
      <Combobox.Positioner>
        <Combobox.Content
          aria-label="Fruit suggestions"
          style={{ background: 'white', padding: '12px' }}
        />
      </Combobox.Positioner>
    </Combobox>
  ))
  const input = m.getByRole('combobox', { name: 'Fruit' })
  const trigger = m.getByRole('button', { name: 'Show suggestions' })
  expect(input).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await userEvent.click(input)
  await userEvent.click(trigger)
  await settle()
  expect(input).toHaveAttribute('aria-expanded', 'true')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const popup = m.getByRole('listbox')
  expect(input).toHaveAttribute('aria-controls', popup.id)
  expect(trigger).toHaveAttribute('aria-controls', popup.id)
  expect(input).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(input).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(input).not.toHaveAttribute('aria-controls')
  expect(trigger).not.toHaveAttribute('aria-controls')
  expect(m.queryByRole('listbox')).toBeNull()
})

test('combobox.roles.33: required ARIA follows root changes while native validity uses committed selection', async () => {
  const [required, setRequired] = createSignal(false)
  const m = mount(() => (
    <form>
      <Combobox items={items} name="fruit" required={required()}>
        <Parts />
      </Combobox>
    </form>
  ))
  const form = m.container.querySelector('form')!
  const native = m.container.querySelector('select')!
  const input = m.getByRole('combobox', { name: 'Fruit' })
  expect(input).not.toHaveAttribute('aria-required')
  setRequired(true)
  await settle()
  expect(input).toHaveAttribute('aria-required', 'true')
  expect(native.required).toBe(true)
  await userEvent.click(input)
  await userEvent.keyboard('Pear')
  await settle()
  expect(input).toHaveValue('Pear')
  expect(form.checkValidity()).toBe(false)
  await userEvent.keyboard('{ArrowDown}{Enter}')
  await settle()
  expect(input).toHaveAttribute('aria-required', 'true')
  expect(form.checkValidity()).toBe(true)
  expect(new FormData(form).get('fruit')).toBe('pear')
  setRequired(false)
  await settle()
  expect(input).not.toHaveAttribute('aria-required')
  expect(native.required).toBe(false)
  expect(new FormData(form).get('fruit')).toBe('pear')
})

test('combobox.focus.22: native input blur and wrapping focusout handlers each run once', async () => {
  const inner = vi.fn()
  const outer = vi.fn()
  const m = mount(() => (
    <>
      <div onFocusOut={outer}>
        <Combobox items={items}>
          <Combobox.Input aria-label="Fruit" onBlur={inner} />
        </Combobox>
      </div>
      <button type="button">After</button>
    </>
  ))
  const input = m.getByRole('combobox', { name: 'Fruit' })
  const after = m.getByRole('button', { name: 'After' })
  await userEvent.click(input)
  expect(inner).not.toHaveBeenCalled()
  expect(outer).not.toHaveBeenCalled()
  await userEvent.tab()
  await settle()
  expect(after).toHaveFocus()
  expect(inner).toHaveBeenCalledTimes(1)
  expect(outer).toHaveBeenCalledTimes(1)
  expect(inner.mock.calls[0]![0].target).toBe(input)
  expect(outer.mock.calls[0]![0].target).toBe(input)
  expect(inner.mock.calls[0]![0].relatedTarget).toBe(after)
  expect(outer.mock.calls[0]![0].relatedTarget).toBe(after)
})

test('combobox.state.20: rejected controlled typing reports its intent and external query changes render without echo', async () => {
  const [query, setQuery] = createSignal('Pear')
  const text = vi.fn()
  const change = vi.fn()
  const m = mount(() => (
    <form>
      <Combobox
        items={items}
        name="fruit"
        defaultValue="pear"
        inputValue={query()}
        onInputValueChange={text}
        onValueChange={change}
      >
        <Parts />
      </Combobox>
    </form>
  ))
  const input = m.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
  expect(input).toHaveValue('Pear')
  await userEvent.click(input)
  input.setSelectionRange(4, 4)
  await userEvent.keyboard('x')
  await settle()
  expect(input).toHaveValue('Pear')
  expect(text).toHaveBeenCalledExactlyOnceWith('Pearx')
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('listbox')).toBeNull()
  setQuery('Apple')
  await settle()
  expect(input).toHaveValue('Apple')
  expect(input).toHaveAttribute('aria-expanded', 'false')
  expect(m.queryByRole('listbox')).toBeNull()
  expect(text).toHaveBeenCalledExactlyOnceWith('Pearx')
  expect(change).not.toHaveBeenCalled()
  expect(new FormData(m.container.querySelector('form')!).get('fruit')).toBe('pear')
})
