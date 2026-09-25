import { CheckboxGroup } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  flush()
})

function mount(children: () => JSX.Element) {
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(children, host)
  cleanups.push(() => {
    dispose()
    host.remove()
  })
  flush()
  return { host, view: within(host) }
}

test('native FormData projects disabled and externally owned selected children to their eligible form', () => {
  const mounted = mount(() => (
    <>
      <form id="own-form">
        <CheckboxGroup
          name="choice"
          defaultValue={['disabled', 'removed', 'external']}
          aria-label="Choices"
        >
          <CheckboxGroup.Item value="disabled" aria-label="Disabled" disabled />
          <CheckboxGroup.Item value="removed" aria-label="Removed" />
          <CheckboxGroup.Item value="external" aria-label="External" form="other-form" />
        </CheckboxGroup>
      </form>
      <form id="other-form" />
    </>
  ))
  const own = mounted.host.querySelector('#own-form') as HTMLFormElement
  const other = mounted.host.querySelector('#other-form') as HTMLFormElement

  expect(new FormData(own).getAll('choice')).toEqual(['removed'])
  expect(new FormData(other).getAll('choice')).toEqual(['external'])
})
