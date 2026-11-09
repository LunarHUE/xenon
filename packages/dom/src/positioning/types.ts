/**
 * Rectangle provider used in place of a DOM anchor. Same shape as Floating UI's
 * `VirtualElement`. Not exported by name, as before, when it came from
 * `@floating-ui/dom`.
 */
interface VirtualElement {
  getBoundingClientRect(): ClientRectObject
  getClientRects?: (() => Array<ClientRectObject> | DOMRectList) | undefined
  contextElement?: Element | undefined
}
/** Viewport rectangle in CSS pixels, with both position and edge coordinates. */
interface ClientRectObject {
  x: number
  y: number
  width: number
  height: number
  top: number
  right: number
  bottom: number
  left: number
}

/** Physical side of the anchor on which the floating box is placed. */
export type PositioningSide = 'top' | 'right' | 'bottom' | 'left'
/** Alignment along the side's cross axis. Horizontal start/end honor reading direction. */
export type PositioningAlign = 'start' | 'center' | 'end'
/** Side with optional edge alignment; a bare side means centered. */
export type PositioningPlacement = PositioningSide | `${PositioningSide}-${'start' | 'end'}`
/** DOM anchor or virtual rectangle provider. A virtual contextElement supplies DOM ancestry and observers. */
export type PositioningAnchor = Element | VirtualElement
/** Collision inset in CSS pixels, uniformly or by physical edge; omitted edge values use zero. */
export type PositioningPadding = number | Partial<Record<PositioningSide, number>>
/** Collision region: clipping ancestors, viewport, element intersection, or a viewport-coordinate rectangle in CSS pixels. */
export type PositioningBoundary =
  | 'clipping-ancestors'
  | 'viewport'
  | Element
  | Element[]
  | {
      /** Left coordinate in viewport CSS pixels. */
      x: number
      /** Top coordinate in viewport CSS pixels. */
      y: number
      /** Rectangle width in CSS pixels. */
      width: number
      /** Rectangle height in CSS pixels. */
      height: number
    }

/** Automatic measurement triggers, used only when autoUpdate is enabled. */
export interface PositioningUpdateOptions {
  /** Listen for overflow-ancestor scrolling. Defaults to true. */
  ancestorScroll?: boolean
  /** Listen for overflow-ancestor resize events. Defaults to true. */
  ancestorResize?: boolean
  /** Observe border-box sizes of anchor context, floating box, arrow, and boundary elements when ResizeObserver exists. Defaults to enabled; writes wait for an animation frame. */
  elementResize?: boolean
  /** Track anchor-context movement with IntersectionObserver. Defaults to enabled when that observer is available. */
  layoutShift?: boolean
  /** Poll the current anchor rectangle each animation frame. Defaults to false; useful for transform animation and virtual anchors. */
  animationFrame?: boolean
}

