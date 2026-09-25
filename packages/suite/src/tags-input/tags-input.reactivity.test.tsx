/**
 * Reactive state and lifecycle coverage for TagsInput: controlled add/remove
 * rejection, dynamic delimiter and collection props, Field-inherited state, and
 * release of the per-tag edit lock when a collection changes around it. Every
 * case drives synthetic DOM events, so the same file runs unchanged under both
 * the jsdom and browser projects; no OS IME, clipboard, pointer, or native
 * focus behavior is exercised here.
 */
import { Field } from '@xenon-ui/solid'
import { TagsInput } from '@xenon-ui/solid/tags-input'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal, flush, For } from 'solid-js'
import type { Setter } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

/** Fixture disposers, unwound after each test because these roots are caller-owned. */
const cleanups: (() => void)[] = []
/** Renders into the body, registers disposal, and exposes queries scoped to the root. */
function mount(children: () => JSX.Element) {
  const root = document.createElement('div')
  document.body.append(root)
  const dispose = render(children, root)
  cleanups.push(() => {
    dispose()
    root.remove()
  })
  flush()
  return { root, ...within(root) }
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})
/** Tag occurrences in source order, read from the public item data attributes. */
function values(root: HTMLElement) {
  return [...root.querySelectorAll('[data-part="item"]')].map((item) =>
    item.getAttribute('data-value')
  )
}

