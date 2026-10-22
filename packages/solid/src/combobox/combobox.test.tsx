import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Combobox } from './index'
import { Field } from '../field'
afterEach(cleanup)
const items = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Apricot', disabled: true },
  { value: 'c', label: 'Cherry' },
]
function press(el: HTMLElement, key: string, extra = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra })
  el.dispatchEvent(event)
  flush()
  return event
}
function type(el: HTMLInputElement, value: string, composing = false) {
  el.value = value
  el.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: composing }))
  flush()
}
function Parts() {
  return (
    <>
      <Combobox.Input aria-label="Fruit" />
      <Combobox.Trigger />
      <Combobox.Positioner>
        <Combobox.Content />
      </Combobox.Positioner>
    </>
  )
}
describe('Combobox', () => {
  test('external form ownership reaches both the editable input and committed-value control', () => {
    const [owner, setOwner] = createSignal('first-combobox-form')
    const view = render(() => (
      <>
        <form id="first-combobox-form" />
        <form id="second-combobox-form" />
        <Combobox items={items} form={owner()} name="fruit" defaultValue="c">
          <Parts />
        </Combobox>
      </>
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    const native = view.container.querySelector('select')!
    const first = view.container.querySelector<HTMLFormElement>('#first-combobox-form')!
    const second = view.container.querySelector<HTMLFormElement>('#second-combobox-form')!
    expect(first.contains(input)).toBe(false)
    expect(first.contains(native)).toBe(false)
    expect(input.form).toBe(first)
    expect(native.form).toBe(first)
    expect(new FormData(first).getAll('fruit')).toEqual(['c'])
    expect(new FormData(second).has('fruit')).toBe(false)
    setOwner('second-combobox-form')
    flush()
    expect(input.form).toBe(second)
    expect(native.form).toBe(second)
    expect(new FormData(first).has('fruit')).toBe(false)
    expect(new FormData(second).getAll('fruit')).toEqual(['c'])
    expect(input.value).toBe('Cherry')
  })
  test('popup input uses a trigger, dialog and separate listbox, and resets forms while closed', async () => {
    const selected = vi.fn()
    const view = render(() => (
      <form>
        <Combobox
          items={items}
          inputPlacement="popup"
          defaultValue="c"
          name="fruit"
          onValueChange={selected}
        >
          <Combobox.Trigger aria-label="Fruit">
            <Combobox.Value placeholder="Choose fruit" />
          </Combobox.Trigger>
          <Combobox.Positioner>
            <Combobox.Content id="fruit-dialog" aria-label="Choose fruit">
              <Combobox.Input aria-label="Search fruit" />
              <Combobox.Viewport id="fruit-options" aria-label="Fruit options" />
            </Combobox.Content>
          </Combobox.Positioner>
        </Combobox>
      </form>
    ))
    const trigger = view.getByRole('combobox', { name: 'Fruit' })
    expect(trigger.textContent).toBe('Cherry')
    expect(trigger.getAttribute('tabindex')).toBe('0')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    trigger.click()
    flush()
    const input = (await view.findByRole('combobox', { name: 'Search fruit' })) as HTMLInputElement
    expect(input.value).toBe('')
    expect(trigger.getAttribute('aria-controls')).toBe('fruit-dialog')
    expect(input.getAttribute('aria-controls')).toBe('fruit-options')
    expect(view.getByRole('dialog').contains(view.getByRole('listbox'))).toBe(true)
    type(input, 'ap')
    expect(view.getAllByRole('option')).toHaveLength(2)
    press(input, 'ArrowDown')
    press(input, 'Enter')
    expect(selected).toHaveBeenCalledExactlyOnceWith('a')
    expect(trigger.textContent).toBe('Apple')
    expect(new FormData(view.container.querySelector('form')!).get('fruit')).toBe('a')
    trigger.click()
    flush()
    expect(
      ((await view.findByRole('combobox', { name: 'Search fruit' })) as HTMLInputElement).value
    ).toBe('')
    press(view.getByRole('combobox', { name: 'Search fruit' }), 'Escape')
    view.container.querySelector('form')!.reset()
    await new Promise((resolve) => setTimeout(resolve, 0))
    flush()
    expect(trigger.textContent).toBe('Cherry')
    expect(selected).toHaveBeenCalledTimes(1)
    expect(new FormData(view.container.querySelector('form')!).get('fruit')).toBe('c')
  })

  test('controlled text rejects browser mutation and controlled selection survives native reset', async () => {
    const text = vi.fn()
    const view = render(() => (
      <form>
        <Combobox
          items={items}
          value="c"
          inputValue="Cherry"
          onInputValueChange={text}
          name="fruit"
        >
          <Parts />
        </Combobox>
      </form>
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    type(input, 'ap')
    expect(text).toHaveBeenCalledExactlyOnceWith('ap')
    expect(input.value).toBe('Cherry')
    const form = view.container.querySelector('form')!
    const mirror = form.querySelector('select')!
    mirror.value = 'a'
    mirror.dispatchEvent(new Event('change', { bubbles: true }))
    flush()
    expect(mirror.value).toBe('c')
    form.reset()
    await new Promise((resolve) => setTimeout(resolve, 0))
    flush()
    expect(new FormData(form).get('fruit')).toBe('c')
    expect(input.value).toBe('Cherry')
  })

  test('async labels fill an untouched input but do not overwrite an active search', () => {
    const [options, setOptions] = createSignal<typeof items>([])
    const view = render(() => (
      <Combobox items={options()} value="a">
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    expect(input.value).toBe('')
    setOptions(items)
    flush()
    expect(input.value).toBe('Apple')
    type(input, 'cher')
    setOptions(items.map((item) => (item.value === 'a' ? { ...item, label: 'Green apple' } : item)))
    flush()
    expect(input.value).toBe('cher')
  })

  test('a late canceled native reset preserves query and selected form value', async () => {
    const view = render(() => (
      <form>
        <Combobox items={items} defaultValue="a" name="fruit">
          <Parts />
        </Combobox>
      </form>
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    type(input, 'ch')
    press(input, 'ArrowDown')
    press(input, 'Enter')
    const form = view.container.querySelector('form')!
    const cancel = (event: Event) => event.preventDefault()
    window.addEventListener('reset', cancel, { once: true })
    form.reset()
    await new Promise((resolve) => setTimeout(resolve, 0))
    flush()
    expect(input.value).toBe('Cherry')
    expect(new FormData(form).get('fruit')).toBe('c')
  })

  test('typing filters without committing; arrows and Enter retain input focus', async () => {
    const change = vi.fn()
    const view = render(() => (
      <Combobox items={items} onValueChange={change}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    input.focus()
    type(input, 'ap')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect((await view.findAllByRole('option')).map((el) => el.textContent)).toEqual([
      'Apple',
      'Apricot',
    ])
    expect(change).not.toHaveBeenCalled()
    press(input, 'ArrowDown')
    expect(input).toHaveFocus()
    expect(document.getElementById(input.getAttribute('aria-activedescendant')!)).toHaveTextContent(
      'Apple'
    )
    press(input, 'Enter')
    expect(input.value).toBe('Apple')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(change).toHaveBeenCalledExactlyOnceWith('a')
  })
  test('composition never selects; completing composition opens suggestions', () => {
    const change = vi.fn()
    const view = render(() => (
      <Combobox items={items} onValueChange={change}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    type(input, 'ap', true)
    press(input, 'ArrowDown', { isComposing: true })
    press(input, 'Enter', { isComposing: true })
    expect(input).toHaveAttribute('aria-expanded', 'false')
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
    flush()
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(change).not.toHaveBeenCalled()
  })
  test('an open popup keeps its filter and the composing draft until compositionend publishes once', () => {
    const text = vi.fn()
    const view = render(() => (
      <Combobox items={items} defaultOpen defaultValue="a" onInputValueChange={text}>
        <Parts />
      </Combobox>
    ))
    flush()
    const input = view.getByRole('combobox') as HTMLInputElement
    const options = () =>
      [
        ...document
          .getElementById(input.getAttribute('aria-controls')!)!
          .querySelectorAll('[role="option"]:not([hidden])'),
      ].map((option) => option.textContent)
    expect(options()).toEqual(['Apple'])
    type(input, 'Ch', true)
    expect(input.value).toBe('Ch')
    expect(options()).toEqual(['Apple'])
    expect(text).not.toHaveBeenCalled()
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
    flush()
    expect(options()).toEqual(['Cherry'])
    type(input, 'Ch')
    expect(text.mock.calls).toEqual([['Ch']])
  })
  test('a committing insertFromComposition input before compositionend keeps the composed text', () => {
    for (const placement of ['trigger', 'popup'] as const) {
      const text = vi.fn()
      const view = render(() => (
        <Combobox
          items={items}
          defaultOpen
          defaultValue="a"
          inputPlacement={placement}
          onInputValueChange={text}
        >
          <Parts />
        </Combobox>
      ))
      flush()
      const input = view
        .getAllByRole('combobox')
        .find((element): element is HTMLInputElement => element instanceof HTMLInputElement)!
      type(input, 'Ch', true)
      input.dispatchEvent(
        new InputEvent('input', { bubbles: true, inputType: 'insertFromComposition' })
      )
      flush()
      expect(input.value).toBe('Ch')
      expect(text).not.toHaveBeenCalled()
      input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
      flush()
      expect(input.value).toBe('Ch')
      expect(text.mock.calls).toEqual([['Ch']])
      view.unmount()
    }
  })
  test('a committing insertFromComposition input after compositionend restores rejected owner text', () => {
    for (const placement of ['trigger', 'popup'] as const) {
      const text = vi.fn()
      const view = render(() => (
        <Combobox
          items={items}
          defaultOpen
          inputValue="Apple"
          inputPlacement={placement}
          onInputValueChange={text}
        >
          <Parts />
        </Combobox>
      ))
      flush()
      const input = view
        .getAllByRole('combobox')
        .find((element): element is HTMLInputElement => element instanceof HTMLInputElement)!
      type(input, 'Ch', true)
      input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
      flush()
      expect(input.value).toBe('Apple')
      input.value = 'Ch'
      input.dispatchEvent(
        new InputEvent('input', { bubbles: true, inputType: 'insertFromComposition' })
      )
      flush()
      expect(input.value).toBe('Apple')
      expect(text.mock.calls).toEqual([['Ch']])
      view.unmount()
    }
  })
  test('a rejected controlled query restores owner text once composition ends', () => {
    const text = vi.fn()
    const view = render(() => (
      <Combobox items={items} inputValue="" onInputValueChange={text}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    type(input, 'Ch', true)
    expect(input.value).toBe('Ch')
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
    flush()
    expect(input.value).toBe('')
    expect(text.mock.calls).toEqual([['Ch']])
  })
  test('default query is preserved and controlled value updates synchronize its label', () => {
    const [value, setValue] = createSignal<string | undefined>()
    const view = render(() => (
      <Combobox items={items} value={value()} defaultInputValue="ap">
        <Parts />
      </Combobox>
    ))
    flush()
    const input = view.getByRole('combobox') as HTMLInputElement
    expect(input.value).toBe('ap')
    setValue('c')
    flush()
    expect(input.value).toBe('Cherry')
  })
  test('native submission uses committed values, required ignores query, and reset is silent', async () => {
    const change = vi.fn()
    const view = render(() => (
      <form>
        <Combobox items={items} name="fruit" required onValueChange={change}>
          <Parts />
        </Combobox>
      </form>
    ))
    const form = view.container.querySelector('form')!
    const input = view.getByRole('combobox') as HTMLInputElement
    type(input, 'not selected')
    expect(form.checkValidity()).toBe(false)
    expect(input).toHaveFocus()
    type(input, 'ch')
    press(input, 'ArrowDown')
    press(input, 'Enter')
    expect(new FormData(form).get('fruit')).toBe('c')
    type(input, '')
    expect(form.checkValidity()).toBe(true)
    form.reset()
    await new Promise((resolve) => setTimeout(resolve, 0))
    flush()
    expect(input.value).toBe('')
    expect(new FormData(form).get('fruit')).toBe('')
    expect(change).toHaveBeenCalledTimes(1)
  })
  test('Field names and descriptions reach the input and group flags prevent opening', () => {
    const view = render(() => (
      <Field disabled required invalid>
        <Field.Label>Fruit</Field.Label>
        <Field.Description>Pick one</Field.Description>
        <Field.Error>Required</Field.Error>
        <Combobox items={items}>
          <Combobox.Input />
          <Combobox.Positioner>
            <Combobox.Content />
          </Combobox.Positioner>
        </Combobox>
      </Field>
    ))
    flush()
    const input = view.getByRole('combobox', { name: 'Fruit' })
    expect(input).toBeDisabled()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const descriptions = input
      .getAttribute('aria-describedby')!
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent)
    expect(descriptions).toEqual(['Pick one', 'Required'])
    press(input, 'ArrowDown')
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })
  test('author cancellation suppresses opening and custom option IDs resolve active descendants', () => {
    const view = render(() => (
      <Combobox items={items}>
        <Combobox.Input
          aria-label="Fruit"
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp') event.preventDefault()
          }}
        />
        <Combobox.Positioner>
          <Combobox.Content id="custom-list">
            <Combobox.Item value="a" id="custom-apple">
              Apple
            </Combobox.Item>
          </Combobox.Content>
        </Combobox.Positioner>
      </Combobox>
    ))
    const input = view.getByRole('combobox')
    press(input, 'ArrowUp')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    press(input, 'ArrowDown')
    expect(input).toHaveAttribute('aria-controls', 'custom-list')
    expect(input).toHaveAttribute('aria-activedescendant', 'custom-apple')
    expect(press(input, 'Tab').defaultPrevented).toBe(false)
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })
})

test('arrow forwards its measured element to the author ref', () => {
  const ref = vi.fn()
  render(() => (
    <Combobox items={[{ value: 'a', label: 'Apple' }]} defaultOpen>
      <Combobox.Input aria-label="Fruit" />
      <Combobox.Positioner>
        <Combobox.Content />
        <Combobox.Arrow ref={ref} />
      </Combobox.Positioner>
    </Combobox>
  ))
  flush()
  expect(ref).toHaveBeenCalledTimes(1)
  expect(ref.mock.calls[0]![0]).toBeInstanceOf(HTMLDivElement)
  expect(ref.mock.calls[0]![0]).toHaveAttribute('data-part', 'arrow')
})

test('Combobox Portal and Viewport preserve input focus, listbox semantics, and form reset', async () => {
  const mount = document.createElement('div')
  document.body.append(mount)
  let viewport: HTMLDivElement | undefined
  const scrolled = vi.fn()
  const change = vi.fn()
  const view = render(() => (
    <form>
      <Combobox items={items} name="fruit" required onValueChange={change}>
        <Combobox.Input aria-label="Portaled fruit" />
        <Combobox.Portal container={mount}>
          <Combobox.Positioner>
            <Combobox.Content>
              <Combobox.Viewport
                ref={(el) => {
                  viewport = el
                }}
                role="presentation"
                onScroll={scrolled}
              >
                <Combobox.Item value="a">Apple</Combobox.Item>
                <Combobox.Item value="c">Cherry</Combobox.Item>
              </Combobox.Viewport>
            </Combobox.Content>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox>
    </form>
  ))
  try {
    const form = view.container.querySelector('form')!
    const input = view.getByRole('combobox') as HTMLInputElement
    const native = form.querySelector('select')!
    expect(native.form).toBe(form)
    expect(form.checkValidity()).toBe(false)
    input.focus()
    type(input, 'ch')
    const listbox = mount.querySelector('[role="listbox"]')!
    expect(listbox).not.toBeNull()
    expect(viewport?.parentElement).toBe(listbox)
    expect(viewport).toHaveAttribute('data-state', 'open')
    expect(viewport).toHaveAttribute('role', 'presentation')
    expect(viewport).not.toHaveAttribute('tabindex')
    viewport!.dispatchEvent(new Event('scroll'))
    expect(scrolled).toHaveBeenCalledOnce()
    expect(mount.querySelector('select')).toBeNull()
    expect(input).toHaveFocus()
    press(input, 'ArrowDown')
    press(input, 'Enter')
    expect(new FormData(form).get('fruit')).toBe('c')
    expect(form.checkValidity()).toBe(true)
    form.reset()
    await new Promise((resolve) => setTimeout(resolve, 0))
    flush()
    expect(input.value).toBe('')
    expect(new FormData(form).get('fruit')).toBe('')
    expect(form.checkValidity()).toBe(false)
    expect(change).toHaveBeenCalledTimes(1)
  } finally {
    view.unmount()
    mount.remove()
  }
})
