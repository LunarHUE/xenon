import { expect, test } from 'vitest'
import { drawer } from './drawer'
test('drawer defaults to bottom and accepts an explicit side', () => {
  expect(drawer().parts.content.attrs['data-side']).toBe('bottom')
  expect(drawer({ side: 'left', modal: false }).parts.content.attrs['data-side']).toBe('left')
  expect(drawer({ modal: false }).state.modal).toBe(false)
})
