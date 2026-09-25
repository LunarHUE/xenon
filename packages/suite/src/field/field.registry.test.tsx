import { Field } from '@xenon-ui/solid'
import { screen } from '@testing-library/dom'
import { For, createSignal } from 'solid-js'
import { expect } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('description.roles.6', async () => {
  const [items, setItems] = createSignal(['first', 'second', 'third'])
  const m = mount('field', {
    children: () => (
      <>
        <For each={items()}>
          {(id) => (
            <>
              <Field.Label id={`label-${id}`}>{id}</Field.Label>
              <Field.Description id={`help-${id}`}>{id} help</Field.Description>
            </>
          )}
        </For>
        <Field.Control as="div" role="textbox" />
      </>
    ),
  })
  await m.settle()
  const control = screen.getByRole('textbox')
  const firstLabel = screen.getByText('first')
  expect(control).toHaveAttribute('aria-labelledby', 'label-first label-second label-third')
  expect(control).toHaveAttribute('aria-describedby', 'help-first help-second help-third')
  setItems(['first', 'third'])
  await m.settle()
  expect(screen.getByText('first')).toBe(firstLabel)
  expect(screen.queryByText('second')).toBeNull()
  expect(screen.queryByText('second help')).toBeNull()
  expect(control).toHaveAttribute('aria-labelledby', 'label-first label-third')
  expect(control).toHaveAttribute('aria-describedby', 'help-first help-third')
  setItems([])
  await m.settle()
  expect(control).not.toHaveAttribute('aria-labelledby')
  expect(control).not.toHaveAttribute('aria-describedby')
})
