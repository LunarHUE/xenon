import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'
import { CheckboxGroup } from './checkbox-group'
import { Checkbox } from '../checkbox/checkbox'
import { Field } from '../field/field'

const settle = async () => {
  flush()
  await Promise.resolve()
}

describe('CheckboxGroup', () => {
  test('group name and descriptions coexist with independent item labels', async () => {
    const view = render(() => (
      <CheckboxGroup invalid>
        <CheckboxGroup.Label>Snacks</CheckboxGroup.Label>
        <CheckboxGroup.Description id="hint">Pick a snack</CheckboxGroup.Description>
        <CheckboxGroup.Error id="error">Please choose</CheckboxGroup.Error>
        <Field>
          <Field.Label>Apple</Field.Label>
          <Checkbox value="apple" />
        </Field>
        <Checkbox value="pear" aria-label="Pear" />
      </CheckboxGroup>
    ))
    await settle()
    const group = view.getByRole('group', { name: 'Snacks' })
    expect(group).toHaveAttribute('aria-describedby', 'hint error')
    const apple = view.getByRole('checkbox', { name: 'Apple' })
    expect(apple).toHaveAttribute('aria-describedby', 'hint error')
    expect(apple).toHaveAttribute('aria-invalid', 'true')
    const inputs = view.container.querySelectorAll('input')
    expect(inputs[0]!.id).not.toBe(inputs[1]!.id)
  })
  test('uncontrolled membership submits repeated names in child order and resets silently', async () => {
    const change = vi.fn()
    const view = render(() => (
      <form>
        <CheckboxGroup name="fruit" defaultValue={['pear']} onValueChange={change}>
          <Checkbox value="apple" aria-label="Apple" />
          <CheckboxGroup.Item value="pear" aria-label="Pear" />
        </CheckboxGroup>
      </form>
    ))
    const apple = view.getByRole('checkbox', { name: 'Apple' }) as HTMLInputElement
    const pear = view.getByRole('checkbox', { name: 'Pear' }) as HTMLInputElement
    fireEvent.click(apple)
    await settle()
    expect(change).toHaveBeenCalledExactlyOnceWith(['pear', 'apple'])
    expect(new FormData(view.container.querySelector('form')!).getAll('fruit')).toEqual([
      'apple',
      'pear',
    ])
    view.container.querySelector('form')!.reset()
    await settle()
    expect(apple.checked).toBe(false)
    expect(pear.checked).toBe(true)
    expect(change).toHaveBeenCalledTimes(1)
  })
  test('controlled changes snap back and external writes update stable nodes', async () => {
    const [value, setValue] = createSignal<readonly string[] | undefined>([])
    const change = vi.fn()
    const view = render(() => (
      <CheckboxGroup value={value()} onValueChange={change}>
        <Checkbox value="" aria-label="Empty" />
      </CheckboxGroup>
    ))
    const input = view.getByRole('checkbox') as HTMLInputElement
    fireEvent.click(input)
    await settle()
    expect(change).toHaveBeenCalledExactlyOnceWith([''])
    expect(input.checked).toBe(false)
    setValue([''])
    await settle()
    expect(view.getByRole('checkbox')).toBe(input)
    expect(input.checked).toBe(true)
    setValue(undefined)
    await settle()
    expect(input.checked).toBe(false)
  })
  test('required group becomes valid after any item is selected', async () => {
    const view = render(() => (
      <form>
        <CheckboxGroup required>
          <Checkbox value="a" aria-label="A" />
          <Checkbox value="b" aria-label="B" />
        </CheckboxGroup>
      </form>
    ))
    const form = view.container.querySelector('form')!
    expect(form.checkValidity()).toBe(false)
    fireEvent.click(view.getByRole('checkbox', { name: 'B' }))
    await settle()
    expect(form.checkValidity()).toBe(true)
    fireEvent.click(view.getByRole('checkbox', { name: 'B' }))
    await settle()
    expect(form.checkValidity()).toBe(false)
  })
  test('group readonly preserves selection and blocks item callbacks', async () => {
    const change = vi.fn()
    const itemChange = vi.fn()
    const view = render(() => (
      <CheckboxGroup readonly defaultValue={['a']} onValueChange={change}>
        <Checkbox value="a" aria-label="A" readonly={false} onCheckedChange={itemChange} />
      </CheckboxGroup>
    ))
    fireEvent.click(view.getByRole('checkbox'))
    await settle()
    expect(view.getByRole('checkbox')).toBeChecked()
    expect(view.getByRole('checkbox')).toHaveAttribute('aria-readonly', 'true')
    expect(change).not.toHaveBeenCalled()
    expect(itemChange).not.toHaveBeenCalled()
  })
  test('custom hosts mirror membership and explicit form ownership', async () => {
    const view = render(() => (
      <>
        <form id="owner" />
        <CheckboxGroup name="x" form="owner">
          <Checkbox as="button" value="a">
            A
          </Checkbox>
        </CheckboxGroup>
      </>
    ))
    fireEvent.click(view.getByRole('checkbox'))
    await settle()
    expect(new FormData(view.container.querySelector('form')!).getAll('x')).toEqual(['a'])
    view.container.querySelector('form')!.reset()
    await settle()
    expect(view.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')
  })
  test('disabled inheritance cannot be overridden and individual readonly is isolated', async () => {
    const [disabled, setDisabled] = createSignal(true)
    const view = render(() => (
      <CheckboxGroup disabled={disabled()}>
        <Checkbox value="a" aria-label="A" disabled={false} readonly />
        <Checkbox value="b" aria-label="B" disabled={false} />
      </CheckboxGroup>
    ))
    expect(view.getByRole('checkbox', { name: 'B' })).toBeDisabled()
    setDisabled(false)
    await settle()
    fireEvent.click(view.getByRole('checkbox', { name: 'A' }))
    fireEvent.click(view.getByRole('checkbox', { name: 'B' }))
    await settle()
    expect(view.getByRole('checkbox', { name: 'A' })).not.toBeChecked()
    expect(view.getByRole('checkbox', { name: 'B' })).toBeChecked()
  })
  test('author cancellation blocks group changes', async () => {
    const change = vi.fn()
    const view = render(() => (
      <CheckboxGroup onValueChange={change}>
        <Checkbox value="a" aria-label="A" onClick={(event) => event.preventDefault()} />
      </CheckboxGroup>
    ))
    fireEvent.click(view.getByRole('checkbox'))
    await settle()
    expect(change).not.toHaveBeenCalled()
    expect(view.getByRole('checkbox')).not.toBeChecked()
  })
  test('outer Field flags and descriptions reach the group and its items', async () => {
    const view = render(() => (
      <Field required invalid name="choice">
        <Field.Label>Choices</Field.Label>
        <Field.Description id="outer-description">Pick one</Field.Description>
        <CheckboxGroup>
          <Checkbox value="a" aria-label="A" />
        </CheckboxGroup>
      </Field>
    ))
    await settle()
    const group = view.getByRole('group', { name: 'Choices' })
    expect(group).toHaveAttribute('aria-describedby', 'outer-description')
    const input = view.getByRole('checkbox')
    expect(input).toHaveAttribute('name', 'choice')
    expect(input).toHaveAttribute('aria-describedby', 'outer-description')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toBeRequired()
  })
  test('author association IDs lead group description and conditional error IDs', async () => {
    const [invalid, setInvalid] = createSignal(false)
    const view = render(() => (
      <CheckboxGroup invalid={invalid()} aria-describedby="author">
        <CheckboxGroup.Label>Choices</CheckboxGroup.Label>
        <CheckboxGroup.Description id="description">Choose</CheckboxGroup.Description>
        <CheckboxGroup.Error id="error">Missing</CheckboxGroup.Error>
        <Checkbox value="a" aria-label="A" />
      </CheckboxGroup>
    ))
    await settle()
    const group = view.getByRole('group')
    expect(group).toHaveAttribute('aria-describedby', 'author description')
    setInvalid(true)
    await settle()
    expect(group).toHaveAttribute('aria-describedby', 'author description error')
    expect(view.getByRole('checkbox')).toHaveAttribute(
      'aria-describedby',
      'author description error'
    )
  })
  test('an individually required child stays required after group selection', async () => {
    const view = render(() => (
      <form>
        <CheckboxGroup required defaultValue={['a']}>
          <Checkbox value="a" aria-label="A" />
          <Checkbox value="b" aria-label="B" required />
        </CheckboxGroup>
      </form>
    ))
    const form = view.container.querySelector('form')!
    expect(form.checkValidity()).toBe(false)
    fireEvent.click(view.getByRole('checkbox', { name: 'B' }))
    await settle()
    expect(form.checkValidity()).toBe(true)
  })
})

test('late window reset cancellation preserves uncontrolled group membership', async () => {
  const view = render(() => (
    <form>
      <CheckboxGroup defaultValue={['a']}>
        <Checkbox value="a" aria-label="A" />
        <Checkbox value="b" aria-label="B" />
      </CheckboxGroup>
    </form>
  ))
  fireEvent.click(view.getByRole('checkbox', { name: 'B' }))
  await settle()
  const cancel = (event: Event) => event.preventDefault()
  window.addEventListener('reset', cancel)
  try {
    view.container.querySelector('form')!.reset()
    await settle()
  } finally {
    window.removeEventListener('reset', cancel)
  }
  expect(view.getByRole('checkbox', { name: 'B' })).toBeChecked()
})

test('required membership works through nested Fields and disabled children remain excluded from submission', async () => {
  const view = render(() => (
    <form>
      <CheckboxGroup required name="choice">
        <Field disabled>
          <Field.Label>A</Field.Label>
          <Checkbox value="a" disabled={false} />
        </Field>
        <Field>
          <Field.Label>B</Field.Label>
          <Checkbox value="b" />
        </Field>
      </CheckboxGroup>
    </form>
  ))
  await settle()
  const form = view.container.querySelector('form')!
  expect(view.getByRole('checkbox', { name: 'A' })).toBeDisabled()
  expect(form.checkValidity()).toBe(false)
  fireEvent.click(view.getByRole('checkbox', { name: 'B' }))
  await settle()
  expect(form.checkValidity()).toBe(true)
  expect(new FormData(form).getAll('choice')).toEqual(['b'])
})
