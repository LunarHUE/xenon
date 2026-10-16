import { OverlayPortal } from '../internal/overlay-portal'
import { MenuSub } from '../menu/root'
import { MenubarRoot, MenubarTrigger, MenubarContent, MenubarMenu } from './menubar'
import { MenuPositioner, MenuViewport, MenuArrow } from '../menu/content'
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
} from '../menu/items'
/**
 * Persistent menubar container with roving triggers and one identified Menu open.
 * Place each Trigger and positioned Content inside a Menu with a unique value.
 * Nested Sub parts reuse Menu state, item semantics, and navigation.
 */
export const Menubar = /* @__PURE__ */ Object.assign(MenubarRoot, {
  /** Menubar container and top-level navigation provider. */
  Root: MenubarRoot,
  /** One identified top-level menu. */
  Menu: MenubarMenu,
  /** Mounts contents outside layout ancestry while preserving native modal containment. */
  Portal: OverlayPortal,
  /** Retains visual content snapshots during a trigger switch. */
  Viewport: MenuViewport,
  /** Button that opens the menu and selects the initial focus edge. */
  Trigger: MenubarTrigger,
  /** Decorative arrow registered with the positioner. */
  Arrow: MenuArrow,
  /** Native manual-popover wrapper owning geometry and dismissal. */
  Positioner: MenuPositioner,
  /** Menu semantics and keyboard boundary inside Positioner. */
  Content: MenubarContent,
  /** Action item; accepted selection closes the menu chain by default. */
  Item: MenuItem,
  /** Checked or mixed item; accepted selection stays open by default. */
  CheckboxItem: MenuCheckboxItem,
  /** Single-value selection provider with group semantics. */
  RadioGroup: MenuRadioGroup,
  /** Radio item consuming the nearest RadioGroup; stays open by default. */
  RadioItem: MenuRadioItem,
  /** Decorative span shown for checked/mixed items, or when force-mounted. */
  ItemIndicator: MenuItemIndicator,
  /** Structural group with optional registered label; creates no navigation registry. */
  Group: MenuGroup,
  /** Label registered with the nearest Group or RadioGroup. */
  GroupLabel: MenuGroupLabel,
  /** Native horizontal rule, outside item registration. */
  Separator: MenuSeparator,
  /** Nested state provider whose effective visibility is gated by its parent menu. */
  Sub: MenuSub,
  /** Parent-menu item that opens its enclosing Sub on activation or delayed hover. */
  SubTrigger: MenuSubTrigger,
})
export { MenubarRoot, MenubarTrigger, MenubarContent, MenubarMenu } from './menubar'
export type {
  MenubarProps,
  MenubarTriggerProps,
  MenubarContentProps,
  MenubarMenuProps,
} from './menubar'
export type {
  MenuPositionerProps as MenubarPositionerProps,
  MenuViewportProps as MenubarViewportProps,
  MenuArrowProps as MenubarArrowProps,
} from '../menu/content'
export type { OverlayPortalProps as MenubarPortalProps } from '../internal/overlay-portal'
export type {
  MenuItemProps as MenubarItemProps,
  MenuCheckboxItemProps as MenubarCheckboxItemProps,
  MenuRadioItemProps as MenubarRadioItemProps,
  MenuRadioGroupProps as MenubarRadioGroupProps,
  MenuGroupProps as MenubarGroupProps,
} from '../menu/items'
