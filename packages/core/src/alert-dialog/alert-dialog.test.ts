import { expect, test } from 'vitest'
import { alertDialog } from './alert-dialog'
test('alert dialog forces modal semantics and alert role', () => {
  expect(alertDialog().parts.content.attrs.role).toBe('alertdialog')
  expect(alertDialog().state.modal).toBe(true)
})
