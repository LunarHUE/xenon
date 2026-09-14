import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, test, vi } from 'vitest'
import { Slider } from './slider'
import { Field } from '../field/field'

const settle = async () => {
  flush()
  await Promise.resolve()
  flush()
}

test('stable range inputs clamp neighboring keys and commit once on release', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const m = render(() => (
    <Slider
      defaultValue={[20, 60]}
      step={2}
      minStepsBetweenThumbs={2}
      onValueChange={change}
      onValueCommit={commit}
    >
      <Slider.Label>Budget</Slider.Label>
      <Slider.Control>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb index={0} aria-label="Minimum" />
        <Slider.Thumb index={1} aria-label="Maximum" />
      </Slider.Control>
      <Slider.ValueText />
    </Slider>
  ))
  await settle()
  const inputs = m.getAllByRole('slider') as HTMLInputElement[]
  fireEvent.keyDown(inputs[0]!, { key: 'End' })
  await settle()
  expect(change).toHaveBeenLastCalledWith([56, 60])
  expect(inputs[0]!.value).toBe('56')
  expect(commit).not.toHaveBeenCalled()
  fireEvent.keyUp(inputs[0]!, { key: 'End' })
  fireEvent.blur(inputs[0]!)
  expect(commit).toHaveBeenCalledExactlyOnceWith([56, 60])
  expect(m.getAllByRole('slider')[0]).toBe(inputs[0])
  expect(m.getByRole('status')).toHaveTextContent('56 – 60')
})
test('controlled native input mutation is repaired and read-only requests are ignored', async () => {
  const change = vi.fn()
  const [readonly, setReadonly] = createSignal(false)
  const m = render(() => (
    <Slider value={[20]} readonly={readonly()} onValueChange={change}>
      <Slider.Thumb aria-label="Volume" />
    </Slider>
  ))
  await settle()
  const input = m.getByRole('slider') as HTMLInputElement
  fireEvent.input(input, { target: { value: '80' }, cancelable: true })
  await settle()
  expect(change).toHaveBeenCalledExactlyOnceWith([80])
  expect(input.value).toBe('20')
  setReadonly(true)
  await settle()
  fireEvent.input(input, { target: { value: '90' } })
  await settle()
  expect(input.value).toBe('20')
  expect(change).toHaveBeenCalledTimes(1)
})
test('native form entries reset silently and honor cancellation', async () => {
  const change = vi.fn()
  const m = render(() => (
    <form>
      <Slider name="range" defaultValue={[20, 60]} onValueChange={change}>
        <Slider.Thumb index={0} aria-label="Minimum" />
        <Slider.Thumb index={1} aria-label="Maximum" />
      </Slider>
    </form>
  ))
  await settle()
  const form = m.container.querySelector('form')!
  const input = m.getAllByRole('slider')[0] as HTMLInputElement
  fireEvent.keyDown(input, { key: 'ArrowRight' })
  await settle()
  expect(new FormData(form).getAll('range')).toEqual(['21', '60'])
  form.reset()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await settle()
  expect(new FormData(form).getAll('range')).toEqual(['20', '60'])
  expect(change).toHaveBeenCalledTimes(1)
})
test('inherits Field naming, descriptions, and blocking flags', async () => {
  const m = render(() => (
    <Field disabled name="volume">
      <Field.Label>Volume</Field.Label>
      <Slider defaultValue={[20]}>
        <Slider.Thumb />
      </Slider>
      <Field.Description>Choose volume</Field.Description>
    </Field>
  ))
  await settle()
  const input = m.getByRole('slider', { name: 'Volume' })
  expect(input).toBeDisabled()
  expect(input).toHaveAccessibleDescription('Choose volume')
  expect(input).toHaveAttribute('name', 'volume')
})
test('author key cancellation suppresses stepping', async () => {
  const change = vi.fn()
  const key = vi.fn((event: KeyboardEvent) => event.preventDefault())
  const m = render(() => (
    <Slider defaultValue={[20]} onValueChange={change}>
      <Slider.Thumb aria-label="Volume" onKeyDown={key} />
    </Slider>
  ))
  await settle()
  fireEvent.keyDown(m.getByRole('slider'), { key: 'ArrowRight' })
  expect(key).toHaveBeenCalledOnce()
  expect(change).not.toHaveBeenCalled()
})

test('canceled native input mutations are repaired without callbacks', async () => {
  const change = vi.fn()
  const m = render(() => (
    <Slider defaultValue={[20]} onValueChange={change}>
      <Slider.Thumb aria-label="Volume" onInput={(event) => event.preventDefault()} />
    </Slider>
  ))
  const input = m.getByRole('slider') as HTMLInputElement
  fireEvent.input(input, { target: { value: '80' }, cancelable: true })
  await settle()
  expect(input.value).toBe('20')
  expect(change).not.toHaveBeenCalled()
})
test('external form reset honors late cancellation and controlled values', async () => {
  const m = render(() => (
    <>
      <form id="slider-form" />
      <Slider form="slider-form" name="volume" defaultValue={[20]}>
        <Slider.Thumb aria-label="Volume" />
      </Slider>
    </>
  ))
  await settle()
  const form = m.container.querySelector('form')!
  const input = m.getByRole('slider') as HTMLInputElement
  fireEvent.keyDown(input, { key: 'ArrowRight' })
  await settle()
  const cancel = (event: Event) => event.preventDefault()
  document.addEventListener('reset', cancel)
  form.reset()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await settle()
  expect(input.value).toBe('21')
  document.removeEventListener('reset', cancel)
  form.reset()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await settle()
  expect(input.value).toBe('20')
  expect(new FormData(form).get('volume')).toBe('20')
})
test('format is opt-in and disabled state updates native semantics', async () => {
  const [disabled, setDisabled] = createSignal(false)
  const m = render(() => (
    <Slider defaultValue={[20]} disabled={disabled()} format={(value) => `$${value}`}>
      <Slider.Thumb aria-label="Price" />
      <Slider.ValueText />
    </Slider>
  ))
  await settle()
  const input = m.getByRole('slider')
  input.focus()
  expect(input).toHaveAttribute('aria-valuetext', '$20')
  expect(m.getByRole('status')).toHaveTextContent('$20')
  setDisabled(true)
  await settle()
  expect(input).toBeDisabled()
  expect(input).toHaveAttribute('aria-disabled', 'true')
})

test('changing external form ownership moves entries and controlled reset stays authoritative', async () => {
  const [formId, setFormId] = createSignal('slider-a')
  const [value, setValue] = createSignal<readonly number[]>([20])
  const m = render(() => (
    <>
      <form id="slider-a" />
      <form id="slider-b" />
      <Slider form={formId()} name="volume" value={value()} defaultValue={[10]}>
        <Slider.Thumb aria-label="Volume" />
      </Slider>
    </>
  ))
  await settle()
  const a = m.container.querySelector<HTMLFormElement>('#slider-a')!
  const b = m.container.querySelector<HTMLFormElement>('#slider-b')!
  expect(new FormData(a).get('volume')).toBe('20')
  setFormId('slider-b')
  setValue([40])
  await settle()
  expect(new FormData(a).has('volume')).toBe(false)
  expect(new FormData(b).get('volume')).toBe('40')
  b.reset()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await settle()
  expect(new FormData(b).get('volume')).toBe('40')
})