describe('tags-input reactive state and lifecycle', () => {
  test('controlled collections report proposed additions and removals while the rendered tags and form entries stay authored', () => {
    const change = vi.fn()
    const view = mount(() => (
      <form>
        <TagsInput name="tags" value={['alpha', 'beta']} onValueChange={change}>
          {(state) => (
            <TagsInput.Control>
              <TagsInput.Label>Tags</TagsInput.Label>
              <For each={state.value}>
                {(_, index) => (
                  <TagsInput.Item index={index()}>
                    <TagsInput.ItemText />
                    <TagsInput.ItemInput />
                    <TagsInput.ItemDeleteTrigger>Remove</TagsInput.ItemDeleteTrigger>
                  </TagsInput.Item>
                )}
              </For>
              <TagsInput.Input />
            </TagsInput.Control>
          )}
        </TagsInput>
      </form>
    ))
    const input = view.getByRole('textbox', { name: 'Tags' })
    const form = view.root.querySelector('form')!
    // A proposed addition is reported, but the author-owned array keeps rendering.
    fireEvent.input(input, { target: { value: 'gamma' } })
    flush()
    fireEvent.keyDown(input, { key: 'Enter' })
    flush()
    expect(change).toHaveBeenCalledExactlyOnceWith(['alpha', 'beta', 'gamma'])
    expect(values(view.root)).toEqual(['alpha', 'beta'])
    expect(new FormData(form).getAll('tags')).toEqual(['alpha', 'beta'])
    // The removal trigger reports the proposal and leaves the collection intact too.
    fireEvent.click(view.getByRole('button', { name: 'Remove beta' }))
    flush()
    expect(change).toHaveBeenLastCalledWith(['alpha'])
    expect(change).toHaveBeenCalledTimes(2)
    expect(values(view.root)).toEqual(['alpha', 'beta'])
    expect(new FormData(form).getAll('tags')).toEqual(['alpha', 'beta'])
  })

  test('a reactive controlled collection re-renders every duplicate occurrence and removes exactly the requested index', () => {
    const change = vi.fn()
    let setValue!: Setter<string[]>
    const view = mount(() => {
      const [value, set] = createSignal(['alpha', 'beta', 'beta'])
      setValue = set
      return (
        <TagsInput value={value()} allowDuplicates onValueChange={change}>
          {(state) => (
            <TagsInput.Control>
              <TagsInput.Input aria-label="Tags" />
              <For each={state.value}>
                {(_, index) => (
                  <TagsInput.Item index={index()}>
                    <TagsInput.ItemText />
                    <TagsInput.ItemDeleteTrigger>Remove</TagsInput.ItemDeleteTrigger>
                  </TagsInput.Item>
                )}
              </For>
            </TagsInput.Control>
          )}
        </TagsInput>
      )
    })
    expect(values(view.root)).toEqual(['alpha', 'beta', 'beta'])
    const removals = view.getAllByRole('button', { name: 'Remove beta' })
    expect(removals).toHaveLength(2)
    // Removing the second occurrence reports only that index leaving the authored list untouched.
    fireEvent.click(removals[1]!)
    flush()
    expect(change).toHaveBeenCalledExactlyOnceWith(['alpha', 'beta'])
    expect(values(view.root)).toEqual(['alpha', 'beta', 'beta'])
    // Applying the proposal re-renders the remaining occurrences in source order.
    setValue(['alpha', 'beta'])
    flush()
    expect(values(view.root)).toEqual(['alpha', 'beta'])
  })

  test('capacity and predicate rejections keep the draft out of the collection until a change is permitted', () => {
    const change = vi.fn()
    const view = mount(() => (
      <TagsInput
        defaultValue={['alpha', 'beta']}
        max={3}
        validate={(value) => value !== 'blocked'}
        onValueChange={change}
      >
        {(state) => (
          <TagsInput.Control>
            <TagsInput.Input aria-label="Tags" />
            <For each={state.value}>
              {(_, index) => (
                <TagsInput.Item index={index()}>
                  <TagsInput.ItemText />
                  <TagsInput.ItemDeleteTrigger>Remove</TagsInput.ItemDeleteTrigger>
                </TagsInput.Item>
              )}
            </For>
          </TagsInput.Control>
        )}
      </TagsInput>
    ))
    const input = view.getByRole('textbox', { name: 'Tags' })
    // The validate predicate rejects an entry and the draft is retained for the user.
    fireEvent.input(input, { target: { value: 'blocked' } })
    flush()
    fireEvent.keyDown(input, { key: 'Enter' })
    flush()
    expect(change).not.toHaveBeenCalled()
    expect(input).toHaveValue('blocked')
    expect(values(view.root)).toEqual(['alpha', 'beta'])
    // A permitted value fills the remaining capacity and clears the draft.
    fireEvent.input(input, { target: { value: 'gamma' } })
    flush()
    fireEvent.keyDown(input, { key: 'Enter' })
    flush()
    expect(change).toHaveBeenCalledExactlyOnceWith(['alpha', 'beta', 'gamma'])
    expect(input).toHaveValue('')
    // The max cap rejects the next entry while its draft stays readable.
    fireEvent.input(input, { target: { value: 'delta' } })
    flush()
    fireEvent.keyDown(input, { key: 'Enter' })
    flush()
    expect(change).toHaveBeenCalledTimes(1)
    expect(input).toHaveValue('delta')
    expect(values(view.root)).toEqual(['alpha', 'beta', 'gamma'])
    // Freeing a slot lets the retained draft be accepted on the next submission.
    fireEvent.click(view.getByRole('button', { name: 'Remove beta' }))
    flush()
    expect(change).toHaveBeenLastCalledWith(['alpha', 'gamma'])
    fireEvent.keyDown(input, { key: 'Enter' })
    flush()
    expect(change).toHaveBeenLastCalledWith(['alpha', 'gamma', 'delta'])
    expect(values(view.root)).toEqual(['alpha', 'gamma', 'delta'])
  })

  test('the delimiter prop is read live and an empty delimiter disables splitting', () => {
    const change = vi.fn()
    let setDelimiter!: Setter<string>
    const view = mount(() => {
      const [delimiter, set] = createSignal(',')
      setDelimiter = set
      return (
        <TagsInput delimiter={delimiter()} defaultValue={[]} onValueChange={change}>
          {(state) => (
            <TagsInput.Control>
              <TagsInput.Input aria-label="Tags" />
              <For each={state.value}>
                {(_, index) => (
                  <TagsInput.Item index={index()}>
                    <TagsInput.ItemText />
                  </TagsInput.Item>
                )}
              </For>
            </TagsInput.Control>
          )}
        </TagsInput>
      )
    })
    const input = view.getByRole('textbox', { name: 'Tags' })
    fireEvent.input(input, { target: { value: 'one,two' } })
    flush()
    expect(change).toHaveBeenLastCalledWith(['one', 'two'])
    expect(input).toHaveValue('')
    // Changing the delimiter makes the new character split and the old one literal.
    setDelimiter(';')
    flush()
    fireEvent.input(input, { target: { value: 'three;four' } })
    flush()
    expect(change).toHaveBeenLastCalledWith(['one', 'two', 'three', 'four'])
    expect(input).toHaveValue('')
    fireEvent.input(input, { target: { value: 'five,six' } })
    flush()
    expect(input).toHaveValue('five,six')
    expect(change).toHaveBeenCalledTimes(2)
    fireEvent.keyDown(input, { key: 'Enter' })
    flush()
    expect(change).toHaveBeenLastCalledWith(['one', 'two', 'three', 'four', 'five,six'])
    // An empty delimiter disables splitting entirely, including the former default.
    setDelimiter('')
    flush()
    fireEvent.input(input, { target: { value: 'seven,eight' } })
    flush()
    expect(input).toHaveValue('seven,eight')
    expect(change).toHaveBeenCalledTimes(3)
    fireEvent.keyDown(input, { key: 'Enter' })
    flush()
    expect(change).toHaveBeenLastCalledWith([
      'one',
      'two',
      'three',
      'four',
      'five,six',
      'seven,eight',
    ])
    expect(values(view.root)).toEqual(['one', 'two', 'three', 'four', 'five,six', 'seven,eight'])
  })

  test('an enclosing Field drives invalid marking and edit-lock state reactively', () => {
    const [invalid, setInvalid] = createSignal(false)
    const [disabled, setDisabled] = createSignal(false)
    const view = mount(() => (
      <Field invalid={invalid()} disabled={disabled()}>
        <Field.Label>Outer tags</Field.Label>
        <TagsInput name="tags" defaultValue={['alpha']}>
          {(state) => (
            <TagsInput.Control>
              <TagsInput.Input />
              <TagsInput.ClearTrigger>Clear</TagsInput.ClearTrigger>
              <For each={state.value}>
                {(_, index) => (
                  <TagsInput.Item index={index()}>
                    <TagsInput.ItemText />
                    <TagsInput.ItemInput />
                    <TagsInput.ItemDeleteTrigger>Remove</TagsInput.ItemDeleteTrigger>
                  </TagsInput.Item>
                )}
              </For>
            </TagsInput.Control>
          )}
        </TagsInput>
        <Field.Error>Fix the tags</Field.Error>
      </Field>
    ))
    const input = view.getByRole('textbox', { name: 'Outer tags' })
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(view.queryByText('Fix the tags')).toBeNull()
    // Invalid state reaches the textbox and renders the registered error text.
    setInvalid(true)
    flush()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(view.getByText('Fix the tags')).toBeVisible()
    setInvalid(false)
    flush()
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(view.queryByText('Fix the tags')).toBeNull()
    const remove = view.getByRole('button', { name: 'Remove alpha' })
    const clear = view.getByRole('button', { name: 'Clear tags' })
    expect(input).not.toBeDisabled()
    expect(remove).not.toBeDisabled()
    expect(clear).not.toBeDisabled()
    // A disabled Field locks the textbox, both triggers, and inline editing.
    setDisabled(true)
    flush()
    expect(input).toBeDisabled()
    expect(remove).toBeDisabled()
    expect(clear).toBeDisabled()
    fireEvent.doubleClick(view.root.querySelector('[data-value="alpha"]')!)
    flush()
    expect(view.queryByRole('textbox', { name: 'Edit alpha' })).toBeNull()
    expect(values(view.root)).toEqual(['alpha'])
    // Clearing the lock restores the textbox and permits the inline editor again.
    setDisabled(false)
    flush()
    expect(input).not.toBeDisabled()
    fireEvent.doubleClick(view.root.querySelector('[data-value="alpha"]')!)
    flush()
    expect(view.getByRole('textbox', { name: 'Edit alpha' })).toBeVisible()
  })

  test('an open tag editor inherits readonly and per-item disabled changes', () => {
    let setReadonly!: Setter<boolean>
    let setItemDisabled!: Setter<boolean>
    const view = mount(() => {
      const [readonly, setReadonlySignal] = createSignal(false)
      const [itemDisabled, setItemDisabledSignal] = createSignal(false)
      setReadonly = setReadonlySignal
      setItemDisabled = setItemDisabledSignal
      return (
        <TagsInput defaultValue={['alpha', 'beta']} readonly={readonly()}>
          {(state) => (
            <TagsInput.Control>
              <TagsInput.Input aria-label="Tags" />
              <For each={state.value}>
                {(_, index) => (
                  <TagsInput.Item index={index()} disabled={index() === 1 ? itemDisabled() : false}>
                    <TagsInput.ItemText />
                    <TagsInput.ItemInput />
                    <TagsInput.ItemDeleteTrigger>Remove</TagsInput.ItemDeleteTrigger>
                  </TagsInput.Item>
                )}
              </For>
            </TagsInput.Control>
          )}
        </TagsInput>
      )
    })
    fireEvent.doubleClick(view.root.querySelector('[data-value="beta"]')!)
    flush()
    const editor = view.getByRole('textbox', { name: 'Edit beta' })
    expect(editor).not.toHaveAttribute('readonly')
    // Turning the root read-only reaches the already open editor instead of closing it.
    setReadonly(true)
    flush()
    expect(view.getByRole('textbox', { name: 'Edit beta' })).toBe(editor)
    expect(editor).toHaveAttribute('readonly')
    setReadonly(false)
    flush()
    expect(editor).not.toHaveAttribute('readonly')
    expect(editor).not.toBeDisabled()
    // A per-item disabled change locks that open editor and its removal button.
    setItemDisabled(true)
    flush()
    expect(editor).toBeDisabled()
    expect(view.getByRole('button', { name: 'Remove beta' })).toBeDisabled()
    expect(view.getByRole('button', { name: 'Remove alpha' })).not.toBeDisabled()
  })

  test('replacing the edited occurrence releases the edit lock so a later tag does not open an editor', () => {
    let setValue!: Setter<string[]>
    const view = mount(() => {
      const [value, set] = createSignal(['alpha', 'beta'])
      setValue = set
      return (
        <TagsInput value={value()}>
          {(state) => (
            <TagsInput.Control>
              <TagsInput.Input aria-label="Tags" />
              <For each={state.value}>
                {(_, index) => (
                  <TagsInput.Item index={index()}>
                    <TagsInput.ItemText />
                    <TagsInput.ItemInput />
                  </TagsInput.Item>
                )}
              </For>
            </TagsInput.Control>
          )}
        </TagsInput>
      )
    })
    fireEvent.doubleClick(view.root.querySelector('[data-value="beta"]')!)
    flush()
    expect(view.getByRole('textbox', { name: 'Edit beta' })).toBeVisible()
    // The edited occurrence leaves the collection; no editor should survive it.
    setValue(['alpha'])
    flush()
    expect(view.queryByRole('textbox', { name: /^Edit / })).toBeNull()
    // A later collection that fills the same index must not inherit the stale edit lock.
    setValue(['alpha', 'gamma'])
    flush()
    expect(view.queryByRole('textbox', { name: /^Edit / })).toBeNull()
  })
})
