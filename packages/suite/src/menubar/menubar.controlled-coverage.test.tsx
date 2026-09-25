import { Menubar } from '@xenon-ui/solid/menubar'
import { render } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import type { Accessor } from 'solid-js'
import { describe, expect, onTestFinished, vi } from 'vitest'

import { spec } from '../spec'

function mount(value: Accessor<string | null | undefined>, defaultValue: string | null) {
  const container = document.createElement('div')
  document.body.append(container)
  const change = vi.fn()
  const dispose = render(
    () => (
      <Menubar
        aria-label="Editor"
        value={value()}
        defaultValue={defaultValue}
        onValueChange={change}
      >
        <Menubar.Menu value="file">
          <Menubar.Trigger>File</Menubar.Trigger>
          <Menubar.Positioner>
            <Menubar.Content>
              <Menubar.Item>New</Menubar.Item>
            </Menubar.Content>
          </Menubar.Positioner>
        </Menubar.Menu>
      </Menubar>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
  })
  flush()
  return {
    container,
    change,
    trigger: () => within(container).getByRole('menuitem', { name: 'File' }),
  }
}

async function settle() {
  flush()
  await Promise.resolve()
  flush()
}

describe('menubar controlled null and undefined', () => {
  for (const id of ['controlled-state.state.9', 'controlled.13'] as const) {
    spec(id, async () => {
      const [value, setValue] = createSignal<string | null | undefined>(null)
      // The accessor is consumed by mount's JSX render function.
      // eslint-disable-next-line solid/reactivity
      const view = mount(value, 'file')
      const trigger = view.trigger()

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      fireEvent.click(trigger)
      await settle()
      expect(view.change).toHaveBeenCalledExactlyOnceWith('file')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      // Undefined releases control and restores the internal default.
      setValue(undefined)
      await settle()
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(view.change).toHaveBeenCalledTimes(1)

      // Null is a real controlled closed value, so it closes without an echo.
      setValue(null)
      await settle()
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(view.change).toHaveBeenCalledTimes(1)
    })
  }
})
