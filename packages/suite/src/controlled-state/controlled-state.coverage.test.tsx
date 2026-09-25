import { fireEvent } from '@testing-library/dom'
import { Checkbox, CheckboxGroup } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import { createSignal, flush } from 'solid-js'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function host(container: HTMLElement): HTMLElement {
  const element = container.firstElementChild
  if (!(element instanceof HTMLElement)) throw new Error('nothing mounted')
  return element
}

describe('controlled state coverage', () => {
  spec('controlled-state.state.18', async () => {
    const change = vi.fn()
    const mounted = mount('checkbox', {
      'aria-label': 'Agree',
      checked: false,
      indeterminate: true,
      onCheckedChange: change,
    })
    const checkbox = host(mounted.container)

    fireEvent.click(checkbox)
    await mounted.settle()
    fireEvent.click(checkbox)
    await mounted.settle()

    expect(change.mock.calls).toEqual([[true], [true]])
    expect(checkbox).toHaveAttribute('data-state', 'indeterminate')
    expect(checkbox).not.toBeChecked()
    mounted.unmount()
  })

  spec('controlled-state.state.23', async () => {
    const [value, setValue] = createSignal<readonly string[] | undefined>(['apple'])
    const change = vi.fn()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const container = document.createElement('div')
    document.body.append(container)
    const dispose = render(
      () => (
        <CheckboxGroup value={value()} defaultValue={[]} onValueChange={change}>
          <Checkbox value="apple" aria-label="Apple" />
        </CheckboxGroup>
      ),
      container
    )
    try {
      flush()
      expect(container.querySelector('input')).toBeChecked()
      setValue(undefined)
      flush()
      await Promise.resolve()
      flush()
      expect(container.querySelector('input')).not.toBeChecked()
      expect(warning).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
      expect(change).not.toHaveBeenCalled()
    } finally {
      warning.mockRestore()
      error.mockRestore()
      dispose()
      container.remove()
    }
  })
})
