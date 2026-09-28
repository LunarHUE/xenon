import { Tabs } from '@xenon-ui/solid/tabs'

const tab = `-mb-px border-b-2 border-transparent px-3 py-2 text-sm
  text-neutral-500 focus-visible:outline-2 focus-visible:outline-pink-600
  data-selected:border-neutral-950 data-selected:text-neutral-950
  dark:text-neutral-400 dark:data-selected:border-white
  dark:data-selected:text-white`

const panel = `ms-auto w-fit py-4 text-sm focus-visible:outline-2
  focus-visible:outline-offset-4 focus-visible:outline-pink-600`

// The leader lengths line the three labels up on one row below the panel.
export default function TabsAnatomy() {
  return (
    <Tabs data-anatomy="Tabs" class="w-96">
      <Tabs.List
        data-anatomy="Tabs.List"
        aria-label="Project settings"
        style={{ '--anatomy-leader': '80px' }}
        class="flex border-b border-neutral-300 dark:border-neutral-700"
      >
        <Tabs.Tab
          data-anatomy="Tabs.Tab"
          value="general"
          style={{ '--anatomy-leader': '80px' }}
          class={tab}
        >
          General
        </Tabs.Tab>
        <Tabs.Tab value="members" class={tab}>
          Members
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel
        data-anatomy="Tabs.Panel"
        value="general"
        style={{ '--anatomy-leader': '28px' }}
        class={panel}
      >
        Rename the project.
      </Tabs.Panel>
      <Tabs.Panel value="members" class={panel}>
        Invite people.
      </Tabs.Panel>
    </Tabs>
  )
}
