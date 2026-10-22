import { Editable } from '@xenon-ui/solid/editable'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []

function cleanup() {
  cleanups
    .splice(0)
    .reverse()
    .forEach((dispose) => dispose())
  flush()
}

afterEach(cleanup)

function mount(props: {
  defaultValue: string
  label?: string
  maxLength?: number
  onValueCommit?: (value: string) => void
}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <Editable
        defaultValue={props.defaultValue}
        maxLength={props.maxLength}
        onValueCommit={props.onValueCommit}
      >
        <Editable.Label>{props.label ?? 'Title'}</Editable.Label>
        {/* An empty preview renders no text, so give it a box the way a styled app would. */}
        <Editable.Preview
          style={{ display: 'inline-block', 'min-width': '4ch', 'min-height': '1lh' }}
        />
        <Editable.Input />
        <Editable.SubmitTrigger>Save</Editable.SubmitTrigger>
        <Editable.CancelTrigger>Cancel</Editable.CancelTrigger>
      </Editable>
    ),
    container
  )
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return { ...within(container), container }
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

test('editable.keyboard.1 Enter commits its payload, shows the preview, and hides the editor', async () => {
  const committed = vi.fn()
  const q = mount({ defaultValue: 'Original', onValueCommit: committed })

  await userEvent.click(q.getByRole('button', { name: 'Original' }))
  const input = q.getByRole('textbox', { name: 'Title' })
  await userEvent.fill(input, 'Updated')
  await userEvent.keyboard('{Enter}')
  await settle()

  expect(committed).toHaveBeenCalledExactlyOnceWith('Updated')
  expect(q.getByRole('button', { name: 'Updated' })).toBeVisible()
  expect(q.queryByRole('textbox', { name: 'Title' })).toBeNull()
  expect(q.container.querySelector('input')).toHaveAttribute('hidden')
})

test('editable.keyboard.3 Escape with an unchanged draft retains the current value', async () => {
  const committed = vi.fn()
  const q = mount({ defaultValue: 'Original', onValueCommit: committed })

  await userEvent.click(q.getByRole('button', { name: 'Original' }))
  await userEvent.keyboard('{Escape}')
  await settle()

  const preview = q.getByRole('button', { name: 'Original' })
  expect(preview).toBeVisible()
  expect(preview).toHaveFocus()
  expect(q.queryByRole('textbox', { name: 'Title' })).toBeNull()
  expect(committed).not.toHaveBeenCalled()
})

test('editable.state.5 native typing respects maxLength and still permits backspace replacement', async () => {
  const cases = [
    { maxLength: 10, typed: 'lorem ipsum dolor sit amet', expected: 'lorem ipsu' },
    { maxLength: 4, typed: 'Naruto', expected: 'Naru' },
  ]

  for (const example of cases) {
    const q = mount({ defaultValue: '', maxLength: example.maxLength })
    await userEvent.click(q.getByRole('button', { name: 'Edit' }))
    const input = q.getByRole('textbox', { name: 'Title' })
    await userEvent.type(input, example.typed)
    expect(input).toHaveValue(example.expected)

    await userEvent.keyboard('{Backspace}')
    await userEvent.type(input, 'x')
    expect(input).toHaveValue(`${example.expected.slice(0, -1)}x`)
    // A focused editor left mounted commits on the next click and changes the
    // layout under the pointer before it releases (#63).
    cleanup()
  }
})

test('editable.state.6 three full-deletion cancel cycles restore the stored preview value', async () => {
  const q = mount({ defaultValue: 'Stored' })

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await userEvent.click(q.getByRole('button', { name: 'Stored' }))
    const input = q.getByRole('textbox', { name: 'Title' })
    await userEvent.keyboard('{Backspace}')
    expect(input).toHaveValue('')
    await userEvent.click(q.getByRole('button', { name: 'Cancel' }))
    await settle()
    expect(q.getByRole('button', { name: 'Stored' })).toBeVisible()
  }
})
