import { afterEach, describe, expect } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

const extras = new Set<Element>()

afterEach(() => {
  for (const element of extras) element.remove()
  extras.clear()
})

function formWith(container: HTMLElement): HTMLFormElement {
  const form = document.createElement('form')
  document.body.appendChild(form)
  form.appendChild(container)
  extras.add(form)
  return form
}

describe('switch forms in a browser', () => {
  spec.skip(
    'switch.forms.16',
    'no uncheckedValue prop; an off switch submits nothing, as a native checkbox does',
    () => {
      const m = mount('switch', {
        'aria-label': 'Lights',
        name: 'lights',
        value: 'night',
        uncheckedValue: 'day',
      })
      const form = formWith(m.container)
      expect(Array.from(new FormData(form))).toEqual([['lights', 'day']])

      m.setProps({ checked: true })
      expect(Array.from(new FormData(form))).toEqual([['lights', 'night']])

      m.setProps({ checked: false, disabled: true })
      expect(Array.from(new FormData(form))).toEqual([])
    }
  )
})
