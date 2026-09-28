import { Collapsible } from '@xenon-ui/solid/collapsible'

export default function ShippingDetails() {
  return (
    <Collapsible>
      <Collapsible.Trigger>
        Shipping details <span aria-hidden="true">▾</span>
      </Collapsible.Trigger>
      <Collapsible.Content>
        Orders ship within two business days. The tracking link arrives by
        email once the parcel leaves the warehouse.
      </Collapsible.Content>
    </Collapsible>
  )
}
