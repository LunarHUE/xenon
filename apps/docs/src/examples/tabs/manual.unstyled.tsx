import { Tabs } from '@xenon-ui/solid/tabs'

export default function Manual() {
  return (
    <Tabs activationMode="manual">
      <Tabs.List aria-label="Reports">
        <Tabs.Tab value="revenue">Revenue</Tabs.Tab>
        <Tabs.Tab value="signups">Signups</Tabs.Tab>
        <Tabs.Tab value="churn">Churn</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="revenue">
        Monthly revenue by plan, for the last 12 months.
      </Tabs.Panel>
      <Tabs.Panel value="signups">
        New accounts per week, split by referral source.
      </Tabs.Panel>
      <Tabs.Panel value="churn">
        Cancelled accounts and the reason each one gave.
      </Tabs.Panel>
    </Tabs>
  )
}
