import { Field } from '@xenon-ui/solid'
import { TagsInput } from '@xenon-ui/solid/tags-input'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { For, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

function mount(translated = false) {
  const container = document.createElement('div')
  document.body.append(container)
  const changed = vi.fn()
  const dispose = render(
    () => (
      <>
        <Field name="tags">
          <Field.Label>Topics</Field.Label>
          <TagsInput defaultValue={['alpha', 'beta']} onValueChange={changed}>
            {(state) => (
              <>
                <TagsInput.Control aria-label="Tag control" style={{ padding: '12px' }}>
                  <For each={state.value}>
                    {(value, index) => (
                      <TagsInput.Item index={index()}>
                        <TagsInput.ItemText />
                        <TagsInput.ItemInput
                          aria-label={translated ? `Modifier ${value}` : undefined}
                        />
                        <TagsInput.ItemDeleteTrigger aria-label={`Remove ${value}`}>
                          Remove
                        </TagsInput.ItemDeleteTrigger>
                      </TagsInput.Item>
                    )}
                  </For>
                  <TagsInput.Input />
                </TagsInput.Control>
                <TagsInput.ClearTrigger>Clear</TagsInput.ClearTrigger>
              </>
            )}
          </TagsInput>
        </Field>
        <button type="button">Outside</button>
      </>
    ),
    container
  )
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  const scope = within(container)
  return {
    container,
    changed,
    scope,
    input: scope.getByRole('textbox', { name: 'Topics' }) as HTMLInputElement,
    item: (value: string) => container.querySelector<HTMLElement>(`[data-value="${value}"]`)!,
  }
}

async function settle() {
  flush()
  await Promise.resolve()
  flush()
}

test('tags-input.pointer.1 clicking remove returns to input and ArrowLeft highlights the new last tag', async () => {
  const view = mount()
  await userEvent.click(view.scope.getByRole('button', { name: 'Remove beta' }))
  await settle()
  expect(view.container.querySelector('[data-value="beta"]')).toBeNull()
  expect(view.changed).toHaveBeenCalledExactlyOnceWith(['alpha'])
  expect(view.input).toHaveFocus()
  await userEvent.keyboard('{ArrowLeft}')
  expect(view.item('alpha')).toHaveFocus()
  expect(view.item('alpha')).toHaveAttribute('data-highlighted')
})

test('tags-input.pointer.3 clicking control padding clears highlight before Backspace', async () => {
  const view = mount()
  await userEvent.click(view.input)
  await userEvent.keyboard('{ArrowLeft}')
  expect(view.item('beta')).toHaveAttribute('data-highlighted')
  await userEvent.click(view.scope.getByLabelText('Tag control'), { position: { x: 2, y: 2 } })
  expect(view.input).toHaveFocus()
  expect(view.container.querySelector('[data-highlighted]')).toBeNull()
  await userEvent.keyboard('{Backspace}')
  expect(view.container.querySelectorAll('[data-part="item"]')).toHaveLength(2)
  expect(view.changed).not.toHaveBeenCalled()
})

test('tags-input.pointer.4 clear removes every tag and returns focus to input', async () => {
  const view = mount()
  await userEvent.click(view.scope.getByRole('button', { name: 'Clear tags' }))
  await settle()
  expect(view.container.querySelectorAll('[data-part="item"]')).toHaveLength(0)
  expect(view.changed).toHaveBeenCalledExactlyOnceWith([])
  expect(view.input).toHaveFocus()
})

test('tags-input.pointer.5 clicking tag text focuses its tag', async () => {
  const view = mount()
  await userEvent.click(view.scope.getByText('beta', { selector: '[data-part="item-text"]' }))
  expect(view.item('beta')).toHaveFocus()
  expect(view.item('beta')).toHaveAttribute('data-highlighted')
})

for (const method of ['outside click', 'Tab'] as const) {
  test(`tags-input.focus.1 ${method} leaves no highlighted tag`, async () => {
    const view = mount()
    await userEvent.click(view.input)
    await userEvent.keyboard('{ArrowLeft}')
    expect(view.item('beta')).toHaveAttribute('data-highlighted')
    if (method === 'outside click') {
      await userEvent.click(view.scope.getByRole('button', { name: 'Outside' }))
    } else {
      await userEvent.keyboard('{Tab}')
      // The delete trigger is inside the widget; continue through its native tab stops.
      for (
        let step = 0;
        step < 5 && !view.scope.getByRole('button', { name: 'Outside' }).matches(':focus');
        step++
      ) {
        await userEvent.keyboard('{Tab}')
      }
    }
    expect(view.scope.getByRole('button', { name: 'Outside' })).toHaveFocus()
    expect(view.container.querySelector('[data-highlighted]')).toBeNull()
  })
}

test('tags-input.focus.3 Field label focuses the visible textbox rather than hidden form entries', async () => {
  const view = mount()
  const hidden = [...view.container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')]
  expect(hidden).toHaveLength(2)
  await userEvent.click(view.scope.getByText('Topics', { selector: 'label' }))
  expect(view.input).toHaveFocus()
  expect(hidden.every((entry) => entry !== document.activeElement)).toBe(true)
})

test('tags-input.roles.6 author translations name hidden untabbable editors and persist during editing', async () => {
  const view = mount(true)
  const editors = [
    ...view.container.querySelectorAll<HTMLInputElement>('input[aria-label^="Modifier "]'),
  ]
  expect(editors.map((editor) => editor.getAttribute('aria-label'))).toEqual([
    'Modifier alpha',
    'Modifier beta',
  ])
  expect(editors.every((editor) => editor.hidden && editor.tabIndex === -1)).toBe(true)
  await userEvent.click(view.input)
  await userEvent.keyboard('{ArrowLeft}{Enter}')
  await settle()
  const editor = view.scope.getByRole('textbox', { name: 'Modifier beta' })
  expect(editor).toHaveFocus()
  expect(editor).not.toHaveAttribute('hidden')
  expect(editor).toHaveAttribute('tabindex', '-1')
  expect(editors[0]).toHaveAttribute('hidden')
})
