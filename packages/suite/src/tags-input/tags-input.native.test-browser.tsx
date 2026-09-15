/**
 * Native-browser tag editing, draft/focus boundaries, and delimiter paste for TagsInput.
 * Every fixture renders one uncontrolled collection so the assertions observe the
 * accepted tag list, the real DOM focus owner, and native text editing, not internals.
 */
import { TagsInput } from '@xenon/solid/tags-input'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { For, flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

/** Fixture disposers, unwound in reverse order after every test. */
const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})
/** Render into the body, register disposal, and expose scoped queries. */
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return { container, ...within(container) }
}
/** Flushes Solid and the microtask that a removal queues for the replacement focus. */
async function settle() {
  flush()
  await Promise.resolve()
  flush()
}
/** Moves real focus from the textbox to the last tag, then opens that tag's inline editor. */
async function openLastTagEditor() {
  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  await userEvent.keyboard('{Enter}')
  await settle()
}
/**
 * Dispatches a synthetic `paste` carrying real `DataTransfer` text. This is not an
 * OS clipboard paste; it drives the same `ClipboardEvent` the browser would deliver.
 */
function paste(target: EventTarget, text: string) {
  const clipboard = new DataTransfer()
  clipboard.setData('text/plain', text)
  const event = new ClipboardEvent('paste', {
    bubbles: true,
    cancelable: true,
    clipboardData: clipboard,
  })
  // Firefox creates an empty clipboard store instead of using ClipboardEventInit.clipboardData.
  Object.defineProperty(event, 'clipboardData', { value: clipboard })
  target.dispatchEvent(event)
  return event
}
/** Inputs for the disposable tag fixture below. */
interface FixtureProps {
  /** Opt-in commit of the remaining draft when focus leaves the whole widget. */
  addOnBlur?: boolean
  /** Opt-in commit of the remaining draft on Tab. */
  addOnTab?: boolean
  /** Receives every accepted collection change. */
  onValueChange?: (value: string[]) => void
}
/** One tags input with a field label, two indexed tags, and the main textbox. */
function Fixture(props: FixtureProps) {
  return (
    <TagsInput
      defaultValue={['alpha', 'beta']}
      addOnBlur={props.addOnBlur}
      addOnTab={props.addOnTab}
      onValueChange={props.onValueChange}
    >
      {(state) => (
        <>
          <TagsInput.Label>Tags</TagsInput.Label>
          <TagsInput.Control>
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
        </>
      )}
    </TagsInput>
  )
}

