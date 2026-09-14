import { dialog } from '../dialog/dialog'
import type { DialogOptions, DialogResult } from '../dialog/dialog'
/** {@link DialogOptions} with modality fixed to true; other defaults and callback contracts are unchanged. */
export type AlertDialogOptions = Omit<DialogOptions, 'modal'>
/**
 * Builds {@link dialog} parts with alertdialog role and forced modal semantics.
 * Actual modality, focus placement, and dismissal policies belong to the adapter;
 * this wrapper only changes the content role and requested modal state.
 */
export function alertDialog(options: AlertDialogOptions = {}): DialogResult {
  const result = dialog({ ...options, modal: true })
  result.parts.content.attrs.role = 'alertdialog'
  return result
}
