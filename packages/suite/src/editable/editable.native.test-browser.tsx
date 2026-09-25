/**
 * Native key, focus-departure, and commit-precedence behavior for the inline Editable.
 *
 * These cases belong to the browser project because commit-on-blur is only observable
 * when the engine really moves focus: an outside press, a Tab to a neighboring trigger,
 * and a canceled press that never leaves the widget are indistinguishable under
 * synthetic events. Escape's precedence over the Enter commit path is likewise a real
 * key sequence against the focused native textbox.
 */
import { Editable } from '@xenon-ui/solid/editable'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
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

/** Scoped query surface of one mounted fixture. */
interface Fixture {
  /**
   * Finds the single element matching a role and optional accessible name.
   * @throws When no element or more than one element matches.
   */
  getByRole(role: string, options?: { name?: string }): HTMLElement
}

/** Renders into the body, registers disposal, and exposes scoped queries. */
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

/** Flushes Solid and one frame so native focus and rendering have settled. */
async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

/** Delivers a native key sequence to the focused element and settles the render. */
async function press(keys: string) {
  await userEvent.keyboard(keys)
  await settle()
}

/** Performs a native pointer press and settles the render. */
async function tap(element: Element) {
  await userEvent.click(element)
  await settle()
}

/** Activates the preview, replaces the draft, and returns the visible native textbox. */
async function draft(
  scope: Fixture,
  previewName: string,
  label: string,
  text: string
): Promise<HTMLInputElement | HTMLTextAreaElement> {
  await tap(scope.getByRole('button', { name: previewName }))
  const input = scope.getByRole('textbox', { name: label }) as
    HTMLInputElement | HTMLTextAreaElement
  await userEvent.fill(input, text)
  await settle()
  return input
}

/** Fixture inputs for one inline editor beside an outside control. */
interface EditorProps {
  /** Committed text shown in the preview before any editing. */
  value: string
  /** Accessible name of the native textbox through the associated label. */
  label: string
  /** Commit gestures under test; omitted leaves the component default of both. */
  submitMode?: 'enter' | 'blur' | 'both' | 'none'
  /** Native textbox shape; a textarea reserves Enter for newlines. */
  as?: 'input' | 'textarea'
  /** Reports changed committed text. */
  onValueChange?: (value: string) => void
  /** Reports every committed value, including unchanged text. */
  onValueCommit?: (value: string) => void
  /** Reports abandoned sessions with the text held before editing. */
  onCancel?: (value: string) => void
  /** Visible text of the neighboring outside control. */
  outside: string
  /** Cancels the outside pointer's native focus move instead of leaving the widget. */
  cancelOutsideFocus?: boolean
}

/** One inline editor with explicit triggers plus a neighboring outside control. */
function Editor(props: EditorProps) {
  return (
    <>
      <Editable
        defaultValue={props.value}
        submitMode={props.submitMode}
        onValueChange={props.onValueChange}
        onValueCommit={props.onValueCommit}
        onCancel={props.onCancel}
      >
        <Editable.Label>{props.label}</Editable.Label>
        <Editable.Preview />
        <Editable.Input as={props.as} />
        <Editable.SubmitTrigger>Save</Editable.SubmitTrigger>
        <Editable.CancelTrigger>Cancel</Editable.CancelTrigger>
      </Editable>
      <button
        onMouseDown={(event) => {
          if (props.cancelOutsideFocus) event.preventDefault()
        }}
      >
        {props.outside}
      </button>
    </>
  )
}

test('Escape in the native input abandons the draft without committing and keeps the committed text', async () => {
  const changed = vi.fn()
  const committed = vi.fn()
  const canceled = vi.fn()
  const m = mount(() => (
    <Editor
      value="Original"
      label="Title"
      outside="Elsewhere"
      onValueChange={changed}
      onValueCommit={committed}
      onCancel={canceled}
    />
  ))
  const input = await draft(m, 'Original', 'Title', 'Discard')
  await press('{Escape}')

  // Escape is the cancel gesture even though Enter and blur are both live by default.
  expect(changed).not.toHaveBeenCalled()
  expect(committed).not.toHaveBeenCalled()
  expect(canceled).toHaveBeenCalledExactlyOnceWith('Original')
  const preview = m.getByRole('button', { name: 'Original' })
  expect(preview).toBeVisible()
  expect(preview).toHaveFocus()
  expect(m.queryByRole('textbox', { name: 'Title' })).toBeNull()

  // The next session starts from the committed text, not the abandoned draft.
  await tap(preview)
  expect(input.value).toBe('Original')
})

test('Tab from the input to the in-widget Save trigger is an internal focus move and does not commit early', async () => {
  const changed = vi.fn()
  const m = mount(() => (
    <Editor value="Original" label="Title" outside="Elsewhere" onValueChange={changed} />
  ))
  const input = await draft(m, 'Original', 'Title', 'Typed')
  await press('{Tab}')

  // Focus moving to a sibling part of the same widget must not read as leaving it.
  expect(m.getByRole('button', { name: 'Save' })).toHaveFocus()
  expect(changed).not.toHaveBeenCalled()
  expect(input).toBeVisible()
  expect(input.value).toBe('Typed')
  expect(m.queryByRole('button', { name: 'Original' })).toBeNull()

  // The session is still live, so the explicit trigger commits the draft once.
  await tap(m.getByRole('button', { name: 'Save' }))
  expect(changed).toHaveBeenCalledExactlyOnceWith('Typed')
})

