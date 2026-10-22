import { render } from '@solidjs/web'
import { Slider } from '@xenon-ui/solid/slider'
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
  const [value, setValue] = createSignal([20, 60])
  const changed = vi.fn()
  const committed = vi.fn()
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(
    () => (
      <form>
        <Slider
          name="range"
          defaultValue={[20, 60]}
          value={controlled ? value() : undefined}
          readonly={readonly()}
          disabled={disabled()}
          onValueChange={changed}
          onValueCommit={committed}
        >
          <Slider.Control>
            <Slider.Track />
            <Slider.Range />
            <Slider.Thumb index={0} aria-label="Lower" />
            <Slider.Thumb index={1} aria-label="Upper" />
          </Slider.Control>
        </Slider>
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
    thumbs: [...host.querySelectorAll('input')],
    form: host.querySelector('form')!,
    changed,
    committed,
    setReadonly,
    setDisabled,
    setValue,
  }
}

test('rejected controlled arrow gestures repeat the same proposal and commit payload', async () => {
  const m = mount(true)
  m.thumbs[0]!.focus()
  for (let attempt = 0; attempt < 2; attempt++) {
    await userEvent.keyboard('{ArrowRight}')
    await settle()
    expect(m.thumbs[0]).toHaveValue('20')
    expect(m.thumbs[0]).toHaveAttribute('aria-valuenow', '20')
    expect(new FormData(m.form).getAll('range')).toEqual(['20', '60'])
  }
  expect(m.changed.mock.calls).toEqual([[[21, 60]], [[21, 60]]])
  expect(m.committed.mock.calls).toEqual(m.changed.mock.calls)
  await userEvent.click(m.q.getByRole('button', { name: 'Outside' }))
  expect(m.committed).toHaveBeenCalledTimes(2)
})

test('an external range becomes the keyboard base after a rejected gesture', async () => {
  const m = mount(true)
  m.thumbs[1]!.focus()
  await userEvent.keyboard('{ArrowLeft}')
  m.setValue([30, 80])
  await settle()
  expect(m.thumbs[1]).toHaveValue('80')
  await userEvent.keyboard('{ArrowLeft}')
  expect(m.changed.mock.calls).toEqual([[[20, 59]], [[30, 79]]])
  expect(m.committed.mock.calls).toEqual(m.changed.mock.calls)
})

test('readonly applied to a focused thumb suppresses mutation and resumes keyboard stepping', async () => {
  const m = mount()
  m.thumbs[0]!.focus()
  m.setReadonly(true)
  await settle()
  await userEvent.keyboard('{ArrowRight}{Home}{End}{PageUp}{PageDown}')
  expect(m.thumbs[0]).toHaveValue('20')
  expect(m.changed).not.toHaveBeenCalled()
  expect(m.committed).not.toHaveBeenCalled()
  expect(new FormData(m.form).getAll('range')).toEqual(['20', '60'])
  m.setReadonly(false)
  await settle()
  m.thumbs[0]!.focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(m.changed).toHaveBeenCalledExactlyOnceWith([21, 60])
  expect(m.committed).toHaveBeenCalledExactlyOnceWith([21, 60])
})

test('disabled transitions remove both form entries and blur the thumb before re-enabling', async () => {
  const m = mount()
  m.thumbs[0]!.focus()
  m.setDisabled(true)
  await settle()
  expect(m.thumbs[0]).not.toHaveFocus()
  expect(new FormData(m.form).getAll('range')).toEqual([])
  m.setDisabled(false)
  await settle()
  expect(new FormData(m.form).getAll('range')).toEqual(['20', '60'])
  m.thumbs[1]!.focus()
  await userEvent.keyboard('{ArrowLeft}')
  expect(m.changed).toHaveBeenCalledExactlyOnceWith([20, 59])
})

test('a canceled reset preserves the changed range and an allowed reset supplies the next keyboard base', async () => {
  const m = mount()
  m.thumbs[0]!.focus()
  await userEvent.keyboard('{ArrowRight}')
  m.changed.mockClear()
  m.committed.mockClear()
  m.form.addEventListener('reset', (event) => event.preventDefault(), { once: true })
  await userEvent.click(m.q.getByRole('button', { name: 'Reset' }))
  await settle()
  expect(new FormData(m.form).getAll('range')).toEqual(['21', '60'])
  await userEvent.click(m.q.getByRole('button', { name: 'Reset' }))
  await settle()
  expect(new FormData(m.form).getAll('range')).toEqual(['20', '60'])
  expect(m.changed).not.toHaveBeenCalled()
  expect(m.committed).not.toHaveBeenCalled()
  m.thumbs[0]!.focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(m.changed).toHaveBeenCalledExactlyOnceWith([21, 60])
  expect(m.committed).toHaveBeenCalledExactlyOnceWith([21, 60])
})
