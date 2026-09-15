import { CheckboxGroup } from '@xenon/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { describe, expect, onTestFinished, vi } from 'vitest'

import { spec } from '../spec'

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
  })
  flush()
  return { container, view: within(container) }
}

async function settle() {
  flush()
  await Promise.resolve()
  flush()
}

describe('checkbox group forms and state coverage', () => {
  spec('checkbox-group.forms.2', () => {
    const [disabled, setDisabled] = createSignal(false)
    const mounted = mount(() => (
      <form>
        <CheckboxGroup aria-label="Choices">
          <CheckboxGroup.Item value="a" aria-label="A" required />
          <CheckboxGroup.Item value="b" aria-label="B" required disabled={disabled()} />
        </CheckboxGroup>
      </form>
    ))
    const form = mounted.container.querySelector('form')!
    const a = mounted.view.getByRole('checkbox', { name: 'A' }) as HTMLInputElement
    const b = mounted.view.getByRole('checkbox', { name: 'B' }) as HTMLInputElement

    expect(form.checkValidity()).toBe(false)
    expect(a.validity.valueMissing).toBe(true)
    expect(b.validity.valueMissing).toBe(true)
    fireEvent.click(a)
    flush()
    expect(form.checkValidity()).toBe(false)
    expect(a.validity.valueMissing).toBe(false)
    expect(b.validity.valueMissing).toBe(true)
    fireEvent.click(b)
    flush()
    expect(form.checkValidity()).toBe(true)
    expect(a.validity.valueMissing).toBe(false)
    expect(b.validity.valueMissing).toBe(false)
    fireEvent.click(b)
    flush()
    expect(form.checkValidity()).toBe(false)
    expect(b.validity.valueMissing).toBe(true)
    setDisabled(true)
    flush()
    expect(form.checkValidity()).toBe(true)
    expect(b).toBeDisabled()
  })

  spec('checkbox-group.forms.4', () => {
    const mounted = mount(() => (
      <form>
        <CheckboxGroup name="choice" aria-label="Choices">
          <CheckboxGroup.Item as="button" value="a" aria-label="A" />
          <CheckboxGroup.Item as="button" value="b" aria-label="B" />
        </CheckboxGroup>
      </form>
    ))
    const form = mounted.container.querySelector('form')!
    const a = mounted.view.getByRole('checkbox', { name: 'A' })
    const b = mounted.view.getByRole('checkbox', { name: 'B' })

    fireEvent.click(a)
    flush()
    fireEvent.click(b)
    flush()
    expect(new FormData(form).getAll('choice')).toEqual(['a', 'b'])
    fireEvent.click(a)
    flush()
    fireEvent.click(b)
    flush()
    expect(new FormData(form).getAll('choice')).toEqual([])
  })

  spec('checkbox-group.forms.7', () => {
    const [showChecked, setShowChecked] = createSignal(true)
    const mounted = mount(() => (
      <form>
        <CheckboxGroup defaultValue={['checked']} aria-label="Choices">
          {showChecked() ? (
            <CheckboxGroup.Item value="checked" aria-label="Checked" required />
          ) : null}
          <CheckboxGroup.Item value="remaining" aria-label="Remaining" required />
        </CheckboxGroup>
      </form>
    ))
    const form = mounted.container.querySelector('form')!
    expect(form.checkValidity()).toBe(false)
    setShowChecked(false)
    flush()
    expect(mounted.view.getByRole('checkbox', { name: 'Remaining' })).toBeRequired()
    expect(form.checkValidity()).toBe(false)
  })

  spec('checkbox-group.forms.13', async () => {
    const [disabled, setDisabled] = createSignal(true)
    const [mountedChild, setMountedChild] = createSignal(true)
    const mounted = mount(() => (
      <>
        <form id="own-form">
          <CheckboxGroup
            name="choice"
            defaultValue={['disabled', 'external', 'removed']}
            aria-label="Choices"
          >
            <CheckboxGroup.Item value="disabled" aria-label="Disabled" disabled={disabled()} />
            <CheckboxGroup.Item value="own" aria-label="Own" />
            {mountedChild() ? <CheckboxGroup.Item value="removed" aria-label="Removed" /> : null}
            <CheckboxGroup.Item value="external" aria-label="External" form="other-form" />
          </CheckboxGroup>
        </form>
        <form id="other-form" />
      </>
    ))
    const own = mounted.container.querySelector('#own-form') as HTMLFormElement
    const other = mounted.container.querySelector('#other-form') as HTMLFormElement
    expect(new FormData(own).getAll('choice')).toEqual(['removed'])
    expect(new FormData(other).getAll('choice')).toEqual(['external'])

    setDisabled(false)
    setMountedChild(false)
    await settle()
    expect(new FormData(own).getAll('choice')).toEqual(['disabled'])
    expect(new FormData(other).getAll('choice')).toEqual(['external'])
    setMountedChild(true)
    await settle()
    expect(new FormData(own).getAll('choice')).toEqual(['disabled', 'removed'])
    expect(mounted.view.getByRole('checkbox', { name: 'Removed' })).toBeChecked()
  })

  spec('checkbox-group.state.17', async () => {
    const [readonly, setReadonly] = createSignal(false)
    const change = vi.fn()
    const mounted = mount(() => (
      <CheckboxGroup
        readonly={readonly()}
        defaultValue={['a']}
        onValueChange={change}
        aria-label="Choices"
      >
        <CheckboxGroup.Item value="a" aria-label="A" />
        <CheckboxGroup.Item value="b" aria-label="B" />
      </CheckboxGroup>
    ))
    const a = mounted.view.getByRole('checkbox', { name: 'A' })
    const b = mounted.view.getByRole('checkbox', { name: 'B' })
    setReadonly(true)
    await settle()
    expect(a).toBeChecked()
    expect(a).toHaveAttribute('aria-readonly', 'true')
    expect(b).toHaveAttribute('aria-readonly', 'true')
    fireEvent.click(a)
    fireEvent.click(b)
    flush()
    expect(a).toBeChecked()
    expect(b).not.toBeChecked()
    expect(change).not.toHaveBeenCalled()
  })

  spec('checkbox-group.state.5', async () => {
    const [value, setValue] = createSignal<readonly string[] | undefined>(undefined)
    const mounted = mount(() => (
      <CheckboxGroup value={value()} defaultValue={['a']} aria-label="Choices">
        <CheckboxGroup.Item value="a" aria-label="A" />
        <CheckboxGroup.Item value="b" aria-label="B" />
      </CheckboxGroup>
    ))
    const a = mounted.view.getByRole('checkbox', { name: 'A' })
    const b = mounted.view.getByRole('checkbox', { name: 'B' })
    expect(a).toBeChecked()
    expect(b).not.toBeChecked()
    setValue(['b'])
    await settle()
    expect(a).not.toBeChecked()
    expect(b).toBeChecked()
  })

  spec('checkbox-group.state.7', () => {
    const mounted = mount(() => (
      <>
        <CheckboxGroup aria-label="First">
          <CheckboxGroup.Item value="a" aria-label="A" />
        </CheckboxGroup>
        <CheckboxGroup aria-label="Second">
          <CheckboxGroup.Item value="b" aria-label="B" />
        </CheckboxGroup>
      </>
    ))
    const a = mounted.view.getByRole('checkbox', { name: 'A' })
    const b = mounted.view.getByRole('checkbox', { name: 'B' })
    fireEvent.click(a)
    flush()
    expect(a).toBeChecked()
    expect(b).not.toBeChecked()
  })
})
