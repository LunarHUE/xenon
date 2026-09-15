/**
 * Reactive state cases for the inline Editable that are observable in both the
 * jsdom and browser projects: the mounted-part visibility swap, controlled
 * editing and value authority, required/empty submit policy, post-mount draft
 * resets, the placeholder fallback and disabled activation reachability.
 *
 * Every interaction is a synthetic `fireEvent` dispatch over `@testing-library/dom`,
 * so these cases never claim OS or native input timing. Native key sequences,
 * pointer focus departure, cancellation by outside press and focus restoration
 * live in editable.native.test-browser.tsx; commit-on-blur precedence
 * and real form resets live in editable.test-browser.tsx and reset.test-browser.tsx.
 */
import { Editable } from '@xenon/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { spec } from '../spec'

/** Fixture disposers, unwound in reverse order after every test. */
const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

/**
 * Renders a fixture into document.body, registers disposal and exposes scoped queries.
 * The settle helper flushes Solid, yields a microtask and waits two frames so the
 * mode swap has been applied before the next query in either project.
 */
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return {
    container,
    scope: within(container),
    async settle() {
      flush()
      await Promise.resolve()
      for (let frame = 0; frame < 2; frame++) {
        const { promise, resolve } = Promise.withResolvers<void>()
        requestAnimationFrame(() => resolve())
        await promise
      }
      await Promise.resolve()
    },
  }
}

