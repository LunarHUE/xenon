import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { Popover } from './popover'

afterEach(cleanup)

test('Popover Trigger and Close leave type policy to the rendered Button host', () => {
  const [type, setType] = createSignal<'submit' | 'reset' | undefined>('submit')
  const view = render(() => (
    <Popover forceMount>
      <Popover.Trigger>Default trigger</Popover.Trigger>
      <Popover.Trigger type={type()}>Author trigger</Popover.Trigger>
      <Popover.Trigger as="span">Generic trigger</Popover.Trigger>
      <Popover.Trigger as="a" href="#reference">
        Link trigger
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Details">
          <Popover.Close aria-label="Default close">Default close</Popover.Close>
          <Popover.Close type={type()} aria-label="Author close">
            Author close
          </Popover.Close>
          <Popover.Close as="span" aria-label="Generic close">
            Generic close
          </Popover.Close>
          <Popover.Close as="a" href="#reference" aria-label="Link close">
            Link close
          </Popover.Close>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  flush()
  const nodes = (suffix: string) =>
    ['trigger', 'close'].map((part) => view.getByText(`${suffix} ${part}`))
  for (const element of nodes('Default')) expect(element).toHaveAttribute('type', 'button')
  for (const element of nodes('Author')) expect(element).toHaveAttribute('type', 'submit')
  for (const element of [...nodes('Generic'), ...nodes('Link')])
    expect(element).not.toHaveAttribute('type')
  setType('reset')
  flush()
  for (const element of nodes('Author')) expect(element).toHaveAttribute('type', 'reset')
  setType(undefined)
  flush()
  for (const element of nodes('Author')) {
    expect(element).not.toHaveAttribute('type')
    expect(element).toHaveProperty('type', 'submit')
  }
  for (const element of nodes('Default')) expect(element).toHaveAttribute('type', 'button')
})
