import { Toast } from '@xenon/solid/toast'
import { For } from 'solid-js'

/** Empty request-local manager hydrates before client actions add notifications. */
export function ToastFixture() {
  const manager = Toast.createManager()
  return (
    <Toast.Provider manager={manager} duration={0}>
      <button id="toast-add" onClick={() => manager.success('Saved after hydration')}>
        Save
      </button>
      <Toast.Viewport id="toast-inline" aria-label="Hydrated notifications">
        <For each={manager.toasts()}>
          {(item) => (
            <Toast.Content toast={item}>
              <Toast.Title />
              <Toast.Description />
              <Toast.Close aria-label="Dismiss notification">Close</Toast.Close>
            </Toast.Content>
          )}
        </For>
      </Toast.Viewport>
    </Toast.Provider>
  )
}
