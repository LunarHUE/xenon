import { cleanup, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, beforeAll, describe, expect, test } from 'vitest'
import { Drawer } from './drawer'

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

describe('Drawer', () => {
  test('drawer handle is an accessible dismissal button', () => {
    const { getByRole, queryByRole } = render(() => (
      <Drawer defaultOpen side="left">
        <Drawer.Content aria-label="Navigation">
          <Drawer.Handle />
        </Drawer.Content>
      </Drawer>
    ))
    expect(getByRole('dialog')).toHaveAttribute('data-side', 'left')
    getByRole('button', { name: 'Close drawer' }).click()
    flush()
    expect(queryByRole('dialog')).toBeNull()
  })
})
