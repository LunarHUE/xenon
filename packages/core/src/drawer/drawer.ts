import { dialog } from '../dialog/dialog'
import type { DialogOptions, DialogResult } from '../dialog/dialog'
/** Physical edge exposed through the data-side styling hook. */
export type DrawerSide = 'top' | 'right' | 'bottom' | 'left'
/** {@link DialogOptions} plus the physical side used to style every drawer part. */
export interface DrawerOptions extends DialogOptions {
  /** Side emitted on all parts, defaulting to 'bottom'; does not position elements. */
  side?: DrawerSide
}
/**
 * Builds {@link dialog} parts and adds data-side to each of the six parts.
 * Dialog defaults and callbacks are preserved, including optional nonmodal state.
 * Positioning, drag gestures, and dismissal behavior belong to the adapter.
 */
export function drawer(options: DrawerOptions = {}): DialogResult {
  const result = dialog(options)
  for (const part of Object.values(result.parts)) part.attrs['data-side'] = options.side ?? 'bottom'
  return result
}
