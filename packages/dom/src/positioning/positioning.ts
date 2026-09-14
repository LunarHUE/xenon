import {
  arrow as arrowMiddleware,
  autoUpdate,
  computePosition,
  flip,
  getOverflowAncestors,
  hide,
  limitShift,
  offset,
  platform,
  shift,
  size,
} from '@floating-ui/dom'
import type { Middleware } from '@floating-ui/dom'
import type {
  Positioner,
  PositioningAlign,
  PositioningAnchor,
  PositioningOptions,
  PositioningPlacement,
  PositioningSide,
  PositioningState,
} from './types'

export function initialPositioningState(
  options: Partial<PositioningOptions> = {}
): PositioningState {
  const side = options.side ?? 'bottom'
  const align = options.align ?? 'center'
  return {
    positioned: false,
    side,
    align,
    placement: align === 'center' ? side : `${side}-${align}`,
    strategy: options.strategy ?? 'absolute',
    x: null,
    y: null,
    anchorWidth: null,
    anchorHeight: null,
    availableWidth: null,
    availableHeight: null,
    arrowX: null,
    arrowY: null,
    arrowCenterOffset: null,
    transformOrigin: null,
    referenceHidden: false,
  }
}

/** Save only properties owned by this controller, leaving unrelated styles intact. */
function owned(element: HTMLElement) {
  const styles = new Map<string, [string, string]>()
  const attrs = new Map<string, string | null>()
  const restoreStyle = (name: string) => {
    const original = styles.get(name)
    if (!original) return
    if (original[0]) element.style.setProperty(name, original[0], original[1])
    else element.style.removeProperty(name)
    styles.delete(name)
  }
  const restoreAttr = (name: string) => {
    if (!attrs.has(name)) return
    const value = attrs.get(name)!
    if (value === null) element.removeAttribute(name)
    else element.setAttribute(name, value)
    attrs.delete(name)
  }
  return {
    style(name: string, value: string) {
      if (!styles.has(name))
        styles.set(name, [
          element.style.getPropertyValue(name),
          element.style.getPropertyPriority(name),
        ])
      if (element.style.getPropertyValue(name) !== value || element.style.getPropertyPriority(name))
        element.style.setProperty(name, value)
    },
    attr(name: string, value: string | null) {
      if (!attrs.has(name)) attrs.set(name, element.getAttribute(name))
      if (value === null) element.removeAttribute(name)
      else if (element.getAttribute(name) !== value) element.setAttribute(name, value)
    },
    restoreStyle,
    restoreAttr,
    restore() {
      for (const name of styles.keys()) restoreStyle(name)
      for (const name of attrs.keys()) restoreAttr(name)
      if (!element.style.length && element.getAttribute('style') === '')
        element.removeAttribute('style')
    },
  }
}

function context(anchor: PositioningAnchor): Element | undefined {
  return 'nodeType' in anchor ? anchor : anchor.contextElement
}
const opposite: Record<PositioningSide, PositioningSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

