import { RadioGroup } from '@xenon-ui/solid'
import { fireEvent, within } from '@testing-library/dom'
import { describe, expect, onTestFinished, test } from 'vitest'

import { mount } from '../harness/solid'

function group(label: string, defaultValue?: string) {
  return mount('radio-group', {
    'aria-label': label,
    defaultValue,
    children: () => (
      <>
        <RadioGroup.Item value="one" aria-label="One" />
        <RadioGroup.Item value="two" aria-label="Two" />
      </>
    ),
  })
}

describe('radio group independent state', () => {
  test('generated names keep radio groups independent within the same form', async () => {
    const first = group('First', 'one')
    const second = group('Second', 'two')
    const form = document.createElement('form')
    document.body.append(form)
    form.append(first.container, second.container)
    onTestFinished(() => form.remove())
    await Promise.all([first.settle(), second.settle()])
    const one = within(first.container).getByRole('radio', { name: 'One' })
    const two = within(first.container).getByRole('radio', { name: 'Two' })
    const secondTwo = within(second.container).getByRole('radio', { name: 'Two' })
    expect((one as HTMLInputElement).form).toBe(form)
    expect((secondTwo as HTMLInputElement).form).toBe(form)
    expect(one).toBeChecked()
    expect(secondTwo).toBeChecked()
    expect(one.getAttribute('name')).not.toBe(secondTwo.getAttribute('name'))
    fireEvent.click(two)
    await first.settle()
    expect(two).toBeChecked()
    expect(secondTwo).toBeChecked()
  })

  test('a changed default affects the next reset without changing current selection', async () => {
    const changes: string[] = []
    const m = mount('radio-group', {
      'aria-label': 'Delivery',
      defaultValue: 'one',
      onValueChange: (value: string) => changes.push(value),
      children: () => (
        <form id="delivery-form">
          <RadioGroup.Item value="one" aria-label="One" />
          <RadioGroup.Item value="two" aria-label="Two" />
        </form>
      ),
    })
    await m.settle()
    const two = within(m.container).getByRole('radio', { name: 'Two' })
    fireEvent.click(two)
    await m.settle()
    expect(two).toBeChecked()
    m.setProps({ defaultValue: 'two' })
    await m.settle()
    const one = within(m.container).getByRole('radio', { name: 'One' })
    fireEvent.click(one)
    await m.settle()
    expect(one).toBeChecked()
    ;(document.getElementById('delivery-form') as HTMLFormElement).reset()
    await new Promise((resolve) => setTimeout(resolve))
    await m.settle()
    expect(two).toBeChecked()
    expect(one).not.toBeChecked()
    expect(changes).toEqual(['two', 'one'])
  })
})
