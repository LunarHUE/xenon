import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { SelectionFixture } from '../../fixtures/selection'
import type { SelectionFixtureProps } from '../../fixtures/selection'
import { expectNoViolations } from '../a11y'

function mount(props: SelectionFixtureProps = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(() => <SelectionFixture {...props} />, container)
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
}

test('Select keeps focus on its trigger, skips disabled options, submits and resets natively', async () => {
  const view = mount()
  const trigger = view.getByRole('combobox', { name: 'Select fruit' })
  const form = view.container.querySelector<HTMLFormElement>('#select-form')!
  const submit = vi.fn()
  form.addEventListener('submit', submit)
  await userEvent.click(view.getByRole('button', { name: 'Submit select' }))
  expect(submit).not.toHaveBeenCalled()
  expect(form.checkValidity()).toBe(false)
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const popup = view.getByRole('listbox', { name: 'Select fruit' })
  expect(trigger.getAttribute('aria-activedescendant')).toBe(
    within(popup).getByRole('option', { name: 'Apple' }).id
  )
  await userEvent.keyboard('{ArrowDown}')
  expect(trigger).toHaveFocus()
  expect(trigger.getAttribute('aria-activedescendant')).toBe(
    within(popup).getByRole('option', { name: 'Pear' }).id
  )
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(new FormData(form).get('fruit')).toBe('pear')
  expect(form.checkValidity()).toBe(true)
  await userEvent.click(view.getByRole('button', { name: 'Submit select' }))
  expect(submit).toHaveBeenCalledTimes(1)
  await userEvent.click(view.getByRole('button', { name: 'Reset select' }))
  await settle()
  expect(new FormData(form).get('fruit')).toBe('')
  expect(form.checkValidity()).toBe(false)
})

test('Combobox typing filters without committing and click accepts while retaining input focus', async () => {
  const view = mount()
  const input = view.getByRole('combobox', { name: 'Search fruit' })
  const form = view.container.querySelector<HTMLFormElement>('#combobox-form')!
  await userEvent.click(input)
  await userEvent.keyboard('pe')
  await settle()
  expect(input).toHaveValue('pe')
  expect(input).toHaveFocus()
  const popup = view.getByRole('listbox', { name: 'Search fruit' })
  expect(within(popup).getAllByRole('option')).toHaveLength(1)
  expect(form.checkValidity()).toBe(false)
  await userEvent.click(within(popup).getByRole('option', { name: 'Pear' }))
  await settle()
  expect(input).toHaveValue('Pear')
  expect(input).toHaveFocus()
  expect(input).toHaveAttribute('aria-expanded', 'false')
  expect(new FormData(form).get('fruit')).toBe('pear')
  expect(form.checkValidity()).toBe(true)
  await userEvent.click(view.getByRole('button', { name: 'Reset combobox' }))
  await settle()
  expect(input).toHaveValue('')
  expect(form.checkValidity()).toBe(false)
})

test('Combobox arrow navigation keeps input focus and Escape does not commit', async () => {
  const view = mount()
  const input = view.getByRole('combobox', { name: 'Search fruit' })
  const form = view.container.querySelector<HTMLFormElement>('#combobox-form')!
  await userEvent.click(input)
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  const popup = view.getByRole('listbox', { name: 'Search fruit' })
  const first = input.getAttribute('aria-activedescendant')
  expect(first).toBe(within(popup).getByRole('option', { name: 'Apple' }).id)
  await userEvent.keyboard('{ArrowDown}')
  expect(input).toHaveFocus()
  expect(input.getAttribute('aria-activedescendant')).toBe(
    within(popup).getByRole('option', { name: 'Pear' }).id
  )
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(input).toHaveFocus()
  expect(input).toHaveAttribute('aria-expanded', 'false')
  expect(form.checkValidity()).toBe(false)
  await userEvent.keyboard('{ArrowDown}{Enter}')
  await settle()
  expect(new FormData(form).get('fruit')).toBe('apple')
})

