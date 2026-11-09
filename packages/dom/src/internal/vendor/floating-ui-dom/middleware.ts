import type { Coords, LimitShiftOptions } from '../floating-ui-core/core'
import {
  arrow as arrowCore,
  flip as flipCore,
  hide as hideCore,
  limitShift as limitShiftCore,
  offset as offsetCore,
  shift as shiftCore,
  size as sizeCore,
} from '../floating-ui-core/core'

import type {
  ArrowOptions,
  Derivable,
  FlipOptions,
  HideOptions,
  Middleware,
  MiddlewareState,
  OffsetOptions,
  ShiftOptions,
  SizeOptions,
} from './types'

/**
 * Modifies the placement by translating the floating element along the
 * specified axes.
 * A number (shorthand for `mainAxis` or distance), or an axes configuration
 * object may be passed.
 * @see https://floating-ui.com/docs/offset
 */
export const offset: (options?: OffsetOptions) => Middleware = offsetCore

/**
 * Optimizes the visibility of the floating element by shifting it in order to
 * keep it in view when it will overflow the clipping boundary.
 * @see https://floating-ui.com/docs/shift
 */
export const shift: (options?: ShiftOptions | Derivable<ShiftOptions>) => Middleware = shiftCore

/**
 * Optimizes the visibility of the floating element by flipping the `placement`
 * in order to keep it in view when the preferred placement(s) will overflow the
 * clipping boundary. Alternative to `autoPlacement`.
 * @see https://floating-ui.com/docs/flip
 */
export const flip: (options?: FlipOptions | Derivable<FlipOptions>) => Middleware = flipCore

/**
 * Provides data that allows you to change the size of the floating element —
 * for instance, prevent it from overflowing the clipping boundary or match the
 * width of the reference element.
 * @see https://floating-ui.com/docs/size
 */
export const size: (options?: SizeOptions | Derivable<SizeOptions>) => Middleware = sizeCore

/**
 * Provides data to hide the floating element in applicable situations, such as
 * when it is not in the same clipping context as the reference element.
 * @see https://floating-ui.com/docs/hide
 */
export const hide: (options?: HideOptions | Derivable<HideOptions>) => Middleware = hideCore

/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * @see https://floating-ui.com/docs/arrow
 */
export const arrow: (options: ArrowOptions | Derivable<ArrowOptions>) => Middleware = arrowCore

/**
 * Built-in `limiter` that will stop `shift()` at a certain point.
 */
export const limitShift: (options?: LimitShiftOptions | Derivable<LimitShiftOptions>) => {
  options: any
  fn: (state: MiddlewareState) => Coords
} = limitShiftCore