test('blur submit mode ignores Enter and commits exactly once when native focus leaves the widget', async () => {
  const changed = vi.fn()
  const m = mount(() => (
    <Editor
      value="Original"
      label="Title"
      submitMode="blur"
      outside="Elsewhere"
      onValueChange={changed}
    />
  ))
  const input = await draft(m, 'Original', 'Title', 'Blurred')
  await press('{Enter}')

  // Enter belongs to the enter-capable modes, so blur mode keeps editing with the draft.
  expect(changed).not.toHaveBeenCalled()
  expect(input).toBeVisible()
  expect(input.value).toBe('Blurred')

  await tap(m.getByRole('button', { name: 'Elsewhere' }))
  expect(changed).toHaveBeenCalledExactlyOnceWith('Blurred')
  expect(m.getByRole('button', { name: 'Blurred' })).toBeVisible()
})

test('enter submit mode keeps the draft through a real outside blur and commits on the next Enter', async () => {
  const changed = vi.fn()
  const m = mount(() => (
    <Editor
      value="Original"
      label="Title"
      submitMode="enter"
      outside="Elsewhere"
      onValueChange={changed}
    />
  ))
  const input = await draft(m, 'Original', 'Title', 'Entered')
  await tap(m.getByRole('button', { name: 'Elsewhere' }))

  // Only blur-capable modes commit on focus departure, so the session stays open.
  expect(changed).not.toHaveBeenCalled()
  expect(input).toBeVisible()
  expect(input.value).toBe('Entered')

  // Refocus the still-open textbox; Enter is the commit gesture this mode owns.
  await tap(input)
  await press('{Enter}')
  expect(changed).toHaveBeenCalledExactlyOnceWith('Entered')
  expect(m.getByRole('button', { name: 'Entered' })).toBeVisible()
})

test('multiline drafts commit both lines on outside blur while Enter inserts a newline and Escape abandons', async () => {
  const changed = vi.fn()
  const canceled = vi.fn()
  const m = mount(() => (
    <Editor
      value="Line"
      label="Notes"
      as="textarea"
      outside="Elsewhere"
      onValueChange={changed}
      onCancel={canceled}
    />
  ))
  const input = await draft(m, 'Line', 'Notes', 'First')
  await press('{Enter}Second')

  // A textarea reserves Enter for the newline even under the default commit mode.
  expect(input.value).toBe('First\nSecond')
  expect(changed).not.toHaveBeenCalled()

  await press('{Escape}')
  expect(canceled).toHaveBeenCalledExactlyOnceWith('Line')
  expect(changed).not.toHaveBeenCalled()
  const preview = m.getByRole('button', { name: 'Line' })
  expect(preview.textContent).toBe('Line')

  const again = await draft(m, 'Line', 'Notes', 'Kept')
  await press('{Enter}more')
  expect(again.value).toBe('Kept\nmore')
  await tap(m.getByRole('button', { name: 'Elsewhere' }))
  expect(changed).toHaveBeenCalledExactlyOnceWith('Kept\nmore')
  expect(preview.textContent).toBe('Kept\nmore')
  expect(preview).toBeVisible()
})

test('an outside press whose native focus move is canceled keeps the session and the draft in place', async () => {
  const changed = vi.fn()
  const m = mount(() => (
    <Editor
      value="Original"
      label="Title"
      outside="Canceled outside press"
      cancelOutsideFocus
      onValueChange={changed}
    />
  ))
  const input = await draft(m, 'Original', 'Title', 'Held')
  await tap(m.getByRole('button', { name: 'Canceled outside press' }))

  // The commit gesture is the focus departure itself, so a canceled press cannot commit.
  expect(input).toHaveFocus()
  expect(input).toBeVisible()
  expect(input.value).toBe('Held')
  expect(changed).not.toHaveBeenCalled()

  await press('{Enter}')
  expect(changed).toHaveBeenCalledExactlyOnceWith('Held')
})

test('explicit completion returns focus to the preview that shows the newly committed text', async () => {
  const changed = vi.fn()
  const m = mount(() => (
    <Editor value="Old" label="Title" outside="Elsewhere" onValueChange={changed} />
  ))
  await draft(m, 'Old', 'Title', 'Entered')
  await press('{Enter}')

  // Enter leaves the editor, so the renamed preview takes focus back from the hidden input.
  const renamed = m.getByRole('button', { name: 'Entered' })
  expect(renamed).toBeVisible()
  expect(renamed).toHaveFocus()

  await tap(renamed)
  const input = m.getByRole('textbox', { name: 'Title' }) as HTMLInputElement
  await userEvent.fill(input, 'Saved')
  await settle()
  await tap(m.getByRole('button', { name: 'Save' }))

  // The trigger hides as the session ends, which makes the preview the focus owner again.
  expect(m.getByRole('button', { name: 'Saved' })).toHaveFocus()
  expect(changed.mock.calls).toEqual([['Entered'], ['Saved']])
})

test('an unchanged draft reports a commit without reporting a changed value', async () => {
  const changed = vi.fn()
  const committed = vi.fn()
  const m = mount(() => (
    <Editor
      value="Original"
      label="Title"
      outside="Elsewhere"
      onValueChange={changed}
      onValueCommit={committed}
    />
  ))

  // Leaving the widget without typing still completes the draft as a commit.
  await tap(m.getByRole('button', { name: 'Original' }))
  await tap(m.getByRole('button', { name: 'Elsewhere' }))
  expect(committed).toHaveBeenCalledExactlyOnceWith('Original')
  expect(changed).not.toHaveBeenCalled()
  expect(m.getByRole('button', { name: 'Original' })).toBeVisible()

  // A changed draft reports the new value as well as the commit.
  await draft(m, 'Original', 'Title', 'Changed')
  await tap(m.getByRole('button', { name: 'Elsewhere' }))
  expect(committed.mock.calls).toEqual([['Original'], ['Changed']])
  expect(changed).toHaveBeenCalledExactlyOnceWith('Changed')
})
