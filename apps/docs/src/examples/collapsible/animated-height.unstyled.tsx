import { Collapsible } from '@xenon-ui/solid/collapsible'

export default function AnimatedHeight() {
  return (
    <Collapsible>
      <Collapsible.Trigger>
        Order summary, 3 items <span aria-hidden="true">▾</span>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <ul>
          <li>Canvas tote <span>$24.00</span></li>
          <li>Enamel mug <span>$18.00</span></li>
          <li>Linen notebook <span>$12.50</span></li>
        </ul>
      </Collapsible.Content>
    </Collapsible>
  )
}
