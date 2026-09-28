import { For, createSignal } from 'solid-js'
import { Checkbox } from '@xenon-ui/solid/checkbox'

const channels = ['Email', 'SMS', 'Push']
const box = `size-4 accent-neutral-950 focus-visible:outline-2
  focus-visible:outline-offset-4 focus-visible:outline-pink-600
  dark:accent-white`

export default function SelectAll() {
  const [selected, setSelected] = createSignal(['Email'])
  const all = () => selected().length === channels.length
  const some = () => selected().length > 0 && !all()
  const toggle = (channel: string, next: boolean) =>
    setSelected((list) => (next ? [...list, channel] : list.filter((c) => c !== channel)))

  return (
    <div class="flex flex-col gap-3 text-sm">
      <label class="flex items-center gap-3">
        <Checkbox
          checked={all()}
          indeterminate={some()}
          onCheckedChange={(next) => setSelected(next ? [...channels] : [])}
          class={box}
        />
        All channels
      </label>
      <For each={channels}>
        {(channel) => (
          <label class="flex items-center gap-3 pl-7">
            <Checkbox
              checked={selected().includes(channel)}
              onCheckedChange={(next) => toggle(channel, next)}
              class={box}
            />
            {channel}
          </label>
        )}
      </For>
    </div>
  )
}