describe('editable reactive state', () => {
  // Only the mode swap is asserted here; the hidden attribute is how the kept
  // parts express both states instead of unmounting either one.
  spec('editable.roles.4', async () => {
    const m = mount(() => (
      <Editable defaultValue="Value">
        <Editable.Label>Title</Editable.Label>
        <Editable.Preview />
        <Editable.Input />
        <Editable.EditTrigger>Edit</Editable.EditTrigger>
        <Editable.SubmitTrigger>Save</Editable.SubmitTrigger>
        <Editable.CancelTrigger>Cancel</Editable.CancelTrigger>
      </Editable>
    ))
    const input = () => {
      const element = m.container.querySelector('input')
      if (element === null) throw new Error('expected the mounted input part')
      return element
    }
    const preview = () => {
      const element = m.container.querySelector('span[role="button"]')
      if (element === null) throw new Error('expected the mounted preview part')
      return element
    }
    const trigger = (label: string) =>
      Array.from(m.container.querySelectorAll('button')).find(
        (button) => button.textContent === label
      )!

    // Preview mode hides the input in the DOM rather than unmounting it.
    expect(input()).toBeInTheDocument()
    expect(input()).toHaveAttribute('hidden')
    expect(input()).toHaveAttribute('data-state', 'preview')
    expect(preview()).toBeInTheDocument()
    expect(preview()).not.toHaveAttribute('hidden')
    expect(preview()).toHaveAttribute('data-state', 'preview')
    expect(preview()).toHaveTextContent('Value')
    expect(trigger('Edit')).not.toHaveAttribute('hidden')
    expect(trigger('Save')).toHaveAttribute('hidden')
    expect(trigger('Cancel')).toHaveAttribute('hidden')

    fireEvent.click(trigger('Edit'))
    await m.settle()

    // Editing swaps which part carries hidden; both parts stay mounted.
    expect(preview()).toBeInTheDocument()
    expect(preview()).toHaveAttribute('hidden')
    expect(preview()).toHaveAttribute('data-state', 'editing')
    expect(input()).toBeInTheDocument()
    expect(input()).not.toHaveAttribute('hidden')
    expect(input()).toHaveAttribute('data-state', 'editing')
    expect(trigger('Edit')).toHaveAttribute('hidden')
    expect(trigger('Save')).not.toHaveAttribute('hidden')
    expect(trigger('Cancel')).not.toHaveAttribute('hidden')

    fireEvent.click(trigger('Cancel'))
    await m.settle()

    expect(input()).toBeInTheDocument()
    expect(input()).toHaveAttribute('hidden')
    expect(preview()).not.toHaveAttribute('hidden')
    expect(preview()).toHaveTextContent('Value')
  })

  test('a controlled editing prop applies only what its owner commits and reports activation requests', async () => {
    const [editing, setEditing] = createSignal(false)
    const proposed = vi.fn()
    const changed = vi.fn()
    const m = mount(() => (
      <Editable
        editing={editing()}
        defaultValue="Fixed"
        onEditingChange={proposed}
        onValueChange={changed}
      >
        <Editable.Preview />
        <Editable.Input />
      </Editable>
    ))
    const input = () => {
      const element = m.container.querySelector('input')
      if (element === null) throw new Error('expected the mounted input part')
      return element
    }
    const preview = () => {
      const element = m.container.querySelector('span[role="button"]')
      if (element === null) throw new Error('expected the mounted preview part')
      return element
    }

    expect(input()).toHaveAttribute('hidden')
    expect(m.scope.getByRole('button', { name: 'Fixed' })).toBeVisible()

    fireEvent.click(m.scope.getByRole('button', { name: 'Fixed' }))
    await m.settle()

    // The request is reported, but the controlled prop keeps the editor in preview.
    expect(proposed).toHaveBeenCalledExactlyOnceWith(true)
    expect(input()).toHaveAttribute('hidden')
    expect(m.scope.getByRole('button', { name: 'Fixed' })).toBeVisible()

    setEditing(true)
    await m.settle()
    expect(proposed).toHaveBeenCalledOnce()
    expect(input()).not.toHaveAttribute('hidden')
    expect(input()).toHaveValue('Fixed')

    fireEvent.input(input(), { target: { value: 'Draft' } })
    await m.settle()
    expect(input()).toHaveValue('Draft')

    // Ending the controlled session discards the uncommitted draft silently.
    setEditing(false)
    await m.settle()
    expect(input()).toHaveAttribute('hidden')
    expect(preview()).not.toHaveAttribute('hidden')
    expect(preview()).toHaveTextContent('Fixed')
    expect(changed).not.toHaveBeenCalled()
  })

  test('a required editor refuses an empty draft until text is entered, with the session left open', async () => {
    const changed = vi.fn()
    const committed = vi.fn()
    const m = mount(() => (
      <Editable required defaultValue="Initial" onValueChange={changed} onValueCommit={committed}>
        <Editable.Label>Title</Editable.Label>
        <Editable.Preview />
        <Editable.Input />
        <Editable.SubmitTrigger>Save</Editable.SubmitTrigger>
        <Editable.CancelTrigger>Cancel</Editable.CancelTrigger>
      </Editable>
    ))
    const input = () => {
      const element = m.container.querySelector('input')
      if (element === null) throw new Error('expected the mounted input part')
      return element
    }
    const textbox = () => m.scope.getByRole('textbox')

    fireEvent.click(m.scope.getByRole('button', { name: 'Initial' }))
    await m.settle()
    expect(input()).toHaveAttribute('required')

    fireEvent.input(textbox(), { target: { value: '' } })
    await m.settle()
    expect(input()).toHaveValue('')

    // The empty required draft fails validation, so no callback runs and the editor stays.
    fireEvent.click(m.scope.getByRole('button', { name: 'Save' }))
    await m.settle()
    expect(changed).not.toHaveBeenCalled()
    expect(committed).not.toHaveBeenCalled()
    expect(input()).not.toHaveAttribute('hidden')

    fireEvent.input(textbox(), { target: { value: 'Valid' } })
    await m.settle()
    fireEvent.click(m.scope.getByRole('button', { name: 'Save' }))
    await m.settle()
    expect(changed).toHaveBeenCalledExactlyOnceWith('Valid')
    expect(committed).toHaveBeenCalledExactlyOnceWith('Valid')
    expect(input()).toHaveAttribute('hidden')
    expect(m.scope.getByRole('button', { name: 'Valid' })).toBeVisible()
  })

  test('an idle controlled value change resyncs the preview and the next draft without a commit', async () => {
    const [value, setValue] = createSignal('First')
    const changed = vi.fn()
    const m = mount(() => (
      <Editable value={value()} onValueChange={changed}>
        <Editable.Preview />
        <Editable.Input />
      </Editable>
    ))
    const input = () => {
      const element = m.container.querySelector('input')
      if (element === null) throw new Error('expected the mounted input part')
      return element
    }

    expect(m.scope.getByRole('button', { name: 'First' })).toBeVisible()
    expect(input()).toHaveValue('First')

    setValue('Second')
    await m.settle()
    expect(m.scope.getByRole('button', { name: 'Second' })).toBeVisible()
    expect(input()).toHaveValue('Second')
    expect(changed).not.toHaveBeenCalled()

    // The next session starts from the newly committed text, not the stale draft.
    fireEvent.click(m.scope.getByRole('button', { name: 'Second' }))
    await m.settle()
    expect(m.scope.getByRole('textbox')).toHaveValue('Second')
  })

  test('an uncontrolled editor keeps its initial defaultValue when the prop changes after mount', async () => {
    const [initial, setInitial] = createSignal('First')
    const changed = vi.fn()
    const m = mount(() => (
      <Editable defaultValue={initial()} onValueChange={changed}>
        <Editable.Preview />
        <Editable.Input />
        <Editable.SubmitTrigger>Save</Editable.SubmitTrigger>
      </Editable>
    ))
    const input = () => {
      const element = m.container.querySelector('input')
      if (element === null) throw new Error('expected the mounted input part')
      return element
    }

    expect(m.scope.getByRole('button', { name: 'First' })).toBeVisible()

    setInitial('Second')
    await m.settle()
    expect(m.scope.getByRole('button', { name: 'First' })).toBeVisible()
    expect(input()).toHaveValue('First')
    expect(changed).not.toHaveBeenCalled()

    fireEvent.click(m.scope.getByRole('button', { name: 'First' }))
    await m.settle()
    fireEvent.input(m.scope.getByRole('textbox'), { target: { value: 'Edited' } })
    await m.settle()
    fireEvent.click(m.scope.getByRole('button', { name: 'Save' }))
    await m.settle()
    expect(changed).toHaveBeenCalledExactlyOnceWith('Edited')

    setInitial('Third')
    await m.settle()
    expect(m.scope.getByRole('button', { name: 'Edited' })).toBeVisible()
  })

  test('an empty preview shows the placeholder and yields to a committed value reactively', async () => {
    const [value, setValue] = createSignal('')
    const m = mount(() => (
      <Editable value={value()} placeholder="Add a title">
        <Editable.Preview />
        <Editable.Input />
      </Editable>
    ))

    expect(m.scope.getByRole('button', { name: 'Add a title' })).toBeVisible()
    expect(m.container.querySelector('input')).toHaveAttribute('placeholder', 'Add a title')

    setValue('Real')
    await m.settle()
    expect(m.scope.getByRole('button', { name: 'Real' })).toBeVisible()

    setValue('')
    await m.settle()
    expect(m.scope.getByRole('button', { name: 'Add a title' })).toBeVisible()

    // With neither text nor a placeholder the preview falls back to its default label.
    const bare = mount(() => (
      <Editable>
        <Editable.Preview />
      </Editable>
    ))
    expect(bare.scope.getByRole('button', { name: 'Edit' })).toBeVisible()
  })

  test('a disabled editor refuses activation with an unreachable preview and re-enables reactively', async () => {
    const [off, setOff] = createSignal(true)
    const m = mount(() => (
      <Editable disabled={off()} defaultValue="Locked">
        <Editable.Preview />
        <Editable.Input />
      </Editable>
    ))
    const input = () => {
      const element = m.container.querySelector('input')
      if (element === null) throw new Error('expected the mounted input part')
      return element
    }
    const preview = () => {
      const element = m.container.querySelector('span[role="button"]')
      if (element === null) throw new Error('expected the mounted preview part')
      return element
    }

    expect(preview()).toHaveAttribute('tabindex', '-1')
    expect(preview()).toHaveAttribute('aria-disabled', 'true')
    expect(preview()).toHaveAttribute('data-disabled', '')
    expect(input()).toHaveAttribute('hidden')
    expect(input()).toHaveAttribute('disabled')

    fireEvent.click(preview())
    await m.settle()
    expect(input()).toHaveAttribute('hidden')

    setOff(false)
    await m.settle()
    expect(preview()).toHaveAttribute('tabindex', '0')
    expect(preview()).not.toHaveAttribute('aria-disabled')
    expect(preview()).not.toHaveAttribute('data-disabled')
    expect(input()).not.toHaveAttribute('disabled')

    fireEvent.click(preview())
    await m.settle()
    expect(input()).not.toHaveAttribute('hidden')
  })
})
