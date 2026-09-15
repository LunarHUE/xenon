import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

function append<T extends HTMLElement>(element: T) {
  document.body.append(element)
  onTestFinished(() => element.remove())
  return element
}

test('disabled.15 native disabled click sends pointer events without mouse or click events', async () => {
  const button = append(Object.assign(document.createElement('button'), { disabled: true }))
  const events: string[] = []
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click'])
    button.addEventListener(type, () => events.push(type))

  await userEvent.click(button, { force: true })

  expect(events).toEqual(['pointerdown', 'pointerup'])
})

test('disabled.16 disabled native middle gesture auxclick follows the browser baseline', async () => {
  const button = append(Object.assign(document.createElement('button'), { disabled: true }))
  const auxclick = vi.fn()
  button.addEventListener('auxclick', auxclick)

  await userEvent.click(button, { button: 'middle', force: true })

  const firefox = /firefox/i.test(navigator.userAgent)
  expect(auxclick).toHaveBeenCalledTimes(firefox ? 0 : 1)
})

test('disabled.18 canceled disabled radio activation restores the selected group member', () => {
  const priorRadio = append(
    Object.assign(document.createElement('input'), {
      type: 'radio',
      name: 'cancel-group',
      checked: true,
    })
  )
  const cancelRadio = append(
    Object.assign(document.createElement('input'), {
      type: 'radio',
      name: 'cancel-group',
      disabled: true,
    })
  )
  const otherCheckbox = append(document.createElement('input'))
  const events = vi.fn()
  cancelRadio.addEventListener('input', events)
  cancelRadio.addEventListener('change', events)
  cancelRadio.addEventListener('click', (event) => {
    otherCheckbox.checked = true
    event.preventDefault()
  })

  cancelRadio.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

  expect(priorRadio.checked).toBe(true)
  expect(cancelRadio.checked).toBe(false)
  expect(otherCheckbox.checked).toBe(true)
  expect(events).not.toHaveBeenCalled()
})

test('disabled.20 Enter in text input does not submit with each disabled default submitter', async () => {
  for (const makeSubmitter of [
    () => Object.assign(document.createElement('button'), { type: 'submit', disabled: true }),
    () => {
      const fieldset = document.createElement('fieldset')
      fieldset.disabled = true
      fieldset.append(Object.assign(document.createElement('button'), { type: 'submit' }))
      return fieldset
    },
    () => Object.assign(document.createElement('input'), { type: 'image', disabled: true }),
  ]) {
    const form = append(document.createElement('form'))
    const input = document.createElement('input')
    input.type = 'text'
    const submitter = makeSubmitter()
    form.append(input, submitter)
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
    form.addEventListener('submit', submit)
    input.focus()
    await userEvent.keyboard('{Enter}')
    expect(submit).not.toHaveBeenCalled()
    form.remove()
  }
})
