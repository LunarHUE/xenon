import { Tabs } from '@xenon-ui/solid/tabs'

export default function Disabled() {
  return (
    <Tabs>
      <Tabs.List aria-label="Project settings">
        <Tabs.Tab value="general">General</Tabs.Tab>
        <Tabs.Tab value="billing" disabled>Billing</Tabs.Tab>
        <Tabs.Tab value="members">Members</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="general">
        Rename the project or change its default branch.
      </Tabs.Panel>
      <Tabs.Panel value="billing">
        Update the payment method and download past invoices.
      </Tabs.Panel>
      <Tabs.Panel value="members">
        Invite people and choose what each of them can change.
      </Tabs.Panel>
    </Tabs>
  )
}
