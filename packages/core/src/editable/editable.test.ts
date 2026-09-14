import { expect, test, vi } from 'vitest'
import { editable } from './editable'

test('mounting is silent and preview activation requests editing', () => {
  const onEdit = vi.fn()
  const result = editable({ value: 'old', onEdit })
  expect(onEdit).not.toHaveBeenCalled()
  expect(result.parts.input.attrs.hidden).toBe(true)
  result.edit()
  expect(onEdit).toHaveBeenCalledOnce()
})
test('commit reports the draft and cancellation remains possible after disabling', () => {
  const submit = vi.fn(),
    cancel = vi.fn()
  const result = editable({ editing: true, value: 'old', draft: 'new', onSubmit: submit })
  result.submit()
  expect(submit).toHaveBeenCalledExactlyOnceWith('new')
  const locked = editable({ editing: true, disabled: true, onSubmit: submit, onCancel: cancel })
  locked.submit()
  locked.cancel()
  expect(submit).toHaveBeenCalledOnce()
  expect(cancel).toHaveBeenCalledOnce()
})
