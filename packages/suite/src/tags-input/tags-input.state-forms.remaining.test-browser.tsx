import { TagsInput } from '@xenon-ui/solid/tags-input'
import type { TagsInputProps } from '@xenon-ui/solid/tags-input'
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

function mount(props: TagsInputProps = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const changed = vi.fn()
  const submitted: FormData[] = []
  const dispose = render(
    () => (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submitted.push(new FormData(event.currentTarget))
        }}
      >
        <TagsInput name="tags" defaultValue={['alpha', 'beta']} {...props} onValueChange={changed}>
          {(state) => (
            <>
              <TagsInput.Label>Tags</TagsInput.Label>
              <TagsInput.Control>
                <For each={state.value}>
                  {(value, index) => (
                    <TagsInput.Item index={index()}>
                      <TagsInput.ItemText />
                      <TagsInput.ItemInput />
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
        <button type="submit">Submit</button>
      </form>
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
    scope,
    changed,
    submitted,
    input: scope.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement,
    values: () =>
      [...container.querySelectorAll('[data-part="item"]')].map((item) =>
        item.getAttribute('data-value')
      ),
  }
}

async function settle() {
  flush()
  await Promise.resolve()
  flush()
}

test('tags-input.state.3 allowed duplicate insertions retain every occurrence and clear the draft', async () => {
  const view = mount({ defaultValue: ['alpha'], allowDuplicates: true })
  for (let occurrence = 0; occurrence < 2; occurrence++) {
    await userEvent.fill(view.input, 'alpha')
    await userEvent.keyboard('{Enter}')
    await settle()
    expect(view.input).toHaveValue('')
  }
  expect(view.values()).toEqual(['alpha', 'alpha', 'alpha'])
  expect(view.changed.mock.calls.map(([value]) => value)).toEqual([
    ['alpha', 'alpha'],
    ['alpha', 'alpha', 'alpha'],
  ])
})

for (const allowDuplicates of [false, true]) {
  test(`tags-input.state.4 editing an existing value with allowDuplicates=${allowDuplicates}`, async () => {
    const view = mount({ allowDuplicates })
    await userEvent.click(view.input)
    await userEvent.keyboard('{ArrowLeft}{Enter}')
    await settle()
    const editor = view.scope.getByRole('textbox', { name: 'Edit beta' })
    await userEvent.fill(editor, 'alpha')
    await userEvent.keyboard('{Enter}')
    await settle()
    if (allowDuplicates) {
      expect(view.values()).toEqual(['alpha', 'alpha'])
      expect(view.changed).toHaveBeenCalledExactlyOnceWith(['alpha', 'alpha'])
      expect(view.input).toHaveFocus()
      expect(view.scope.queryByRole('textbox', { name: /^Edit / })).toBeNull()
      expect(
        [...view.container.querySelectorAll<HTMLInputElement>('input[aria-label^="Edit "]')].every(
          (input) => input.hidden
        )
      ).toBe(true)
    } else {
      expect(view.values()).toEqual(['alpha', 'beta'])
      expect(view.changed).not.toHaveBeenCalled()
      expect(editor).toHaveFocus()
      expect(editor).toHaveValue('alpha')
    }
  })
}

test('tags-input.state.6 trimming precedes uniqueness and rejection preserves the original spaced draft', async () => {
  const view = mount({ defaultValue: ['alpha'], trim: true })
  await userEvent.fill(view.input, '  alpha  ')
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(view.values()).toEqual(['alpha'])
  expect(view.input).toHaveValue('  alpha  ')
  expect(view.changed).not.toHaveBeenCalled()
  await userEvent.fill(view.input, '  beta  ')
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(view.values()).toEqual(['alpha', 'beta'])
  expect(view.input).toHaveValue('')
  expect(view.changed).toHaveBeenCalledExactlyOnceWith(['alpha', 'beta'])
})

test('tags-input.forms.2 actual submissions reflect additions removals and clearing', async () => {
  const view = mount()
  const submit = view.scope.getByRole('button', { name: 'Submit' })
  await userEvent.fill(view.input, 'gamma')
  await userEvent.keyboard('{Enter}')
  await settle()
  await userEvent.click(submit)
  expect(view.submitted).toHaveLength(1)
  expect(view.submitted[0]!.getAll('tags')).toEqual(['alpha', 'beta', 'gamma'])
  await userEvent.click(view.scope.getByRole('button', { name: 'Remove beta' }))
  await settle()
  await userEvent.click(submit)
  expect(view.submitted).toHaveLength(2)
  expect(view.submitted[1]!.getAll('tags')).toEqual(['alpha', 'gamma'])
  await userEvent.click(view.scope.getByRole('button', { name: 'Clear tags' }))
  await settle()
  await userEvent.click(submit)
  expect(view.submitted).toHaveLength(3)
  expect(view.submitted[2]!.getAll('tags')).toEqual([])
})

for (const delimiter of ['.', '+', '|']) {
  test(`tags-input.notes.2 typed literal ${delimiter} delimiter splits without regex interpretation`, async () => {
    const view = mount({ defaultValue: [], delimiter })
    await userEvent.type(view.input, `one${delimiter}two${delimiter}`)
    await settle()
    expect(view.values()).toEqual(['one', 'two'])
    expect(view.input).toHaveValue('')
    expect(view.changed.mock.calls.map(([value]) => value)).toEqual([['one'], ['one', 'two']])
  })
}

test('tags-input.pointer.2 native double-click opens the tag editor and Enter commits its replacement', async () => {
  const view = mount()
  await userEvent.dblClick(view.scope.getByText('beta', { selector: '[data-part="item-text"]' }))
  await settle()
  const editor = view.scope.getByRole('textbox', { name: 'Edit beta' }) as HTMLInputElement
  expect(editor).toHaveFocus()
  expect(editor.selectionStart).toBe(0)
  expect(editor.selectionEnd).toBe(4)
  await userEvent.keyboard('updated{Enter}')
  await settle()
  expect(view.values()).toEqual(['alpha', 'updated'])
  expect(view.changed).toHaveBeenCalledExactlyOnceWith(['alpha', 'updated'])
  expect(view.scope.queryByRole('textbox', { name: /^Edit / })).toBeNull()
  expect(
    [...view.container.querySelectorAll<HTMLInputElement>('input[aria-label^="Edit "]')].every(
      (input) => input.hidden
    )
  ).toBe(true)
  expect(view.input).toHaveFocus()
})
