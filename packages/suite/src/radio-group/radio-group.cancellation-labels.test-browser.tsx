import { RadioGroup } from '@xenon-ui/solid'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, Show, flush } from 'solid-js'
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

test('radio-group.pointer.2: canceled native activation cannot restore a previously selected radio removed by the author', async () => {
  const [shown, setShown] = createSignal(true)
  const change = vi.fn()
  const view = mount(() => (
    <form>
      <RadioGroup name="choice" defaultValue="a" onValueChange={change} aria-label="Choice">
        <Show when={shown()}>
          <RadioGroup.Item value="a" aria-label="Alpha" />
        </Show>
        <RadioGroup.Item
          value="b"
          aria-label="Beta"
          onClick={(event) => {
            event.preventDefault()
            setShown(false)
            flush()
          }}
        />
      </RadioGroup>
    </form>
  ))
  const alpha = view.getByRole('radio', { name: 'Alpha' })
  const beta = view.getByRole('radio', { name: 'Beta' }) as HTMLInputElement
  expect(alpha).toBeChecked()
  await userEvent.click(beta)
  await settle()
  expect(alpha.isConnected).toBe(false)
  expect(beta).not.toBeChecked()
  expect(new FormData(view.container.querySelector('form')!).getAll('choice')).toEqual([])
  expect(change).not.toHaveBeenCalled()
})

for (const labelKind of ['explicit', 'wrapping'] as const) {
  test(`radio-group.pointer.5: ${labelKind} labels remain inert while group disabled and activate after reenable`, async () => {
    const [disabled, setDisabled] = createSignal(true)
    const change = vi.fn()
    const view = mount(() => (
      <form>
        <RadioGroup name="choice" disabled={disabled()} onValueChange={change} aria-label="Choice">
          {labelKind === 'explicit' ? (
            <>
              <label for="radio-disabled-label">Beta label</label>
              <RadioGroup.Item id="radio-disabled-label" value="b" aria-label="Beta" />
            </>
          ) : (
            <label>
              Beta label
              <RadioGroup.Item value="b" aria-label="Beta" />
            </label>
          )}
        </RadioGroup>
      </form>
    ))
    const beta = view.getByRole('radio', { name: 'Beta' })
    const label = view.getByText('Beta label')
    await userEvent.click(label, { force: true })
    await settle()
    expect(beta).not.toBeChecked()
    expect(change).not.toHaveBeenCalled()
    expect(new FormData(view.container.querySelector('form')!).getAll('choice')).toEqual([])
    setDisabled(false)
    await settle()
    await userEvent.click(label)
    await settle()
    expect(beta).toBeChecked()
    expect(beta).toHaveFocus()
    expect(change.mock.calls).toEqual([['b']])
    expect(new FormData(view.container.querySelector('form')!).getAll('choice')).toEqual(['b'])
  })
}