describe('tags-input native editing, draft focus, and paste', () => {
  test('native Enter opens the per-tag editor with its text selected so typing replaces the value', async () => {
    const change = vi.fn()
    const view = mount(() => <Fixture onValueChange={change} />)
    const input = view.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement
    const beta = view.container.querySelector<HTMLElement>('[data-value="beta"]')!
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowLeft}')
    await settle()
    expect(beta).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await settle()
    const editor = view.getByRole('textbox', { name: 'Edit beta' }) as HTMLInputElement
    expect(editor).toHaveFocus()
    expect(editor.selectionStart).toBe(0)
    expect(editor.selectionEnd).toBe('beta'.length)
    await userEvent.keyboard('updated')
    expect(editor).toHaveValue('updated')
    await userEvent.keyboard('{Enter}')
    await settle()
    expect(input).toHaveFocus()
    expect(view.container.querySelector('[data-value="updated"]')).not.toBeNull()
    expect(view.container.querySelector('[data-value="beta"]')).toBeNull()
    expect(change).toHaveBeenCalledExactlyOnceWith(['alpha', 'updated'])
  })
  test('Escape or leaving the widget cancels the per-tag editor and keeps the original tag', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <>
        <Fixture onValueChange={change} />
        <button type="button">Outside</button>
      </>
    ))
    const input = view.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement
    const outside = view.getByRole('button', { name: 'Outside' })
    await userEvent.click(input)
    await openLastTagEditor()
    const editor = view.getByRole('textbox', { name: 'Edit beta' }) as HTMLInputElement
    await userEvent.fill(editor, 'updated')
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(editor.hidden).toBe(true)
    expect(input).toHaveFocus()
    expect(view.container.querySelector('[data-value="beta"]')).not.toBeNull()
    expect(view.container.querySelector('[data-value="updated"]')).toBeNull()
    // Losing real focus cancels the same way, discarding the typed replacement.
    await userEvent.click(input)
    await openLastTagEditor()
    expect(editor.hidden).toBe(false)
    await userEvent.fill(editor, 'discarded')
    await userEvent.click(outside)
    await settle()
    expect(editor.hidden).toBe(true)
    expect(view.container.querySelector('[data-value="discarded"]')).toBeNull()
    expect(view.container.querySelector('[data-value="beta"]')).not.toBeNull()
    expect(change).not.toHaveBeenCalled()
  })
  test('an emptied per-tag editor removes the tag on Enter and returns focus to the textbox', async () => {
    const change = vi.fn()
    const view = mount(() => <Fixture onValueChange={change} />)
    const input = view.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement
    await userEvent.click(input)
    await openLastTagEditor()
    const editor = view.getByRole('textbox', { name: 'Edit beta' }) as HTMLInputElement
    editor.setSelectionRange(0, editor.value.length)
    await userEvent.keyboard('{Backspace}')
    expect(editor).toHaveValue('')
    await userEvent.keyboard('{Enter}')
    await settle()
    expect(change).toHaveBeenCalledExactlyOnceWith(['alpha'])
    expect(view.container.querySelector('[data-value="beta"]')).toBeNull()
    expect(view.container.querySelectorAll('[data-part="item"]')).toHaveLength(1)
    expect(input).toHaveFocus()
  })
  test('addOnBlur commits the remaining draft when focus leaves the widget and never repeats an Enter submission', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <>
        <Fixture addOnBlur onValueChange={change} />
        <button type="button">Outside</button>
      </>
    ))
    const input = view.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement
    const outside = view.getByRole('button', { name: 'Outside' })
    await userEvent.click(input)
    await userEvent.type(input, 'gamma')
    await userEvent.click(outside)
    await settle()
    expect(change).toHaveBeenCalledExactlyOnceWith(['alpha', 'beta', 'gamma'])
    expect(view.container.querySelector('[data-value="gamma"]')).not.toBeNull()
    expect(input).toHaveValue('')
    await userEvent.click(input)
    await userEvent.type(input, 'delta')
    await userEvent.keyboard('{Enter}')
    await settle()
    await userEvent.click(outside)
    await settle()
    expect(change).toHaveBeenCalledTimes(2)
    expect(change).toHaveBeenLastCalledWith(['alpha', 'beta', 'gamma', 'delta'])
    expect(view.container.querySelectorAll('[data-value="delta"]')).toHaveLength(1)
  })
  test('addOnBlur waits while focus moves between the textbox and a tag inside the widget', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <>
        <Fixture addOnBlur onValueChange={change} />
        <button type="button">Outside</button>
      </>
    ))
    const input = view.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement
    const beta = view.container.querySelector<HTMLElement>('[data-value="beta"]')!
    await userEvent.click(input)
    await userEvent.type(input, 'gamma')
    await userEvent.keyboard('{Home}')
    expect(input.selectionStart).toBe(0)
    await userEvent.keyboard('{ArrowLeft}')
    await settle()
    expect(beta).toHaveFocus()
    expect(input).toHaveValue('gamma')
    expect(view.container.querySelector('[data-value="gamma"]')).toBeNull()
    expect(change).not.toHaveBeenCalled()
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(input).toHaveFocus()
    expect(input).toHaveValue('gamma')
    expect(change).not.toHaveBeenCalled()
    await userEvent.click(view.getByRole('button', { name: 'Outside' }))
    await settle()
    expect(change).toHaveBeenCalledExactlyOnceWith(['alpha', 'beta', 'gamma'])
  })
  test('a draft preserves native text editing: ArrowLeft only leaves the textbox from caret zero and Backspace edits text without touching tags', async () => {
    const change = vi.fn()
    const view = mount(() => <Fixture onValueChange={change} />)
    const input = view.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement
    const beta = view.container.querySelector<HTMLElement>('[data-value="beta"]')!
    await userEvent.click(input)
    await userEvent.type(input, 'gamma')
    await userEvent.keyboard('{ArrowLeft}')
    expect(input).toHaveFocus()
    expect(input.selectionStart).toBe(4)
    expect(input.selectionEnd).toBe(4)
    expect(view.container.querySelector('[data-highlighted]')).toBeNull()
    await userEvent.keyboard('{Backspace}')
    expect(input).toHaveFocus()
    expect(input).toHaveValue('gama')
    expect(view.container.querySelectorAll('[data-part="item"]')).toHaveLength(2)
    expect(change).not.toHaveBeenCalled()
    await userEvent.keyboard('{Home}')
    await userEvent.keyboard('{ArrowLeft}')
    await settle()
    expect(beta).toHaveFocus()
    expect(input).toHaveValue('gama')
    await userEvent.keyboard('{End}')
    await settle()
    expect(input).toHaveFocus()
    expect(input).toHaveValue('gama')
    expect(change).not.toHaveBeenCalled()
  })
  test('tag navigation does not wrap, ArrowRight returns focus to the textbox, and a printable key redirects there', async () => {
    const change = vi.fn()
    const view = mount(() => <Fixture onValueChange={change} />)
    const input = view.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement
    const alpha = view.container.querySelector<HTMLElement>('[data-value="alpha"]')!
    const beta = view.container.querySelector<HTMLElement>('[data-value="beta"]')!
    await userEvent.click(input)
    await userEvent.keyboard('{Backspace}')
    await settle()
    expect(beta).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    await settle()
    expect(alpha).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    await settle()
    expect(alpha).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await settle()
    expect(beta).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await settle()
    expect(input).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    await settle()
    expect(beta).toHaveFocus()
    await userEvent.keyboard('x')
    await settle()
    expect(input).toHaveFocus()
    expect(input).toHaveValue('x')
    expect(view.container.querySelectorAll('[data-part="item"]')).toHaveLength(2)
    expect(change).not.toHaveBeenCalled()
  })
  test('a delimiter paste splits at the caret and clears the draft while an undelimited paste stays with the browser', async () => {
    const change = vi.fn()
    const view = mount(() => <Fixture onValueChange={change} />)
    const input = view.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement
    await userEvent.click(input)
    await userEvent.type(input, 'ab')
    input.setSelectionRange(1, 1)
    const split = paste(input, 'x,y')
    await settle()
    expect(split.defaultPrevented).toBe(true)
    expect(change).toHaveBeenCalledExactlyOnceWith(['alpha', 'beta', 'ax', 'yb'])
    expect(input).toHaveFocus()
    expect(input).toHaveValue('')
    expect(view.container.querySelector('[data-value="ax"]')).not.toBeNull()
    expect(view.container.querySelector('[data-value="yb"]')).not.toBeNull()
    const plain = paste(input, 'gamma')
    await settle()
    expect(plain.defaultPrevented).toBe(false)
    expect(change).toHaveBeenCalledOnce()
    expect(view.container.querySelector('[data-value="gamma"]')).toBeNull()
    expect(input).toHaveValue('')
  })
  test('an author onPaste preventDefault cancels the built-in delimiter split', async () => {
    const change = vi.fn()
    const seen = vi.fn()
    const view = mount(() => (
      <TagsInput defaultValue={['alpha']} onValueChange={change}>
        <TagsInput.Input
          aria-label="Tags"
          onPaste={(event) => {
            seen(event)
            event.preventDefault()
          }}
        />
      </TagsInput>
    ))
    const input = view.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement
    await userEvent.click(input)
    const event = paste(input, 'one,two')
    await settle()
    expect(seen).toHaveBeenCalledOnce()
    expect(event.defaultPrevented).toBe(true)
    expect(change).not.toHaveBeenCalled()
    expect(view.container.querySelector('[data-part="item"]')).toBeNull()
  })
  test('addOnTab commits the draft and still moves focus onward', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <>
        <Fixture addOnTab onValueChange={change} />
        <button type="button">Outside</button>
      </>
    ))
    const input = view.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement
    const outside = view.getByRole('button', { name: 'Outside' })
    await userEvent.click(input)
    await userEvent.type(input, 'gamma')
    await userEvent.keyboard('{Tab}')
    await settle()
    expect(change).toHaveBeenCalledExactlyOnceWith(['alpha', 'beta', 'gamma'])
    expect(view.container.querySelector('[data-value="gamma"]')).not.toBeNull()
    expect(input).toHaveValue('')
    expect(outside).toHaveFocus()
  })
})
