import { Tabs } from '@xenon-ui/solid/tabs'

const tab = `-me-px border-e-2 border-transparent px-3 py-2 text-start
  text-sm text-neutral-500 hover:text-neutral-950 focus-visible:outline-2
  focus-visible:outline-pink-600 data-selected:border-neutral-950
  data-selected:text-neutral-950 dark:text-neutral-400
  dark:hover:text-white dark:data-selected:border-white
  dark:data-selected:text-white`

const panel = `text-sm text-neutral-700 focus-visible:outline-2
  focus-visible:outline-offset-4 focus-visible:outline-pink-600
  dark:text-neutral-300`

export default function Vertical() {
  return (
    <Tabs orientation="vertical" class="flex w-full max-w-md gap-6">
      <Tabs.List
        aria-label="Account"
        class="flex flex-col border-e border-neutral-300 dark:border-neutral-700"
      >
        <Tabs.Tab value="profile" class={tab}>Profile</Tabs.Tab>
        <Tabs.Tab value="security" class={tab}>Security</Tabs.Tab>
        <Tabs.Tab value="notifications" class={tab}>Notifications</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="profile" class={panel}>
        Your name and photo appear on comments and commits.
      </Tabs.Panel>
      <Tabs.Panel value="security" class={panel}>
        Change your password and manage two-factor sign-in.
      </Tabs.Panel>
      <Tabs.Panel value="notifications" class={panel}>
        Pick which events send you an email.
      </Tabs.Panel>
    </Tabs>
  )
}
