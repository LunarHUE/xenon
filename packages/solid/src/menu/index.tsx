import { MenuRoot, MenuSub } from './root'
import { MenuTrigger } from './trigger'
import { MenuContent, MenuPositioner } from './content'
import {
  MenuItem,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuItemIndicator,
  MenuGroup,
  MenuGroupLabel,
  MenuSeparator,
  MenuSubTrigger,
} from './items'
export const Menu = Object.assign(MenuRoot, {
  Root: MenuRoot,
  Trigger: MenuTrigger,
  Positioner: MenuPositioner,
  Content: MenuContent,
  Item: MenuItem,
  CheckboxItem: MenuCheckboxItem,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  ItemIndicator: MenuItemIndicator,
  Group: MenuGroup,
  GroupLabel: MenuGroupLabel,
  Separator: MenuSeparator,
  Sub: MenuSub,
  SubTrigger: MenuSubTrigger,
})
export type { MenuProps } from './root'
export type { MenuTriggerProps } from './trigger'
export type { MenuContentProps, MenuPositionerProps } from './content'
export type {
  MenuChecked,
  MenuItemProps,
  MenuCheckboxItemProps,
  MenuRadioItemProps,
  MenuRadioGroupProps,
  MenuGroupProps,
} from './items'
