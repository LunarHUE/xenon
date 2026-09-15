/**
 * Browser-native number-field regressions.
 *
 * The shared jsdom suite dispatches constructed input and keyboard events, so it
 * cannot observe the platform's own enforcement of `readonly`, real keystroke
 * ordering, implicit form submission or native reset ownership. This file drives
 * the real browser input path for those and for locale-aware editing. OS
 * clipboard access, IME composition and touch gestures are not claimed here: the
 * atomic insertion case uses the browser's own value assignment plus `input`
 * event, the same single-edit shape a paste produces.
 */
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { NumberField } from '@xenon/solid/number-field'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

/** Fixture disposers, unwound in reverse order after every test. */
const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})
/** Render into the body, register disposal, and expose scoped queries. */
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return { container, ...within(container) }
}
/** Flush Solid, then let native default actions and reset reconciliation run. */
async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 0))
  flush()
}

describe('number field native interaction in a browser', () => {
  test('number-field.roles.14: a readonly field rejects native typing and stepper presses', async () => {
    const change = vi.fn()
    const commit = vi.fn()
    const m = mount(() => (
      <form onSubmit={(event) => event.preventDefault()}>
        <NumberField readonly value={2} name="amount" onValueChange={change} onValueCommit={commit}>
          <NumberField.Input aria-label="Amount" />
          <NumberField.IncrementTrigger>+</NumberField.IncrementTrigger>
          <NumberField.DecrementTrigger>-</NumberField.DecrementTrigger>
        </NumberField>
      </form>
    ))
    const input = m.getByRole('spinbutton') as HTMLInputElement
    const form = m.container.querySelector('form')!
    const increase = m.getByRole('button', { name: 'Increase' })
    const decrease = m.getByRole('button', { name: 'Decrease' })
    // Readonly is native, never the disabling attribute: the controls stay discoverable.
    expect(input.readOnly).toBe(true)
    expect(input.disabled).toBe(false)
    expect(increase).toHaveAttribute('aria-disabled', 'true')
    expect(increase).not.toHaveAttribute('disabled')
    expect(increase).not.toHaveAttribute('aria-readonly')
    expect(decrease).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(input)
    await userEvent.keyboard('99')
    await settle()
    expect(input).toHaveValue('2')
    // aria-disabled alone does not block a real click; the component must ignore it.
    await userEvent.click(increase, { force: true })
    await userEvent.click(decrease, { force: true })
    await settle()
    expect(input).toHaveValue('2')
    expect(change).not.toHaveBeenCalled()
    expect(commit).not.toHaveBeenCalled()
    expect(new FormData(form).get('amount')).toBe('2')
  })

  test('a consumer-canceled beforeinput prevents native text edits', async () => {
    const change = vi.fn()
    const m = mount(() => (
      <form onSubmit={(event) => event.preventDefault()}>
        <NumberField defaultValue={3} name="amount" onValueChange={change}>
          <NumberField.Input
            aria-label="Amount"
            onBeforeInput={(event) => event.preventDefault()}
          />
        </NumberField>
      </form>
    ))
    const input = m.getByRole('spinbutton') as HTMLInputElement
    const form = m.container.querySelector('form')!
    await userEvent.click(input)
    await userEvent.keyboard('{End}99')
    await settle()
    // Each canceled keystroke leaves neither text nor value behind.
    expect(input).toHaveValue('3')
    expect(new FormData(form).get('amount')).toBe('3')
    expect(change).not.toHaveBeenCalled()
  })

  test('a consumer-canceled Enter keeps the draft and the next blur commits it once', async () => {
    const change = vi.fn()
    const commit = vi.fn()
    const m = mount(() => (
      <form onSubmit={(event) => event.preventDefault()}>
        <NumberField defaultValue={3} name="amount" onValueChange={change} onValueCommit={commit}>
          <NumberField.Input
            aria-label="Amount"
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault()
            }}
          />
        </NumberField>
        <button type="button">Outside</button>
      </form>
    ))
    const input = m.getByRole('spinbutton') as HTMLInputElement
    const form = m.container.querySelector('form')!
    await userEvent.click(input)
    await userEvent.keyboard('{End}9')
    await settle()
    expect(input).toHaveValue('39')
    await userEvent.keyboard('{Enter}')
    await settle()
    // A canceled Enter neither parses nor reformats, and the draft is still editable.
    expect(input).toHaveValue('39')
    expect(new FormData(form).get('amount')).toBe('3')
    expect(change).not.toHaveBeenCalled()
    await userEvent.click(m.getByRole('button', { name: 'Outside' }))
    await settle()
    expect(input).toHaveValue('39')
    expect(new FormData(form).get('amount')).toBe('39')
    expect(change).toHaveBeenCalledExactlyOnceWith(39)
    expect(commit).toHaveBeenCalledExactlyOnceWith(39)
  })

  test('number-field.keyboard.8: Enter commits, keeps native submission, and a later blur commits nothing', async () => {
    const change = vi.fn()
    const commit = vi.fn()
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
    const m = mount(() => (
      <form onSubmit={submit}>
        <NumberField name="quantity" onValueChange={change} onValueCommit={commit}>
          <NumberField.Input aria-label="Quantity" />
        </NumberField>
        <button type="submit">Save</button>
        <button type="button">Outside</button>
      </form>
    ))
    const input = m.getByRole('spinbutton') as HTMLInputElement
    const form = m.container.querySelector('form')!
    await userEvent.click(input)
    await userEvent.keyboard('3.')
    await settle()
    expect(input).toHaveValue('3.')
    await userEvent.keyboard('{Enter}')
    await settle()
    // Enter parses the draft and reformats it in place, without swallowing submission.
    expect(input).toHaveValue('3')
    expect(new FormData(form).get('quantity')).toBe('3')
    expect(submit).toHaveBeenCalledTimes(1)
    expect(change).toHaveBeenCalledExactlyOnceWith(3)
    expect(commit).toHaveBeenCalledExactlyOnceWith(3)
    await userEvent.click(m.getByRole('button', { name: 'Outside' }))
    await settle()
    // The blur after a commit has no draft left, so it reports nothing.
    expect(input).toHaveValue('3')
    expect(change).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledTimes(1)
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowUp}')
    await settle()
    expect(input).toHaveValue('4')
    expect(change.mock.calls).toEqual([[3], [4]])
    expect(commit.mock.calls).toEqual([[3], [4]])
  })

  test('number-field.rtl.4: locale digits and the group separator typed key by key commit the formatted value', async () => {
    const change = vi.fn()
    const m = mount(() => (
      <form onSubmit={(event) => event.preventDefault()}>
        <NumberField locale="de-DE" name="amount" onValueChange={change}>
          <NumberField.Input aria-label="Amount" />
        </NumberField>
      </form>
    ))
    const input = m.getByRole('spinbutton') as HTMLInputElement
    const form = m.container.querySelector('form')!
    await userEvent.click(input)
    await userEvent.keyboard('1.234,5')
    await settle()
    // The de-DE group separator is accepted and every partial keystroke is echoed.
    expect(input).toHaveValue('1.234,5')
    expect(change).not.toHaveBeenCalled()
    await userEvent.keyboard('{Enter}')
    await settle()
    expect(input).toHaveValue('1.234,5')
    expect(new FormData(form).get('amount')).toBe('1234.5')
    expect(change).toHaveBeenCalledExactlyOnceWith(1234.5)
  })

  test('an atomically inserted grouped value is parsed with the field locale and an ambiguous one is rejected', async () => {
    const change = vi.fn()
    const m = mount(() => (
      <form onSubmit={(event) => event.preventDefault()}>
        <NumberField defaultValue={7} name="amount" onValueChange={change}>
          <NumberField.Input aria-label="Amount" />
        </NumberField>
      </form>
    ))
    const input = m.getByRole('spinbutton') as HTMLInputElement
    const form = m.container.querySelector('form')!
    // A paste arrives as one atomic edit; the OS clipboard itself is not exercised.
    await userEvent.fill(input, '1,000')
    await settle()
    expect(input).toHaveValue('1,000')
    await userEvent.keyboard('{Enter}')
    await settle()
    // en-US reads the comma as grouping, so the submitted entry is the plain number.
    expect(input).toHaveValue('1,000')
    expect(new FormData(form).get('amount')).toBe('1000')
    expect(change).toHaveBeenCalledExactlyOnceWith(1000)
    await userEvent.fill(input, '3.000.000,25')
    await userEvent.keyboard('{Enter}')
    await settle()
    // The ambiguous string does not parse, so it is discarded and nothing is reported.
    expect(input).toHaveValue('1,000')
    expect(new FormData(form).get('amount')).toBe('1000')
    expect(change).toHaveBeenCalledTimes(1)
  })

  test('number-field.forms.3: an external form owner takes the entry and only its own reset', async () => {
    const change = vi.fn()
    const [owner, setOwner] = createSignal('primary')
    const m = mount(() => (
      <>
        <form id="primary" onSubmit={(event) => event.preventDefault()} />
        <form id="ancestor" onSubmit={(event) => event.preventDefault()}>
          <NumberField form={owner()} defaultValue={2} name="amount" onValueChange={change}>
            <NumberField.Input aria-label="Amount" />
          </NumberField>
        </form>
        <form id="secondary" onSubmit={(event) => event.preventDefault()} />
      </>
    ))
    const input = m.getByRole('spinbutton') as HTMLInputElement
    const forms = m.container.querySelectorAll('form')
    const primary = forms[0]!
    const ancestor = forms[1]!
    const secondary = forms[2]!
    expect(input).toHaveValue('2')
    // The named form owns the entry even though the field is nested in another form.
    expect(new FormData(primary).get('amount')).toBe('2')
    expect(new FormData(ancestor).get('amount')).toBeNull()
    await userEvent.fill(input, '7')
    await userEvent.keyboard('{Enter}')
    await settle()
    expect(input).toHaveValue('7')
    expect(new FormData(primary).get('amount')).toBe('7')
    // A non-owning form's reset is ignored.
    ancestor.reset()
    await settle()
    expect(input).toHaveValue('7')
    expect(new FormData(primary).get('amount')).toBe('7')
    // Reassigning the owner moves both the entry and which reset restores the default.
    setOwner('secondary')
    await settle()
    expect(new FormData(secondary).get('amount')).toBe('7')
    primary.reset()
    await settle()
    expect(input).toHaveValue('7')
    secondary.reset()
    await settle()
    expect(input).toHaveValue('2')
    expect(new FormData(secondary).get('amount')).toBe('2')
    // The native reset restores the default silently.
    expect(change).toHaveBeenCalledExactlyOnceWith(7)
  })

  test('number-field.keyboard.10: an off-grid seed climbs from the minimum and clamps onto the maximum', async () => {
    const change = vi.fn()
    const m = mount(() => (
      <NumberField min={2} max={10} step={3} onValueChange={change}>
        <NumberField.Input aria-label="Amount" />
        <NumberField.IncrementTrigger>+</NumberField.IncrementTrigger>
      </NumberField>
    ))
    const input = m.getByRole('spinbutton') as HTMLInputElement
    const increase = m.getByRole('button', { name: 'Increase' })
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowUp}')
    await settle()
    // The first step seeds on the minimum, not on minimum plus step.
    expect(input).toHaveValue('2')
    await userEvent.keyboard('{ArrowUp}')
    await settle()
    expect(input).toHaveValue('5')
    await userEvent.keyboard('{ArrowUp}')
    await settle()
    expect(input).toHaveValue('8')
    await userEvent.keyboard('{ArrowUp}')
    await settle()
    // The unaligned maximum is reachable by clamping, which then disables the stepper.
    expect(input).toHaveValue('10')
    expect(increase).toHaveAttribute('aria-disabled', 'true')
    expect(increase).not.toHaveAttribute('disabled')
    await userEvent.click(increase, { force: true })
    await settle()
    expect(input).toHaveValue('10')
    // The real click moved focus to the button, so return to the input for the key cases.
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    expect(input).toHaveValue('8')
    await userEvent.keyboard('{End}')
    await settle()
    expect(input).toHaveValue('10')
    await userEvent.keyboard('{Home}')
    await settle()
    expect(input).toHaveValue('2')
    expect(change.mock.calls).toEqual([[2], [5], [8], [10], [8], [10], [2]])
  })
})
