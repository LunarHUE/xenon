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

export default function Manual() {
  return (
    <Tabs activationMode="manual" class="w-full max-w-md">
      <Tabs.List
        aria-label="Reports"
        class="flex border-b border-neutral-300 dark:border-neutral-700"
      >
        <Tabs.Tab value="revenue" class={tab}>Revenue</Tabs.Tab>
        <Tabs.Tab value="signups" class={tab}>Signups</Tabs.Tab>
        <Tabs.Tab value="churn" class={tab}>Churn</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="revenue" class={panel}>
        Monthly revenue by plan, for the last 12 months.
      </Tabs.Panel>
      <Tabs.Panel value="signups" class={panel}>
        New accounts per week, split by referral source.
      </Tabs.Panel>
      <Tabs.Panel value="churn" class={panel}>
        Cancelled accounts and the reason each one gave.
      </Tabs.Panel>
    </Tabs>
  )
}
