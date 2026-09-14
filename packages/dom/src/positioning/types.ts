import type { VirtualElement } from '@floating-ui/dom'

export type PositioningSide = 'top' | 'right' | 'bottom' | 'left'
export type PositioningAlign = 'start' | 'center' | 'end'
export type PositioningPlacement = PositioningSide | `${PositioningSide}-${'start' | 'end'}`
export type PositioningAnchor = Element | VirtualElement
export type PositioningPadding = number | Partial<Record<PositioningSide, number>>
export type PositioningBoundary =
  | 'clipping-ancestors'
  | 'viewport'
  | Element
  | Element[]
  | { x: number; y: number; width: number; height: number }

export interface PositioningUpdateOptions {
  ancestorScroll?: boolean
  ancestorResize?: boolean
  elementResize?: boolean
  layoutShift?: boolean
  animationFrame?: boolean
}

export interface PositioningOptions {
  anchor: PositioningAnchor | null | undefined
  enabled?: boolean
  side?: PositioningSide
  align?: PositioningAlign
  strategy?: 'absolute' | 'fixed'
  dir?: 'ltr' | 'rtl'
  /** Gap between anchor and floating boxes. Arrow size is not added. */
  sideOffset?: number
  /** Logical cross-axis offset; positive values inset an end alignment. */
  alignOffset?: number
  collisionBoundary?: PositioningBoundary
  collisionPadding?: PositioningPadding
  flip?: boolean
  shift?: boolean
  /** Limit shifting to retain contact with the anchor. Defaults to true. */
  tether?: boolean
  fallbackPlacements?: PositioningPlacement[]
  hideWhenDetached?: boolean
  matchAnchorSize?: 'width' | 'height' | false
  /** Square layout box inside the positioner. Its artwork belongs to the consumer. */
  arrow?: HTMLElement | null
  arrowPadding?: number
  autoUpdate?: boolean | PositioningUpdateOptions
  onPositioned?: (state: PositioningState) => void
  onError?: (error: unknown) => void
}

export interface PositioningState {
  positioned: boolean
  side: PositioningSide
  align: PositioningAlign
  placement: PositioningPlacement
  strategy: 'absolute' | 'fixed'
  x: number | null
  y: number | null
  anchorWidth: number | null
  anchorHeight: number | null
  availableWidth: number | null
  availableHeight: number | null
  arrowX: number | null
  arrowY: number | null
  arrowCenterOffset: number | null
  transformOrigin: string | null
  referenceHidden: boolean
}

export interface Positioner {
  /** Replace options; unchanged observer inputs retain their subscriptions. */
  update(options: PositioningOptions): void
  /** Recompute after a virtual anchor changes without a DOM event. */
  reposition(): Promise<void>
  getState(): Readonly<PositioningState>
  dispose(): void
}
