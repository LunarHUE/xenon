import { createSignal } from 'solid-js'
import { Tabs } from '@xenon-ui/solid/tabs'

const tab = `-mb-px border-b-2 border-transparent px-3 py-2 text-sm
  text-neutral-500 hover:text-neutral-950 focus-visible:outline-2
  focus-visible:outline-pink-600 data-selected:border-neutral-950
  data-selected:text-neutral-950 dark:text-neutral-400
  dark:hover:text-white dark:data-selected:border-white
  dark:data-selected:text-white`

const panel = `py-4 text-sm text-neutral-700 focus-visible:outline-2
  focus-visible:outline-offset-4 focus-visible:outline-pink-600
  dark:text-neutral-300`

export default function Controlled() {
  const [value, setValue] = createSignal('members')

  return (
    <div class="w-full max-w-md">
      <Tabs value={value()} onValueChange={setValue}>
        <Tabs.List
          aria-label="Project settings"
          class="flex border-b border-neutral-300 dark:border-neutral-700"
        >
          <Tabs.Tab value="general" class={tab}>General</Tabs.Tab>
          <Tabs.Tab value="members" class={tab}>Members</Tabs.Tab>
          <Tabs.Tab value="billing" class={tab}>Billing</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="general" class={panel}>
          Rename the project or change its default branch.
        </Tabs.Panel>
        <Tabs.Panel value="members" class={panel}>
          Invite people and choose what each of them can change.
        </Tabs.Panel>
        <Tabs.Panel value="billing" class={panel}>
          Update the payment method and download past invoices.
        </Tabs.Panel>
      </Tabs>
      <p class="text-sm text-neutral-500 dark:text-neutral-400">
        Selected: {value()}
      </p>
    </div>
  )
}