/** Geometry and subscriptions only. The caller owns mounting, presence, and layering. */
export function createPositioner(floating: HTMLElement, initial: PositioningOptions): Positioner {
  let options = initial
  let state = initialPositioningState(options)
  let disposed = false
  let generation = 0
  const floatingOwned = owned(floating)
  let arrowElement: HTMLElement | null | undefined
  let arrowOwned: ReturnType<typeof owned> | undefined
  let stopObservers: (() => void) | undefined
  let observedAnchor: PositioningAnchor | undefined
  let observedArrow: HTMLElement | null | undefined
  let observedBoundaries: Element[] = []
  let observedConfig = ''
  let active = false
  const publish = (next: PositioningState) => {
    const changed = (Object.keys(next) as (keyof PositioningState)[]).some(
      (key) => state[key] !== next[key]
    )
    state = next
    if (changed) options.onPositioned?.({ ...state })
  }
  const pending = () => {
    floatingOwned.style('visibility', 'hidden')
    floatingOwned.style('pointer-events', 'none')
    floatingOwned.attr('data-positioned', null)
  }
  const clear = () => {
    stopObservers?.()
    stopObservers = undefined
    observedAnchor = undefined
    observedArrow = undefined
    arrowOwned?.restore()
    arrowOwned = undefined
    arrowElement = undefined
    floatingOwned.restore()
    active = false
  }
  const usable = () => {
    const anchor = options.anchor
    return (
      options.enabled !== false &&
      !!anchor &&
      floating.isConnected &&
      (!context(anchor) || context(anchor)!.isConnected)
    )
  }
  const report = (error: unknown) => {
    if (disposed) return
    if (options.onError) options.onError(error)
    else
      queueMicrotask(() => {
        throw error
      })
  }
  const request = () => {
    const task = reposition()
    const ticket = generation
    void task.catch((error: unknown) => {
      if (ticket === generation && usable()) report(error)
    })
  }

  async function reposition(): Promise<void> {
    const ticket = ++generation
    if (disposed || !usable()) return
    const current = () => !disposed && generation === ticket && usable()
    const snapshot = options
    const anchor = snapshot.anchor!
    const requested = initialPositioningState(snapshot)
    const dir =
      snapshot.dir ?? floating.ownerDocument.defaultView?.getComputedStyle(floating).direction
    const rtl = dir === 'rtl'
    const boundary =
      snapshot.collisionBoundary === 'viewport'
        ? []
        : snapshot.collisionBoundary === 'clipping-ancestors' ||
            snapshot.collisionBoundary === undefined
          ? ('clippingAncestors' as const)
          : snapshot.collisionBoundary
    const overflow = { boundary, padding: snapshot.collisionPadding ?? 8 }
    const arrow = snapshot.arrow
    const arrowSize = arrow ? await platform.getDimensions!(arrow) : { width: 0, height: 0 }
    if (!current()) return
    let anchorWidth = 0
    let anchorHeight = 0
    let availableWidth = 0
    let availableHeight = 0
    const middleware: Middleware[] = [
      offset({
        mainAxis: snapshot.sideOffset ?? 0,
        crossAxis: snapshot.alignOffset ?? 0,
        alignmentAxis: snapshot.alignOffset ?? 0,
      }),
    ]
    const flipping =
      snapshot.flip === false
        ? undefined
        : flip({
            ...overflow,
            crossAxis: 'alignment',
            fallbackPlacements: snapshot.fallbackPlacements,
          })
    const shifting =
      snapshot.shift === false
        ? undefined
        : shift({
            ...overflow,
            mainAxis: true,
            crossAxis: false,
            limiter: snapshot.tether === false ? undefined : limitShift(),
          })
    // Preserve edge alignment by flipping first; centered placements prefer sliding.
    if (requested.align === 'center') {
      if (shifting) middleware.push(shifting)
      if (flipping) middleware.push(flipping)
    } else {
      if (flipping) middleware.push(flipping)
      if (shifting) middleware.push(shifting)
    }
    middleware.push(
      size({
        ...overflow,
        apply(data) {
          if (!current()) return
          anchorWidth = data.rects.reference.width
          anchorHeight = data.rects.reference.height
          availableWidth = Math.max(0, data.availableWidth)
          availableHeight = Math.max(0, data.availableHeight)
          for (const [name, value] of Object.entries({
            'anchor-width': anchorWidth,
            'anchor-height': anchorHeight,
            'available-width': availableWidth,
            'available-height': availableHeight,
          }))
            floatingOwned.style(`--positioner-${name}`, `${value}px`)
          if (snapshot.matchAnchorSize === 'width') floatingOwned.style('width', `${anchorWidth}px`)
          if (snapshot.matchAnchorSize === 'height')
            floatingOwned.style('height', `${anchorHeight}px`)
        },
      })
    )
    if (arrow)
      middleware.push(arrowMiddleware({ element: arrow, padding: snapshot.arrowPadding ?? 4 }))
    // Reference clipping is independent of the popup's collision boundary.
    if (snapshot.hideWhenDetached) middleware.push(hide({ strategy: 'referenceHidden' }))
    const result = await computePosition(anchor, floating, {
      placement: requested.placement,
      strategy: requested.strategy,
      middleware,
      ...(snapshot.dir ? { platform: { ...platform, isRTL: () => rtl } } : {}),
    })
    if (!current()) return
    const [side, aligned] = result.placement.split('-') as [
      PositioningSide,
      'start' | 'end' | undefined,
    ]
    const align: PositioningAlign = aligned ?? 'center'
    const vertical = side === 'top' || side === 'bottom'
    const arrowData = result.middlewareData.arrow
    const arrowX = arrowData?.x ?? null
    const arrowY = arrowData?.y ?? null
    const centeredArrow = arrowData && arrowData.centerOffset === 0
    const logical =
      align === 'center' ? '50%' : (align === 'start') !== (vertical && rtl) ? '0%' : '100%'
    const crossOrigin = centeredArrow
      ? `${vertical ? (arrowX ?? 0) + arrowSize.width / 2 : (arrowY ?? 0) + arrowSize.height / 2}px`
      : logical
    const gap = snapshot.sideOffset ?? 0
    const nearOrigin = `${-gap}px`
    const farOrigin = `calc(100% + ${gap}px)`
    const transformOrigin = vertical
      ? `${crossOrigin} ${side === 'bottom' ? nearOrigin : farOrigin}`
      : `${side === 'right' ? nearOrigin : farOrigin} ${crossOrigin}`
    const hiddenData = result.middlewareData.hide
    let referenceHidden = !!hiddenData?.referenceHidden
    // Point and line virtual anchors remain valid on the boundary itself.
    // Floating UI's >= 0 test otherwise classifies a point at (0, 0) as clipped.
    if (!('nodeType' in anchor) && hiddenData?.referenceHiddenOffsets) {
      referenceHidden = Object.entries(hiddenData.referenceHiddenOffsets).some(([edge, value]) => {
        const dimension = edge === 'top' || edge === 'bottom' ? anchorHeight : anchorWidth
        return dimension === 0 ? (value as number) > 0 : (value as number) >= 0
      })
    }
    const ratio = floating.ownerDocument.defaultView?.devicePixelRatio || 1
    const round = (value: number) => Math.round(value * ratio) / ratio
    const x = round(result.x)
    const y = round(result.y)
    floatingOwned.style('left', `${x}px`)
    floatingOwned.style('top', `${y}px`)
    floatingOwned.style('visibility', referenceHidden ? 'hidden' : 'visible')
    floatingOwned.style('pointer-events', referenceHidden ? 'none' : 'auto')
    floatingOwned.style('--positioner-transform-origin', transformOrigin)
    floatingOwned.attr('data-side', side)
    floatingOwned.attr('data-align', align)
    floatingOwned.attr('data-positioned', '')
    floatingOwned.attr('data-reference-hidden', referenceHidden ? '' : null)
    if (arrowOwned) {
      for (const edge of ['top', 'right', 'bottom', 'left']) arrowOwned.style(edge, '')
      if (arrowX !== null) arrowOwned.style('left', `${arrowX}px`)
      if (arrowY !== null) arrowOwned.style('top', `${arrowY}px`)
      arrowOwned.style(opposite[side], `${-(vertical ? arrowSize.height : arrowSize.width) / 2}px`)
      arrowOwned.style('visibility', !centeredArrow || referenceHidden ? 'hidden' : 'visible')
      arrowOwned.attr('data-side', side)
      arrowOwned.attr('data-uncentered', centeredArrow ? null : '')
    }
    publish({
      positioned: true,
      side,
      align,
      placement: result.placement as PositioningPlacement,
      strategy: requested.strategy,
      x,
      y,
      anchorWidth,
      anchorHeight,
      availableWidth,
      availableHeight,
      arrowX,
      arrowY,
      arrowCenterOffset: arrowData?.centerOffset ?? null,
      transformOrigin,
      referenceHidden,
    })
  }

  const controller: Positioner = {
    getState: () => ({ ...state }),
    reposition,
    update(next) {
      if (disposed) return
      generation++
      const previous = options
      options = next
      if (!usable()) {
        clear()
        publish(initialPositioningState(options))
        return
      }
      const anchor = options.anchor!
      const changedAnchor = previous.anchor !== anchor
      if (!active || changedAnchor) {
        pending()
        publish(initialPositioningState(options))
        if (disposed || options !== next) return
      }
      active = true
      floatingOwned.style('position', options.strategy ?? 'absolute')
      if (!state.positioned) {
        floatingOwned.style('left', '0px')
        floatingOwned.style('top', '0px')
      }
      if (options.dir) floatingOwned.attr('dir', options.dir)
      else if (previous.dir) floatingOwned.restoreAttr('dir')
      if (options.matchAnchorSize !== 'width') floatingOwned.restoreStyle('width')
      if (options.matchAnchorSize !== 'height') floatingOwned.restoreStyle('height')
      if (arrowElement !== options.arrow) {
        arrowOwned?.restore()
        arrowElement = options.arrow
        arrowOwned = arrowElement ? owned(arrowElement) : undefined
        if (arrowOwned) {
          arrowOwned.style('position', 'absolute')
          arrowOwned.style('pointer-events', 'none')
          arrowOwned.style('visibility', 'hidden')
          arrowOwned.attr('aria-hidden', 'true')
          arrowOwned.attr('role', 'presentation')
        }
      }
      const updateOptions = typeof options.autoUpdate === 'object' ? options.autoUpdate : undefined
      const config = JSON.stringify([
        options.autoUpdate !== false,
        updateOptions?.ancestorScroll,
        updateOptions?.ancestorResize,
        updateOptions?.elementResize,
        updateOptions?.layoutShift,
        updateOptions?.animationFrame,
      ])
      const anchorContext = context(anchor)
      const observerAnchor = anchorContext ?? anchor
      const explicitBoundary = options.collisionBoundary
      const boundaryNodes = new Set<Element>()
      if (options.autoUpdate !== false && updateOptions?.elementResize !== false) {
        const ancestors = [
          ...getOverflowAncestors(floating),
          ...(anchorContext ? getOverflowAncestors(anchorContext) : []),
        ]
        for (const node of ancestors) {
          if ('nodeType' in node && node.nodeType === 1) boundaryNodes.add(node as Element)
        }
        if (Array.isArray(explicitBoundary)) {
          for (const node of explicitBoundary) boundaryNodes.add(node)
        } else if (
          explicitBoundary &&
          typeof explicitBoundary === 'object' &&
          'nodeType' in explicitBoundary
        ) {
          boundaryNodes.add(explicitBoundary)
        }
      }
      if (
        observedAnchor !== observerAnchor ||
        observedArrow !== arrowElement ||
        observedConfig !== config ||
        observedBoundaries.length !== boundaryNodes.size ||
        observedBoundaries.some((node) => !boundaryNodes.has(node))
      ) {
        stopObservers?.()
        stopObservers = undefined
        observedAnchor = observerAnchor
        observedArrow = arrowElement
        observedConfig = config
        observedBoundaries = [...boundaryNodes]
        if (options.autoUpdate !== false) {
          let observing = true
          const update = () => {
            if (observing) request()
          }
          // Keep subscriptions when a virtual object changes but its DOM context
          // stays the same. Animation-frame tracking still reads the newest rect.
          const trackingAnchor = {
            contextElement: anchorContext,
            getBoundingClientRect: () => options.anchor!.getBoundingClientRect(),
          }
          const stop = autoUpdate(trackingAnchor, floating, update, {
            ...updateOptions,
            elementResize: false,
          })
          const view = floating.ownerDocument.defaultView
          const Observer = view?.ResizeObserver
          let resizeFrame: number | undefined
          // Observe the full border box continuously, including arrow changes.
          // Defer resize-driven writes to avoid ResizeObserver feedback.
          const resizeObserver =
            Observer && updateOptions?.elementResize !== false
              ? new Observer(() => {
                  if (!observing || resizeFrame !== undefined) return
                  resizeFrame = view!.requestAnimationFrame(() => {
                    resizeFrame = undefined
                    update()
                  })
                })
              : undefined
          if (anchorContext) resizeObserver?.observe(anchorContext, { box: 'border-box' })
          resizeObserver?.observe(floating, { box: 'border-box' })
          if (arrowElement) resizeObserver?.observe(arrowElement, { box: 'border-box' })
          for (const boundary of boundaryNodes)
            resizeObserver?.observe(boundary, { box: 'border-box' })
          stopObservers = () => {
            observing = false
            stop()
            resizeObserver?.disconnect()
            if (resizeFrame !== undefined) view!.cancelAnimationFrame(resizeFrame)
          }
        }
      }
      request()
    },
    dispose() {
      if (disposed) return
      disposed = true
      generation++
      clear()
      state = initialPositioningState(options)
    },
  }
  controller.update(initial)
  return controller
}
