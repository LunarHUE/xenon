import { OverlayPortal } from '../internal/overlay-portal'
import { MenuRoot, MenuSub, createMenuHandle } from './root'
import { MenuTrigger } from './trigger'
import { MenuContent, MenuPositioner, MenuViewport } from './content'
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
/**
 * Menu state provider with trigger, positioned content, items, groups, and submenus.
 * The root adds no DOM wrapper. Place Content inside Positioner, and a submenu's
 * SubTrigger and Positioner inside Sub. Items require a menu context; RadioItem
 * additionally requires RadioGroup, and GroupLabel requires Group or RadioGroup.
 * See {@link MenuRoot} for state ownership and {@link MenuContent} for focus handling.
 */
export const Menu = Object.assign(MenuRoot, {
  /** Alias of the wrapper-free menu state provider. */
  Root: MenuRoot,
  /** Links detached triggers to one mounted root. */
  createHandle: createMenuHandle,
  /** Mounts contents outside layout ancestry while preserving native modal containment. */
  Portal: OverlayPortal,
  /** Retains visual content snapshots during a trigger switch. */
  Viewport: MenuViewport,
  /** Button that opens the menu and selects the initial focus edge. */
  Trigger: MenuTrigger,
  /** Native manual-popover wrapper owning geometry and dismissal. */
  Positioner: MenuPositioner,
  /** Menu semantics and keyboard boundary inside Positioner. */
  Content: MenuContent,
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
export type { MenuProps, MenuHandle, MenuRenderState } from './root'
export type { MenuTriggerProps } from './trigger'
export type { MenuContentProps, MenuPositionerProps, MenuViewportProps } from './content'
export type {
  MenuChecked,
  MenuItemProps,
  MenuCheckboxItemProps,
  MenuRadioItemProps,
  MenuRadioGroupProps,
  MenuGroupProps,
} from './items'
export type { OverlayPortalProps as MenuPortalProps } from '../internal/overlay-portal'
