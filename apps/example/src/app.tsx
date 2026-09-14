import type { JSX } from '@solidjs/web'

import { AccordionDemo } from './demos/accordion'
import { AlertDialogDemo } from './demos/alert-dialog'
import { DialogDemo } from './demos/dialog'
import { DrawerDemo } from './demos/drawer'
import { MenuDemo } from './demos/menu'
import { PopoverDemo } from './demos/popover'
import { ButtonDemo } from './demos/button'
import { CheckboxDemo } from './demos/checkbox'
import { CollapsibleDemo } from './demos/collapsible'
import { FieldDemo } from './demos/field'
import { FormDemo } from './demos/form'
import { ProgressDemo } from './demos/progress'
import { RadioGroupDemo } from './demos/radio-group'
import { SeparatorDemo } from './demos/separator'
import { SwitchDemo } from './demos/switch'
import { TabsDemo } from './demos/tabs'
import { ToggleDemo } from './demos/toggle'
import { ToggleGroupDemo } from './demos/toggle-group'
import { ToolbarDemo } from './demos/toolbar'

export function App(): JSX.Element {
  return (
    <>
      <header class="masthead">
        <span class="masthead__mark">kit</span>
        <span class="masthead__meta">@kit/solid · behavior sheet</span>
        <span class="masthead__meta masthead__meta--end">solid 2.0.0-rc.8</span>
      </header>

      <main>
        <section class="hero">
          <h1 class="hero__title">
            Eighteen components,
            <br />
            <em>no opinions</em> about
            <br />
            how they look.
          </h1>
          <div class="hero__aside">
            <p class="hero__lede">
              Every component on this page is the same one you would import. Nothing is wrapped for
              the demo and nothing is styled by the library. The rules live in a plain TypeScript
              core, the adapter spreads what it returns onto the element you chose, and the CSS in
              this app reads state off data attributes.
            </p>
            <p class="hero__hint">
              Put the mouse down and use the keyboard. That is where the difference is.
            </p>
          </div>
        </section>

        <ButtonDemo />
        <CheckboxDemo />
        <SwitchDemo />
        <ToolbarDemo />
        <FormDemo />
        <ToggleDemo />
        <ToggleGroupDemo />
        <RadioGroupDemo />
        <CollapsibleDemo />
        <AccordionDemo />
        <TabsDemo />
        <FieldDemo />
        <ProgressDemo />
        <SeparatorDemo />
        <DialogDemo />
        <AlertDialogDemo />
        <DrawerDemo />
        <PopoverDemo />
        <MenuDemo />
      </main>

      <footer class="colophon">
        <p>
          Behavior is pinned by a conformance suite written once against the DOM and run per
          adapter. What you see here is the same contract, rendered.
        </p>
      </footer>
    </>
  )
}
