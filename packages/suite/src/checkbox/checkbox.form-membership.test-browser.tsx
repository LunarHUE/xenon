import { Checkbox } from '@xenon-ui/solid/checkbox'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
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

for (const as of ['input', 'div'] as const) {
  test(`checkbox.forms.12: ${as} host contributes only its successful named native control to form membership`, () => {
    const view = mount(() => (
      <form>
        <Checkbox as={as} name="choice" value="first" defaultChecked aria-label="First" />
        <Checkbox as={as} name="choice" value="second" defaultChecked aria-label="Second" />
        <Checkbox as={as} name="unchecked" value="excluded" aria-label="Unchecked" />
        <Checkbox
          as={as}
          name="disabled"
          value="excluded"
          defaultChecked
          disabled
          aria-label="Disabled"
        />
        <Checkbox as={as} defaultChecked aria-label="Unnamed" />
      </form>
    ))
    const form = view.container.querySelector('form')!
    const controls = Array.from(form.elements)
    const checkboxes = view.getAllByRole('checkbox')
    const native = Array.from(view.container.querySelectorAll('input'))
    expect(controls).toEqual(native)
    expect(native).toHaveLength(as === 'input' ? 5 : 4)
    for (const input of native) expect(input.form).toBe(form)
    for (const checkbox of checkboxes) expect(controls.includes(checkbox)).toBe(as === 'input')
    expect(Array.from(new FormData(form))).toEqual([
      ['choice', 'first'],
      ['choice', 'second'],
    ])
    expect(form.elements.namedItem('unchecked')).toBeInstanceOf(HTMLInputElement)
    expect(form.elements.namedItem('disabled')).toBeInstanceOf(HTMLInputElement)
  })
}

test('checkbox.forms.5: native disabled checkbox suppresses trusted activation while programmatic checked writes stay silent', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <form>
      <Checkbox disabled name="disabled" aria-label="Disabled" onCheckedChange={change} />
    </form>
  ))
  const input = view.getByRole('checkbox') as HTMLInputElement
  const clicks: Event[] = []
  const inputs: Event[] = []
  input.addEventListener('click', (event) => clicks.push(event))
  input.addEventListener('input', (event) => inputs.push(event))
  const rect = input.getBoundingClientRect()
  expect(rect.width).toBeGreaterThan(0)
  expect(rect.height).toBeGreaterThan(0)
  await userEvent.click(view.container, {
    position: {
      x: rect.x - view.container.getBoundingClientRect().x + rect.width / 2,
      y: rect.y - view.container.getBoundingClientRect().y + rect.height / 2,
    },
  })
  expect(input).not.toBeChecked()
  expect(clicks).toEqual([])
  expect(inputs).toEqual([])
  input.checked = true
  expect(input).toBeChecked()
  expect(clicks).toEqual([])
  expect(inputs).toEqual([])
  expect(change).not.toHaveBeenCalled()
  expect(Array.from(new FormData(view.container.querySelector('form')!))).toEqual([])
})
