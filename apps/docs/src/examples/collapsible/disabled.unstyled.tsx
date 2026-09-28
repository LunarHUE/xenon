import { Collapsible } from '@xenon-ui/solid/collapsible'

export default function Disabled() {
  return (
    <Collapsible disabled>
      <Collapsible.Trigger>
        Billing history <span>No invoices yet</span>
      </Collapsible.Trigger>
      <Collapsible.Content>
        Your invoices appear here after the first charge.
      </Collapsible.Content>
    </Collapsible>
  )
}