/** Complete options for one measurement and its automatic update subscriptions. */
export interface PositioningOptions {
  /** Reference geometry. Null/undefined suspends positioning; disconnected DOM anchors or virtual contexts are unusable. */
  anchor: PositioningAnchor | null | undefined
  /** Allow positioning and subscriptions. Defaults to true; false restores owned DOM values and resets state on update. */
  enabled?: boolean
  /** Requested physical side, before collision flipping. Defaults to 'bottom'. */
  side?: PositioningSide
  /** Requested cross-axis alignment, before collision handling. Defaults to 'center'. */
  align?: PositioningAlign
  /** CSS positioning strategy applied to the floating element. Defaults to 'absolute'. */
  strategy?: 'absolute' | 'fixed'
  /** Explicit reading direction, also written as a dir attribute. Omission uses computed direction and restores any previous override. */
  dir?: 'ltr' | 'rtl'
  /** Gap between anchor and floating boxes in CSS pixels. Defaults to 0; arrow size is not added. */
  sideOffset?: number
  /** Logical cross-axis offset in CSS pixels; positive values inset an end alignment. Defaults to 0. */
  alignOffset?: number
  /** Region used by flip, shift, and available-size calculations. Defaults to clipping ancestors; reference-hidden checks use their own clipping context. */
  collisionBoundary?: PositioningBoundary
  /** Collision inset in CSS pixels. Defaults to 8 on all edges. */
  collisionPadding?: PositioningPadding
  /** Try alternate placements when the requested placement overflows. Defaults to true. */
  flip?: boolean
  /** Slide along the alignment axis to reduce overflow without moving across the anchor. Defaults to true. */
  shift?: boolean
  /** Limit shifting to retain contact with the anchor. Defaults to true. */
  tether?: boolean
  /** Ordered alternatives for flipping. Omission uses Floating UI's derived fallbacks; ignored when flip is false. */
  fallbackPlacements?: PositioningPlacement[]
  /** Hide the floating box and disable its pointer events when the reference is fully clipped. Defaults to false; this does not unmount it. */
  hideWhenDetached?: boolean
  /** Pointer hit testing while visible. Defaults to auto; hidden geometry always uses none. */
  pointerEvents?: 'auto' | 'none'
  /** Match one CSS dimension to the measured anchor size. Defaults to false; removing a match restores the authored dimension. */
  matchAnchorSize?: 'width' | 'height' | false
  /** Square layout box inside the positioner, or no arrow when null/undefined. The controller owns placement and presentation attributes; artwork belongs to the consumer. */
  arrow?: HTMLElement | null
  /** Arrow inset from the floating box's edges in CSS pixels. Defaults to 4. */
  arrowPadding?: number
  /** Enable default automatic triggers or customize them. Defaults to true. False still measures on creation, update, and explicit reposition. */
  autoUpdate?: boolean | PositioningUpdateOptions
  /**
   * Receives a copy whenever a published state field changes, including resets to
   * unpositioned state. Completed measurements publish asynchronously; updates can
   * publish resets synchronously. Identical states and disposal do not notify.
   */
  onPositioned?: (state: PositioningState) => void
  /**
   * Handles failures from current background measurement requests. Without it,
   * failures are rethrown in a microtask. Stale/disposed requests are ignored;
   * explicit reposition failures reject their promise instead.
   */
  onError?: (error: unknown) => void
}

/** Published placement snapshot. Measurements are CSS pixels and null before positioning or after reset. */
export interface PositioningState {
  /** Whether this snapshot contains a completed measurement; hidden references may still be positioned. */
  positioned: boolean
  /** Resolved physical side, or requested side while unpositioned. */
  side: PositioningSide
  /** Resolved alignment, or requested alignment while unpositioned. */
  align: PositioningAlign
  /** Combined resolved side/alignment, or the requested placement while unpositioned. */
  placement: PositioningPlacement
  /** CSS strategy used by the measurement. */
  strategy: 'absolute' | 'fixed'
  /** Left CSS offset for the strategy's coordinate system, rounded to a device-pixel boundary. */
  x: number | null
  /** Top CSS offset for the strategy's coordinate system, rounded to a device-pixel boundary. */
  y: number | null
  /** Measured reference width in CSS pixels. */
  anchorWidth: number | null
  /** Measured reference height in CSS pixels. */
  anchorHeight: number | null
  /** Available collision-region width, clamped to at least zero. */
  availableWidth: number | null
  /** Available collision-region height, clamped to at least zero. */
  availableHeight: number | null
  /** Arrow left offset inside the floating box, or null when not supplied on this axis. */
  arrowX: number | null
  /** Arrow top offset inside the floating box, or null when not supplied on this axis. */
  arrowY: number | null
  /** Signed arrow displacement from its ideal center in CSS pixels. Nonzero hides the arrow; null means no arrow measurement. */
  arrowCenterOffset: number | null
  /** CSS transform-origin expression, published as --positioner-transform-origin; null before positioning. */
  transformOrigin: string | null
  /** Whether enabled reference-clipping detection found the reference hidden. False when detection is disabled or state resets. */
  referenceHidden: boolean
}

/** Geometry controller that owns selected floating/arrow styles, attributes, and observer subscriptions. */
export interface Positioner {
  /**
   * Replace options and request asynchronous measurement; omissions restore defaults.
   * Unchanged observer inputs retain subscriptions. Disabled, missing, or disconnected
   * references restore owned DOM values and reset state. Does nothing after disposal.
   */
  update(options: PositioningOptions): void
  /**
   * Recompute after a virtual anchor changes without a DOM event. Resolves when this
   * request finishes or is discarded as stale; failures reject without invoking onError.
   * Does nothing when disposed or unusable. Newer requests supersede older results.
   */
  reposition(): Promise<void>
  /** Returns a fresh state copy; changing it does not mutate controller state. */
  getState(): Readonly<PositioningState>
  /** Idempotently stop observers and pending resize frames, invalidate measurements, restore owned DOM values, and reset state without notifying. */
  dispose(): void
}
