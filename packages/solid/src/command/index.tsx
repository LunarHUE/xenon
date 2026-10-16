import {
  CommandEmpty,
  CommandGroup,
  CommandGroupHeading,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandRoot,
  CommandSeparator,
  CommandShortcut,
} from './command'
import { CommandDialog } from './dialog'

/** Command palette: a search input that filters and runs commands, inline or in a dialog. */
export const Command = /* @__PURE__ */ Object.assign(CommandRoot, {
  /** Alias of Command itself. */
  Root: CommandRoot,
  /** Root inside a modal dialog with an open shortcut. */
  Dialog: CommandDialog,
  /** Search field holding DOM focus. */
  Input: CommandInput,
  /** Listbox of groups and items. */
  List: CommandList,
  /** Items under a heading; hidden while none match. */
  Group: CommandGroup,
  /** Names its group. */
  GroupHeading: CommandGroupHeading,
  /** A runnable option. */
  Item: CommandItem,
  /** Key hint for the enclosing item's shortcut. */
  Shortcut: CommandShortcut,
  /** Shown while nothing matches. */
  Empty: CommandEmpty,
  /** Progress for async results. */
  Loading: CommandLoading,
  /** Divider, hidden during search. */
  Separator: CommandSeparator,
})
export { useCommand } from './command'
export type {
  CommandContextValue,
  CommandEmptyProps,
  CommandGroupHeadingProps,
  CommandGroupProps,
  CommandInputProps,
  CommandItemProps,
  CommandListChildren,
  CommandListProps,
  CommandLoadingProps,
  CommandRootProps,
  CommandSelectEvent,
  CommandSeparatorProps,
  CommandShortcutProps,
} from './command'
export type { CommandDialogProps } from './dialog'
export type { CommandItem as CommandItemData } from '@xenon-ui/core/command'
export { commandScore, defaultCommandFilter } from '@xenon-ui/core/command'
