import { OverlayPortal } from '../internal/overlay-portal'
import { MenuSub } from '../menu/root'
import { ContextMenuRoot, ContextMenuTrigger, ContextMenuContent } from './context-menu'
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
 * Context-menu region, pointer-anchored popup, and shared Menu item parts.
 * Place Content inside Positioner. Submenus reuse Menu state and navigation.
 */
export const ContextMenu = /* @__PURE__ */ Object.assign(ContextMenuRoot, {
  /** Alias of the wrapper-free menu state provider. */
  Root: ContextMenuRoot,
  /** Mounts contents outside layout ancestry while preserving native modal containment. */
  Portal: OverlayPortal,
  /** Retains visual content snapshots during a trigger switch. */
  Viewport: MenuViewport,
  /** Button that opens the menu and selects the initial focus edge. */
  Trigger: ContextMenuTrigger,
  /** Decorative arrow registered with the positioner. */
  Arrow: MenuArrow,
  /** Native manual-popover wrapper owning geometry and dismissal. */
  Positioner: MenuPositioner,
  /** Menu semantics and keyboard boundary inside Positioner. */
  Content: ContextMenuContent,
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
export { ContextMenuRoot, ContextMenuTrigger, ContextMenuContent } from './context-menu'
export type {
  ContextMenuProps,
  ContextMenuTriggerProps,
  ContextMenuContentProps,
} from './context-menu'
export type {
  MenuPositionerProps as ContextMenuPositionerProps,
  MenuViewportProps as ContextMenuViewportProps,
  MenuArrowProps as ContextMenuArrowProps,
} from '../menu/content'
export type { OverlayPortalProps as ContextMenuPortalProps } from '../internal/overlay-portal'
export type {
  MenuItemProps as ContextMenuItemProps,
  MenuCheckboxItemProps as ContextMenuCheckboxItemProps,
  MenuRadioItemProps as ContextMenuRadioItemProps,
  MenuRadioGroupProps as ContextMenuRadioGroupProps,
  MenuGroupProps as ContextMenuGroupProps,
} from '../menu/items'
