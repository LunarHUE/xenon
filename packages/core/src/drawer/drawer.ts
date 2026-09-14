import { dialog } from '../dialog/dialog'
import type { DialogOptions, DialogResult } from '../dialog/dialog'
export type DrawerSide = 'top' | 'right' | 'bottom' | 'left'
export interface DrawerOptions extends DialogOptions {
  side?: DrawerSide
}
export function drawer(options: DrawerOptions = {}): DialogResult {
  const result = dialog(options)
  for (const part of Object.values(result.parts)) part.attrs['data-side'] = options.side ?? 'bottom'
  return result
}
