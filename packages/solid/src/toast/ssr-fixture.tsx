import { renderToString } from '@solidjs/web'
import { For } from 'solid-js'
import { Toast } from './index'

/** Serialize existing records under provider admission limits without starting client timers. */
export function renderNotifications(limit: number): string {
  const manager = Toast.createManager()
  manager.add({ id: 'first', title: 'First', description: 'Earlier notification' })
  manager.add({ id: 'second', title: 'Second', description: 'Latest notification' })
  return renderToString(() => (
    <Toast.Provider manager={manager} limit={limit} duration={1200}>
      <Toast.Viewport aria-label="Updates">
        <For each={manager.toasts()}>
          {(record) => (
            <Toast.Content toast={record}>
              <Toast.Title id={`${record.id}-title`} />
              <Toast.Description id={`${record.id}-description`} />
              <Toast.Close aria-label={`Dismiss ${record.title}`} />
            </Toast.Content>
          )}
        </For>
      </Toast.Viewport>
    </Toast.Provider>
  ))
}
