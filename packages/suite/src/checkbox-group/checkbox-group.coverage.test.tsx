import { CheckboxGroup } from '@xenon-ui/solid'
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

describe('checkbox group coverage', () => {
  spec('checkbox-group.roles.8', () => {
    const mounted = mount(() => (
      <CheckboxGroup aria-label="Snacks">
        <CheckboxGroup.Item value="apple" aria-label="Apple" />
      </CheckboxGroup>
    ))

    expect(mounted.view.getByRole('group', { name: 'Snacks' })).toBeInTheDocument()
  })

  spec('checkbox-group.roles.11', () => {
    const mounted = mount(() => (
      <CheckboxGroup aria-label="Snacks">
        <CheckboxGroup.Item value="apple" aria-label="Apple" />
        <CheckboxGroup.Item value="pear" aria-label="Pear" />
      </CheckboxGroup>
    ))
    const inputs = mounted.view.getAllByRole('checkbox')

    expect(inputs.map((input) => input.getAttribute('name'))).toEqual([null, null])
    expect(inputs.map((input) => input.getAttribute('value'))).toEqual(['apple', 'pear'])
  })

  spec('checkbox-group.roles.10', () => {
    const group = mount(() => (
      <CheckboxGroup invalid aria-label="Group">
        <CheckboxGroup.Item value="a" aria-label="A" />
        <CheckboxGroup.Item value="b" aria-label="B" />
      </CheckboxGroup>
    ))
    for (const input of group.view.getAllByRole('checkbox')) {
      expect(input).toHaveAttribute('aria-invalid', 'true')
    }

    const local = mount(() => (
      <CheckboxGroup aria-label="Group">
        <CheckboxGroup.Item value="a" aria-label="A" invalid />
        <CheckboxGroup.Item value="b" aria-label="B" />
      </CheckboxGroup>
    ))
    expect(local.view.getByRole('checkbox', { name: 'A' })).toHaveAttribute('aria-invalid', 'true')
    expect(local.view.getByRole('checkbox', { name: 'B' })).not.toHaveAttribute('aria-invalid')
  })

  spec('checkbox-group.roles.13', () => {
    const mounted = mount(() => (
      <CheckboxGroup aria-label="Choices">
        <CheckboxGroup.Description id="group-help">Choose one</CheckboxGroup.Description>
        <CheckboxGroup.Item value="a" aria-label="A" aria-describedby="item-help" />
        <span id="item-help">A help</span>
      </CheckboxGroup>
    ))
    const input = mounted.view.getByRole('checkbox', { name: 'A' })
    const group = mounted.view.getByRole('group', { name: 'Choices' })

    expect(group).toHaveAttribute('aria-describedby', 'group-help')
    expect(input).toHaveAttribute('aria-describedby', 'item-help group-help')
  })

  spec('checkbox-group.roles.14', () => {
    const mounted = mount(() => (
      <CheckboxGroup aria-label="Choices" invalid>
        <CheckboxGroup.Description id="group-help">Choose one</CheckboxGroup.Description>
        <CheckboxGroup.Error id="group-error">Required</CheckboxGroup.Error>
        <CheckboxGroup.Item value="a" aria-label="A" aria-describedby="item-help" />
        <span id="item-help">A help</span>
      </CheckboxGroup>
    ))
    const input = mounted.view.getByRole('checkbox', { name: 'A' })

    expect(mounted.view.getByRole('group', { name: 'Choices' })).toHaveAttribute(
      'aria-describedby',
      'group-help group-error'
    )
    expect(input).toHaveAttribute('aria-describedby', 'item-help group-help group-error')
  })

  spec('checkbox-group.roles.4', async () => {
    const [disabled, setDisabled] = createSignal(true)
    const mounted = mount(() => (
      <CheckboxGroup disabled={disabled()} aria-label="Choices">
        <CheckboxGroup.Item value="a" aria-label="A" />
        <CheckboxGroup.Item value="b" aria-label="B" />
      </CheckboxGroup>
    ))
    const group = mounted.view.getByRole('group', { name: 'Choices' })
    const inputs = mounted.view.getAllByRole('checkbox')
    expect(group).toHaveAttribute('data-disabled', '')
    expect(group).toHaveAttribute('aria-disabled', 'true')
    expect(inputs[0]).toBeDisabled()
    expect(inputs[1]).toBeDisabled()
    for (const input of inputs) {
      expect(input).toHaveAttribute('data-disabled', '')
    }

    setDisabled(false)
    await settle()
    expect(inputs[0]).not.toHaveAttribute('disabled')
    expect(inputs[1]).not.toHaveAttribute('disabled')
    for (const element of [group, ...inputs]) {
      expect(element).not.toHaveAttribute('data-disabled')
      expect(element).not.toHaveAttribute('aria-disabled')
    }
  })

  spec('checkbox-group.state.6', () => {
    const change = vi.fn()
    const [value, setValue] = createSignal<readonly string[]>([''])
    const mounted = mount(() => (
      <CheckboxGroup
        value={value()}
        onValueChange={(next) => {
          change(next)
          setValue(next)
        }}
        aria-label="Choices"
      >
        <CheckboxGroup.Item value="" aria-label="Empty" />
      </CheckboxGroup>
    ))
    const input = mounted.view.getByRole('checkbox', { name: 'Empty' })
    expect(input).toBeChecked()

    fireEvent.click(input)
    flush()
    expect(input).not.toBeChecked()
    expect(change).toHaveBeenCalledExactlyOnceWith([])
  })

  spec('checkbox-group.pointer.1', () => {
    const change = vi.fn()
    const mounted = mount(() => (
      <CheckboxGroup onValueChange={change} aria-label="Choices">
        <label>
          Apple
          <CheckboxGroup.Item value="apple" />
        </label>
        <label>
          Pear
          <CheckboxGroup.Item value="pear" />
        </label>
      </CheckboxGroup>
    ))
    fireEvent.click(mounted.view.getByText('Apple'))
    flush()

    expect(change).toHaveBeenCalledExactlyOnceWith(['apple'])
    expect(mounted.view.getByRole('checkbox', { name: 'Apple' })).toBeChecked()
    expect(mounted.view.getByRole('checkbox', { name: 'Pear' })).not.toBeChecked()
  })

  spec('checkbox-group.pointer.2', () => {
    const mounted = mount(() => (
      <CheckboxGroup aria-label="Choices">
        <CheckboxGroup.Item value="a" aria-label="A" />
        <CheckboxGroup.Item value="b" aria-label="B" />
        <CheckboxGroup.Item value="c" aria-label="C" />
      </CheckboxGroup>
    ))
    fireEvent.click(mounted.view.getByRole('checkbox', { name: 'A' }))
    flush()
    fireEvent.click(mounted.view.getByRole('checkbox', { name: 'B' }))
    flush()

    expect(mounted.view.getByRole('checkbox', { name: 'A' })).toBeChecked()
    expect(mounted.view.getByRole('checkbox', { name: 'B' })).toBeChecked()
    expect(mounted.view.getByRole('checkbox', { name: 'C' })).not.toBeChecked()
  })

  spec('checkbox-group.pointer.3', () => {
    const groupChange = vi.fn()
    const localChange = vi.fn()
    const editableChange = vi.fn()
    const mounted = mount(() => (
      <CheckboxGroup onValueChange={groupChange} aria-label="Choices">
        <label>
          Readonly
          <CheckboxGroup.Item value="readonly" readonly onCheckedChange={localChange} />
        </label>
        <label>
          Editable
          <CheckboxGroup.Item value="editable" onCheckedChange={editableChange} />
        </label>
      </CheckboxGroup>
    ))

    fireEvent.click(mounted.view.getByText('Readonly'))
    flush()
    expect(groupChange).not.toHaveBeenCalled()
    expect(localChange).not.toHaveBeenCalled()
    expect(mounted.view.getByRole('checkbox', { name: 'Readonly' })).not.toBeChecked()

    fireEvent.click(mounted.view.getByText('Editable'))
    flush()
    expect(groupChange).toHaveBeenCalledExactlyOnceWith(['editable'])
    expect(editableChange).toHaveBeenCalledExactlyOnceWith(true)
  })
})
