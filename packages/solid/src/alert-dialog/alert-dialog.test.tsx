import { cleanup, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { AlertDialog } from './alert-dialog'

afterEach(cleanup)

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.show = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
})

describe('AlertDialog', () => {
  test('alert action cancellation and cancel dismissal', () => {
    const { getByText, getByRole, queryByRole } = render(() => (
      <AlertDialog defaultOpen>
        <AlertDialog.Content>
          <AlertDialog.Title>Confirm</AlertDialog.Title>
          <AlertDialog.Description>Delete item?</AlertDialog.Description>
          <AlertDialog.Action onClick={(e) => e.preventDefault()}>Delete</AlertDialog.Action>
          <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
        </AlertDialog.Content>
      </AlertDialog>
    ))
    getByText('Delete').click()
    flush()
    expect(getByRole('alertdialog')).toHaveAttribute('aria-modal', 'true')
    getByText('Cancel').click()
    flush()
    expect(queryByRole('alertdialog')).toBeNull()
  })
  test('warns about missing names and alert descriptions', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      render(() => (
        <AlertDialog defaultOpen>
          <AlertDialog.Content />
        </AlertDialog>
      ))
      expect(warning).toHaveBeenCalledWith(expect.stringContaining('accessible name'))
      expect(warning).toHaveBeenCalledWith(expect.stringContaining('requires a description'))
    } finally {
      warning.mockRestore()
    }
  })
})
