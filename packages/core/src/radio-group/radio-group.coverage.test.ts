import { expect, test } from 'vitest'

import { radioGroup } from './radio-group'

test('radio-group.state.12: undefined is distinct from an empty-string value', () => {
  expect(radioGroup({ items: ['a', 'b'] }).state.value).toBeUndefined()
  expect(radioGroup({ items: ['a', 'b'], value: '' }).state.value).toBe('')
})
