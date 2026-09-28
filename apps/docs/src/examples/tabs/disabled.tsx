import { Tabs } from '@xenon-ui/solid/tabs'

const tab = `-mb-px border-b-2 border-transparent px-3 py-2 text-sm
  text-neutral-500 hover:text-neutral-950 focus-visible:outline-2
  focus-visible:outline-pink-600 data-selected:border-neutral-950
  data-selected:text-neutral-950 data-disabled:opacity-40
  data-disabled:hover:text-neutral-500 dark:text-neutral-400
  dark:hover:text-white dark:data-selected:border-white
  dark:data-selected:text-white dark:data-disabled:hover:text-neutral-400`

const panel = `py-4 text-sm text-neutral-700 focus-visible:outline-2
  focus-visible:outline-offset-4 focus-visible:outline-pink-600
  dark:text-neutral-300`

export default function Disabled() {
  return (
    <Tabs class="w-full max-w-md">
      <Tabs.List
        aria-label="Project settings"
        class="flex border-b border-neutral-300 dark:border-neutral-700"
      >
        <Tabs.Tab value="general" class={tab}>General</Tabs.Tab>
        <Tabs.Tab value="billing" disabled class={tab}>Billing</Tabs.Tab>
        <Tabs.Tab value="members" class={tab}>Members</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="general" class={panel}>
        Rename the project or change its default branch.
      </Tabs.Panel>
      <Tabs.Panel value="billing" class={panel}>
        Update the payment method and download past invoices.
      </Tabs.Panel>
      <Tabs.Panel value="members" class={panel}>
        Invite people and choose what each of them can change.
      </Tabs.Panel>
    </Tabs>
  )
}
