import { render } from '@solidjs/web'
import { NumberField } from '@xenon-ui/solid/number-field'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

let cleanup: (() => void) | undefined
afterEach(() => {
  cleanup?.()
  flush()
})
async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}
function mount(controlled = false) {
  const [readonly, setReadonly] = createSignal(false)
  const [disabled, setDisabled] = createSignal(false)
  const changed = vi.fn()
  const committed = vi.fn()
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(
    () => (
      <form onSubmit={(event) => event.preventDefault()}>
        <NumberField
          name="amount"
          defaultValue={2}
          value={controlled ? 2 : undefined}
          readonly={readonly()}
          disabled={disabled()}
          onValueChange={changed}
          onValueCommit={committed}
        >
          <NumberField.Input aria-label="Amount" />
          <NumberField.IncrementTrigger>Increase</NumberField.IncrementTrigger>
        </NumberField>
        <button type="reset">Reset</button>
        <button type="button">Outside</button>
      </form>
    ),
    host
  )
  cleanup = () => {
    dispose()
    host.remove()
  }
  flush()
  return {
    q: within(host),
    input: host.querySelector<HTMLInputElement>('[role="spinbutton"]')!,
    form: host.querySelector('form')!,
    changed,
    committed,
    setReadonly,
    setDisabled,
  }
}

test('controlled rejected stepping advances the local draft while canonical submission remains authored', async () => {
  const m = mount(true)
  await userEvent.click(m.input)
  await userEvent.keyboard('{ArrowUp}{ArrowUp}')
  expect(m.input).toHaveValue('4')
  expect(m.changed.mock.calls).toEqual([[3], [4]])
  expect(m.committed.mock.calls).toEqual([[3], [4]])
  expect(new FormData(m.form).get('amount')).toBe('2')
  // Isolate reset from blur, which can propose the rejected controlled draft again.
  m.form.reset()
  await settle()
  expect(m.input).toHaveValue('2')
  expect(m.changed).toHaveBeenCalledTimes(2)
  expect(m.committed).toHaveBeenCalledTimes(2)
})

test('leaving a rejected controlled step proposes the current draft again before a reset click', async () => {
  const m = mount(true)
  await userEvent.click(m.input)
  await userEvent.keyboard('{ArrowUp}{ArrowUp}')
  await userEvent.click(m.q.getByRole('button', { name: 'Reset' }))
  await settle()
  expect(m.input).toHaveValue('2')
  expect(new FormData(m.form).get('amount')).toBe('2')
  expect(m.changed.mock.calls).toEqual([[3], [4], [4]])
  expect(m.committed.mock.calls).toEqual([[3], [4], [4]])
})

test('readonly introduced during a draft defers Enter until editing is allowed again', async () => {
  const m = mount()
  await userEvent.fill(m.input, '12.')
  m.setReadonly(true)
  await settle()
  await userEvent.click(m.input)
  await userEvent.keyboard('{Enter}{ArrowUp}')
  expect(m.input).toHaveValue('12.')
  expect(new FormData(m.form).get('amount')).toBe('2')
  expect(m.changed).not.toHaveBeenCalled()
  m.setReadonly(false)
  await settle()
  await userEvent.keyboard('{Enter}')
  expect(m.input).toHaveValue('12')
  expect(m.changed).toHaveBeenCalledExactlyOnceWith(12)
  expect(m.committed).toHaveBeenCalledExactlyOnceWith(12)
})

test('disabled draft survives exclusion from submission and resumes when enabled', async () => {
  const m = mount()
  await userEvent.fill(m.input, '8.')
  m.setDisabled(true)
  await settle()
  expect(m.input).toBeDisabled()
  expect(new FormData(m.form).has('amount')).toBe(false)
  m.setDisabled(false)
  await settle()
  expect(m.input).toHaveValue('8.')
  expect(new FormData(m.form).get('amount')).toBe('2')
  await userEvent.click(m.input)
  await userEvent.keyboard('{Enter}')
  expect(m.changed).toHaveBeenCalledExactlyOnceWith(8)
})

test('a canceled reset keeps an incomplete draft and a later reset clears it without a commit', async () => {
  const m = mount()
  await userEvent.fill(m.input, '-')
  m.form.addEventListener('reset', (event) => event.preventDefault(), { once: true })
  // Keep focus on the draft so blur does not repair it before reset runs.
  m.form.reset()
  await settle()
  expect(m.input).toHaveValue('-')
  expect(new FormData(m.form).get('amount')).toBe('2')
  m.form.reset()
  await settle()
  expect(m.input).toHaveValue('2')
  expect(m.input).not.toHaveAttribute('aria-invalid')
  expect(m.changed).not.toHaveBeenCalled()
  expect(m.committed).not.toHaveBeenCalled()
  await userEvent.keyboard('{ArrowUp}')
  expect(m.changed).toHaveBeenCalledExactlyOnceWith(3)
})

test('a reset while readonly clears a draft without emitting a deferred commit on unlock', async () => {
  const m = mount()
  await userEvent.fill(m.input, '19')
  m.setReadonly(true)
  await settle()
  m.form.reset()
  await settle()
  expect(m.input).toHaveValue('2')
  m.setReadonly(false)
  await settle()
  await userEvent.click(m.q.getByRole('button', { name: 'Outside' }))
  expect(m.changed).not.toHaveBeenCalled()
  expect(m.committed).not.toHaveBeenCalled()
})