test('Listbox native keys move DOM focus, skip disabled options and retain multiple selections', async () => {
  const view = mount()
  const list = within(view.getByRole('listbox', { name: 'Fruit basket' }))
  const apple = list.getByRole('option', { name: 'Apple' })
  const pear = list.getByRole('option', { name: 'Pear' })
  apple.focus()
  await userEvent.keyboard(' ')
  expect(apple).toHaveAttribute('aria-selected', 'true')
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(pear).toHaveFocus()
  expect(pear).toHaveAttribute('aria-selected', 'false')
  await userEvent.keyboard(' ')
  expect(pear).toHaveAttribute('aria-selected', 'true')
  expect(apple).toHaveAttribute('aria-selected', 'true')
  await userEvent.keyboard('{Home} ')
  await settle()
  expect(apple).toHaveFocus()
  expect(apple).toHaveAttribute('aria-selected', 'false')
  expect(pear).toHaveAttribute('aria-selected', 'true')
})

test('CheckboxGroup native required accepts any checked item and submits repeated values', async () => {
  const view = mount()
  const form = view.container.querySelector<HTMLFormElement>('#checkbox-form')!
  const submit = vi.fn()
  form.addEventListener('submit', submit)
  const apple = within(form).getByRole('checkbox', { name: 'Apple' })
  const pear = within(form).getByRole('checkbox', { name: 'Pear' })
  await userEvent.click(view.getByRole('button', { name: 'Submit checkboxes' }))
  expect(submit).not.toHaveBeenCalled()
  expect(form.checkValidity()).toBe(false)
  await userEvent.click(pear)
  await settle()
  expect(form.checkValidity()).toBe(true)
  expect(new FormData(form).getAll('fruit')).toEqual(['pear'])
  await userEvent.click(view.getByRole('button', { name: 'Submit checkboxes' }))
  expect(submit).toHaveBeenCalledTimes(1)
  apple.focus()
  await userEvent.keyboard(' ')
  await settle()
  expect(new FormData(form).getAll('fruit')).toEqual(['apple', 'pear'])
  await userEvent.click(view.getByRole('button', { name: 'Reset checkboxes' }))
  await settle()
  expect(apple).not.toBeChecked()
  expect(pear).not.toBeChecked()
  expect(form.checkValidity()).toBe(false)
})

test('baseline and opened selection popups pass the suite axe rules', async () => {
  const view = mount()
  await settle()
  await expectNoViolations(view.container)
  const select = view.getByRole('combobox', { name: 'Select fruit' })
  await userEvent.click(select)
  await settle()
  expect(view.getByRole('listbox', { name: 'Select fruit' })).toBeVisible()
  await expectNoViolations(view.container)
  await userEvent.keyboard('{Escape}')
  const input = view.getByRole('combobox', { name: 'Search fruit' })
  await userEvent.click(input)
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(view.getByRole('listbox', { name: 'Search fruit' })).toBeVisible()
  await expectNoViolations(view.container)
})

test('Tab closes each popup and moves to the next native form button', async () => {
  const view = mount()
  for (const [name, next] of [
    ['Select fruit', 'Submit select'],
    ['Search fruit', 'Submit combobox'],
  ]) {
    const control = view.getByRole('combobox', { name })
    control.focus()
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    expect(control).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{Tab}')
    await settle()
    expect(view.getByRole('button', { name: next })).toHaveFocus()
    expect(control).toHaveAttribute('aria-expanded', 'false')
  }
})

test('disabled native controls refuse focus, skip tab traversal and contribute no form values', async () => {
  const view = mount({ disabled: true })
  const select = view.getByRole('combobox', { name: 'Select fruit' })
  const input = view.getByRole('combobox', { name: 'Search fruit' })
  const checkbox = within(view.container.querySelector('#checkbox-form')!).getByRole('checkbox', {
    name: 'Apple',
  })
  const before = view.getByRole('button', { name: 'Reset select' })
  before.focus()
  for (const control of [select, input, checkbox]) {
    expect(control).toBeDisabled()
    control.focus()
    expect(before).toHaveFocus()
  }
  await userEvent.keyboard('{Tab}')
  expect(view.getByRole('button', { name: 'Submit combobox' })).toHaveFocus()
  for (const form of view.container.querySelectorAll('form')) {
    expect(new FormData(form).getAll('fruit')).toEqual([])
    expect(form.checkValidity()).toBe(true)
  }
  await expectNoViolations(view.container)
})
