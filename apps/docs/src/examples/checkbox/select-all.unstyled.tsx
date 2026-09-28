import { For, createSignal } from 'solid-js'
import { Checkbox } from '@xenon-ui/solid/checkbox'

const channels = ['Email', 'SMS', 'Push']

export default function SelectAll() {
  const [selected, setSelected] = createSignal(['Email'])
  const all = () => selected().length === channels.length
  const some = () => selected().length > 0 && !all()
  const toggle = (channel: string, next: boolean) =>
    setSelected((list) => (next ? [...list, channel] : list.filter((c) => c !== channel)))

  return (
    <div>
      <label>
        <Checkbox
          checked={all()}
          indeterminate={some()}
          onCheckedChange={(next) => setSelected(next ? [...channels] : [])}
        />
        All channels
      </label>
      <For each={channels}>
        {(channel) => (
          <label>
            <Checkbox
              checked={selected().includes(channel)}
              onCheckedChange={(next) => toggle(channel, next)}
            />
            {channel}
          </label>
        )}
      </For>
    </div>
  )
}
