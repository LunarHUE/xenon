import { cleanup, fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { CheckboxGroup } from './checkbox-group'
import { Checkbox } from '../checkbox/checkbox'

const settle = async () => {
  flush()
  await Promise.resolve()
}

afterEach(() => cleanup())

describe('CheckboxGroup contracts', () => {
  test('controlled membership survives native reset without changing the controlled value', async () => {
    const change = vi.fn()
    const view = render(() => (
      <form>
        <CheckboxGroup
          name="fruit"
          value={['apple']}
          defaultValue={['pear']}
          onValueChange={change}
        >
          <Checkbox value="apple" aria-label="Apple" />
          <Checkbox value="pear" aria-label="Pear" />
        </CheckboxGroup>
      </form>
    ))
    const form = view.container.querySelector('form')!
    const apple = view.getByRole('checkbox', { name: 'Apple' })
    fireEvent.click(view.getByRole('checkbox', { name: 'Pear' }))
    await settle()
    expect(change).toHaveBeenCalledExactlyOnceWith(['apple', 'pear'])
    expect(apple).toBeChecked()
    expect(view.getByRole('checkbox', { name: 'Pear' })).not.toBeChecked()
    form.reset()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await settle()
    expect(apple).toBeChecked()
    expect(view.getByRole('checkbox', { name: 'Pear' })).not.toBeChecked()
    expect(change).toHaveBeenCalledOnce()
  })

  test('only the current native form owner responds to reset', async () => {
    const [owner, setOwner] = createSignal('old-form')
    const view = render(() => (
      <>
        <form id="old-form" />
        <form id="new-form" />
        <CheckboxGroup form={owner()} defaultValue={['a']}>
          <Checkbox value="a" aria-label="A" />
          <Checkbox value="b" aria-label="B" />
        </CheckboxGroup>
      </>
    ))
    const a = view.getByRole('checkbox', { name: 'A' })
    fireEvent.click(view.getByRole('checkbox', { name: 'B' }))
    await settle()
    setOwner('new-form')
    await settle()
    expect((a as HTMLInputElement).form).toBe(view.container.querySelector('#new-form'))
    expect(view.getByRole('checkbox', { name: 'B' })).toBeChecked()
    view.container.querySelector<HTMLFormElement>('#old-form')!.reset()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await settle()
    expect(a).toBeChecked()
    expect(view.getByRole('checkbox', { name: 'B' })).toBeChecked()
    view.container.querySelector<HTMLFormElement>('#new-form')!.reset()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await settle()
    expect(a).toBeChecked()
    expect(view.getByRole('checkbox', { name: 'B' })).not.toBeChecked()
  })

  test('reactive group names update visible controls and submission mirrors', async () => {
    const [name, setName] = createSignal('before')
    const view = render(() => (
      <form>
        <CheckboxGroup name={name()} defaultValue={['a', 'b']}>
          <Checkbox value="a" aria-label="A" />
          <Checkbox as="button" value="b">
            B
          </Checkbox>
        </CheckboxGroup>
      </form>
    ))
    const form = view.container.querySelector('form')!
    expect(
      Array.from(form.querySelectorAll<HTMLInputElement>('input')).map((input) => input.name)
    ).toEqual(['before', 'before'])
    setName('after')
    await settle()
    expect(
      Array.from(form.querySelectorAll<HTMLInputElement>('input')).map((input) => input.name)
    ).toEqual(['after', 'after'])
    expect(new FormData(form).getAll('after')).toEqual(['a', 'b'])
    expect(new FormData(form).getAll('before')).toEqual([])
  })

  test('independent groups submit same values under their own names', async () => {
    const view = render(() => (
      <form>
        <CheckboxGroup name="left" defaultValue={['same']}>
          <Checkbox value="same" aria-label="Left same" />
        </CheckboxGroup>
        <CheckboxGroup name="right" defaultValue={['same']}>
          <Checkbox value="same" aria-label="Right same" />
        </CheckboxGroup>
      </form>
    ))
    const form = view.container.querySelector('form')!
    expect(new FormData(form).getAll('left')).toEqual(['same'])
    expect(new FormData(form).getAll('right')).toEqual(['same'])
    fireEvent.click(view.getByRole('checkbox', { name: 'Left same' }))
    await settle()
    expect(new FormData(form).getAll('left')).toEqual([])
    expect(new FormData(form).getAll('right')).toEqual(['same'])
  })

  test('native reset returns to the latest defaultValue after it changes', async () => {
    const [defaultValue, setDefaultValue] = createSignal<readonly string[]>(['a'])
    const view = render(() => (
      <form>
        <CheckboxGroup defaultValue={defaultValue()}>
          <Checkbox value="a" aria-label="A" />
          <Checkbox value="b" aria-label="B" />
        </CheckboxGroup>
      </form>
    ))
    setDefaultValue(['b'])
    await settle()
    expect(view.getByRole('checkbox', { name: 'A' })).toBeChecked()
    expect(view.getByRole('checkbox', { name: 'B' })).not.toBeChecked()
    fireEvent.click(view.getByRole('checkbox', { name: 'B' }))
    await settle()
    view.container.querySelector('form')!.reset()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await settle()
    expect(view.getByRole('checkbox', { name: 'A' })).not.toBeChecked()
    expect(view.getByRole('checkbox', { name: 'B' })).toBeChecked()
  })
})
