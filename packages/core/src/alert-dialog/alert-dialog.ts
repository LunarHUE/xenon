import { dialog } from '../dialog/dialog'
import type { DialogOptions, DialogResult } from '../dialog/dialog'
export type AlertDialogOptions = Omit<DialogOptions, 'modal'>
export function alertDialog(options: AlertDialogOptions = {}): DialogResult {
  const result = dialog({ ...options, modal: true })
  result.parts.content.attrs.role = 'alertdialog'
  return result
}
