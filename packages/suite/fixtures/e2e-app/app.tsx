import { AccordionDemo } from './demos/accordion'
import { AlertDialogDemo } from './demos/alert-dialog'
import { ButtonDemo } from './demos/button'
import { CollapsibleDemo } from './demos/collapsible'
import { DialogDemo } from './demos/dialog'
import { DrawerDemo } from './demos/drawer'
import { FieldDemo } from './demos/field'
import { FormDemo } from './demos/form'
import { MenuDemo } from './demos/menu'
import { PopoverDemo } from './demos/popover'
import { ProgressDemo } from './demos/progress'
import { RadioGroupDemo } from './demos/radio-group'
import { SeparatorDemo } from './demos/separator'
import { TabsDemo } from './demos/tabs'
import { ToastDemo } from './demos/toast'
import { ToggleDemo } from './demos/toggle'
import { ToggleGroupDemo } from './demos/toggle-group'
import {
  AccessibleIconDemo,
  AvatarDemo,
  BreadcrumbsDemo,
  MeterDemo,
  PaginationDemo,
  ResizableDemo,
  ScrollAreaDemo,
  VisuallyHiddenDemo,
} from './demos/utilities'

/** Retained interaction and layout contracts from the removed example app, for E2E tests only. */
export function E2eApp() {
  return (
    <>
      <header class="masthead">
        <span class="masthead__mark">xenon</span>
        <span class="masthead__meta">E2E interaction fixtures</span>
        <span class="masthead__meta masthead__meta--end">suite</span>
      </header>
      <main>
        <ButtonDemo />
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
        <ToastDemo />
        <AvatarDemo />
        <VisuallyHiddenDemo />
        <AccessibleIconDemo />
        <MeterDemo />
        <PaginationDemo />
        <BreadcrumbsDemo />
        <ScrollAreaDemo />
        <ResizableDemo />
      </main>
    </>
  )
}
