import { createSignal } from 'solid-js'
import { Tabs } from '@xenon-ui/solid/tabs'

export default function Controlled() {
  const [value, setValue] = createSignal('members')

  return (
    <div>
      <Tabs value={value()} onValueChange={setValue}>
        <Tabs.List aria-label="Project settings">
          <Tabs.Tab value="general">General</Tabs.Tab>
          <Tabs.Tab value="members">Members</Tabs.Tab>
          <Tabs.Tab value="billing">Billing</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="general">
          Rename the project or change its default branch.
        </Tabs.Panel>
        <Tabs.Panel value="members">
          Invite people and choose what each of them can change.
        </Tabs.Panel>
        <Tabs.Panel value="billing">
          Update the payment method and download past invoices.
        </Tabs.Panel>
      </Tabs>
      <p>Selected: {value()}</p>
    </div>
  )
}
