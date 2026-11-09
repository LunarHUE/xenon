/*!
 * tabbable 6.5.0, vendored into @xenon-ui/dom
 * @license MIT, Copyright (c) 2015 David Clark, https://github.com/focus-trap/tabbable/blob/master/LICENSE
 */
export type FocusableElement = HTMLElement | SVGElement

export type CheckOptions = {
  getShadowRoot?: boolean
}

export type TabbableOptions = {
  includeContainer?: boolean
}

// NOTE: separate `:not()` selectors has broader browser support than the newer
//  `:not([inert], [inert] *)` (Feb 2023)
const candidateSelectors = [
  'input:not([inert]):not([inert] *)',
  'select:not([inert]):not([inert] *)',
  'textarea:not([inert]):not([inert] *)',
  'a[href]:not([inert]):not([inert] *)',
  'area[href]:not([inert]):not([inert] *)',
  'button:not([inert]):not([inert] *)',
  '[tabindex]:not(slot):not([inert]):not([inert] *)',
  'audio[controls]:not([inert]):not([inert] *)',
  'video[controls]:not([inert]):not([inert] *)',
  '[contenteditable]:not([contenteditable="false"]):not([inert]):not([inert] *)',
  'details>summary:first-of-type:not([inert]):not([inert] *)',
  'details:not([inert]):not([inert] *)',
]
const candidateSelector = /* #__PURE__ */ candidateSelectors.join(',')

const NoElement = typeof Element === 'undefined'

/** Vendor-prefixed `matches` from browsers that predate the standard name. */
type LegacyElement = Element & {
  msMatchesSelector?: Element['matches']
  webkitMatchesSelector?: Element['matches']
}

const matches: (this: Element, selectors: string) => boolean = NoElement
  ? function () {
      return undefined as unknown as boolean
    }
  : Element.prototype.matches ||
    (Element.prototype as LegacyElement).msMatchesSelector ||
    (Element.prototype as LegacyElement).webkitMatchesSelector

const getRootNode: (element: Node | null | undefined) => Node | null | undefined =
  !NoElement && (Element.prototype as Partial<Element>).getRootNode
    ? (element) => element?.getRootNode?.()
    : (element) => element?.ownerDocument

/**
 * Determines if a node is inert or in an inert ancestor.
 * @param [node]
 * @param [lookUp] If true and `node` is not inert, looks up at ancestors to
 *  see if any of them are inert. If false, only `node` itself is considered.
 * @returns True if inert itself or by way of being in an inert ancestor.
 *  False if `node` is falsy.
 */
const isInert = function (node: Node | null | undefined, lookUp = true): boolean {
  // CAREFUL: JSDom does not support inert at all, so we can't use the `HTMLElement.inert`
  //  JS API property; we have to check the attribute, which can either be empty or 'true';
  //  if it's `null` (not specified) or 'false', it's an active element
  const inertAtt = (node as Element | null | undefined)?.getAttribute?.('inert')
  const inert = inertAtt === '' || inertAtt === 'true'

  // NOTE: this could also be handled with `node.matches('[inert], :is([inert] *)')`
  //  if it weren't for `matches()` not being a function on shadow roots; the following
  //  code works for any kind of node
  const result =
    inert ||
    (lookUp &&
      node &&
      // closest does not exist on shadow roots, so we fall back to a manual
      // lookup upward, in case it is not defined.
      (typeof (node as Element).closest === 'function'
        ? (node as Element).closest('[inert]')
        : isInert(node.parentNode)))

  // Upstream returns this expression as is; callers only test it for truthiness.
  return result as boolean
}

/**
 * Determines if a node's content is editable.
 * @param [node]
 * @returns True if it's content-editable; false if it's not or `node` is falsy.
 */
const isContentEditable = function (node: Element | null | undefined) {
  // CAREFUL: JSDom does not support the `HTMLElement.isContentEditable` API so we have
  //  to use the attribute directly to check for this, which can either be empty or 'true';
  //  if it's `null` (not specified) or 'false', it's a non-editable element
  const attValue = node?.getAttribute?.('contenteditable')
  return attValue === '' || attValue === 'true'
}

/**
 * @param el container to check in
 * @param includeContainer add container to check
 * @param filter filter candidates
 */
const getCandidates = function (
  el: Element,
  includeContainer: boolean | undefined,
  filter: (node: FocusableElement) => boolean
): FocusableElement[] {
  // even if `includeContainer=false`, we still have to check it for inertness because
  //  if it's inert (either by itself or via its parent), then all its children are inert
  if (isInert(el)) {
    return []
  }

  let candidates = Array.prototype.slice.apply(
    el.querySelectorAll<FocusableElement>(candidateSelector)
  ) as FocusableElement[]
  if (includeContainer && matches.call(el, candidateSelector)) {
    candidates.unshift(el as FocusableElement)
  }
  candidates = candidates.filter(filter)
  return candidates
}

type CandidateScope = {
  /** contains inner candidates */
  scopeParent: Element
  /** list of candidates found in the scope parent */
  candidates: Candidate[]
}

type Candidate = FocusableElement | CandidateScope

type IterativeOptions = {
  /** filter candidates */
  filter: (node: FocusableElement) => boolean
  /** if true then result will flatten any CandidateScope into the returned list */
  flatten: boolean
  /** filter shadow roots; true if a shadow root could potentially contain valid candidates */
  shadowRootFilter?: (shadowHostNode: Element) => boolean
}

/**
 * @param elements list of element containers to match candidates from
 * @param includeContainer add container list to check
 * @param options
 */
const getCandidatesIteratively = function (
  elements: ArrayLike<Element>,
  includeContainer: boolean | undefined,
  options: IterativeOptions
): Candidate[] {
  const candidates: Candidate[] = []
  const elementsToCheck = Array.from(elements)
  while (elementsToCheck.length) {
    const element = elementsToCheck.shift()!
    if (isInert(element, false)) {
      // no need to look up since we're drilling down
      // anything inside this container will also be inert
      continue
    }

    if (element.tagName === 'SLOT') {
      // add shadow dom slot scope (slot itself cannot be focusable)
      const assigned = (element as HTMLSlotElement).assignedElements()
      const content = assigned.length ? assigned : element.children
      const nestedCandidates = getCandidatesIteratively(content, true, options)
      if (options.flatten) {
        candidates.push(...nestedCandidates)
      } else {
        candidates.push({
          scopeParent: element,
          candidates: nestedCandidates,
        })
      }
    } else {
      // check candidate element
      const validCandidate = matches.call(element, candidateSelector)
      if (
        validCandidate &&
        options.filter(element as FocusableElement) &&
        // `elements` is an HTMLCollection only on recursive calls, which pass
        //  `includeContainer` as true, so `includes` is never reached on one
        (includeContainer || !(elements as Element[]).includes(element))
      ) {
        candidates.push(element as FocusableElement)
      }

      // iterate over shadow content if possible
      const shadowRoot = element.shadowRoot

      // no inert look up because we're already drilling down and checking for inertness
      //  on the way down, so all containers to this root node should have already been
      //  vetted as non-inert
      const validShadowRoot =
        !isInert(shadowRoot, false) &&
        (!options.shadowRootFilter || options.shadowRootFilter(element))

      if (shadowRoot && validShadowRoot) {
        // add shadow dom scope IIF a shadow root node was given
        const nestedCandidates = getCandidatesIteratively(shadowRoot.children, true, options)

        if (options.flatten) {
          candidates.push(...nestedCandidates)
        } else {
          candidates.push({
            scopeParent: element,
            candidates: nestedCandidates,
          })
        }
      } else {
        // there's not shadow so just dig into the element's (light dom) children
        //  __without__ giving the element special scope treatment
        elementsToCheck.unshift(...element.children)
      }
    }
  }
  return candidates
}

/**
 * @private
 * Determines if the node has an explicitly specified `tabindex` attribute.
 * @returns True if so; false if not.
 */
const hasTabIndex = function (node: Element) {
  return !isNaN(parseInt(node.getAttribute('tabindex')!, 10))
}

/**
 * Determine the tab index of a given node.
 * @returns Tab order (negative, 0, or positive number).
 * @throws {Error} If `node` is falsy.
 */
const getTabIndex = function (node: FocusableElement) {
  if (!node) {
    throw new Error('No node provided')
  }

  if (node.tabIndex < 0) {
    // in Chrome, <details/>, <audio controls/> and <video controls/> elements get a default
    // `tabIndex` of -1 when the 'tabindex' attribute isn't specified in the DOM,
    // yet they are still part of the regular tab order; in FF, they get a default
    // `tabIndex` of 0; since Chrome still puts those elements in the regular tab
    // order, consider their tab index to be 0.
    // Also browsers do not return `tabIndex` correctly for contentEditable nodes;
    // so if they don't have a tabindex attribute specifically set, assume it's 0.
    if (
      (/^(AUDIO|VIDEO|DETAILS)$/.test(node.tagName) || isContentEditable(node)) &&
      !hasTabIndex(node)
    ) {
      return 0
    }
  }

  return node.tabIndex
}

/**
 * Determine the tab index of a given node __for sort order purposes__.
 * @param [isScope] True for a custom element with shadow root or slot that, by default,
 *  has tabIndex -1, but needs to be sorted by document order in order for its content to be
 *  inserted into the correct sort position.
 * @returns Tab order (negative, 0, or positive number).
 */
const getSortOrderTabIndex = function (node: FocusableElement, isScope: boolean) {
  const tabIndex = getTabIndex(node)

  if (tabIndex < 0 && isScope && !hasTabIndex(node)) {
    return 0
  }

  return tabIndex
}

type OrderedTabbable = {
  documentOrder: number
  tabIndex: number
  item: Candidate
  isScope: boolean
  content: FocusableElement | FocusableElement[]
}

const sortOrderedTabbables = function (a: OrderedTabbable, b: OrderedTabbable) {
  return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex
}

const isInput = function (node: Element): node is HTMLInputElement {
  return node.tagName === 'INPUT'
}

const isHiddenInput = function (node: Element) {
  return isInput(node) && node.type === 'hidden'
}

const isDetailsWithSummary = function (node: Element) {
  const r =
    node.tagName === 'DETAILS' &&
    (Array.prototype.slice.apply(node.children) as Element[]).some(
      (child) => child.tagName === 'SUMMARY'
    )
  return r
}

const getCheckedRadio = function (
  nodes: NodeListOf<HTMLInputElement>,
  form: HTMLFormElement | null
) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]!.checked && nodes[i]!.form === form) {
      return nodes[i]
    }
  }
}

const isTabbableRadio = function (node: HTMLInputElement) {
  if (!node.name) {
    return true
  }
  const radioScope = (node.form || getRootNode(node)) as ParentNode
  const queryRadios = function (name: string) {
    return radioScope.querySelectorAll<HTMLInputElement>('input[type="radio"][name="' + name + '"]')
  }

  let radioSet
  if (
    typeof window !== 'undefined' &&
    typeof window.CSS !== 'undefined' &&
    typeof window.CSS.escape === 'function'
  ) {
    radioSet = queryRadios(window.CSS.escape(node.name))
  } else {
    try {
      radioSet = queryRadios(node.name)
    } catch (err) {
      console.error(
        'Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s',
        (err as Error).message
      )
      return false
    }
  }

  const checked = getCheckedRadio(radioSet, node.form)
  return !checked || checked === node
}

const isRadio = function (node: Element): node is HTMLInputElement {
  return isInput(node) && node.type === 'radio'
}

const isNonTabbableRadio = function (node: Element) {
  return isRadio(node) && !isTabbableRadio(node)
}

// determines if a node is ultimately attached to the window's document
const isNodeAttached = function (node: Element) {
  // The root node is the shadow root if the node is in a shadow DOM; some document otherwise
  //  (but NOT _the_ document; see second 'If' comment below for more).
  // If rootNode is shadow root, it'll have a host, which is the element to which the shadow
  //  is attached, and the one we need to check if it's in the document or not (because the
  //  shadow, and all nodes it contains, is never considered in the document since shadows
  //  behave like self-contained DOMs; but if the shadow's HOST, which is part of the document,
  //  is hidden, or is not in the document itself but is detached, it will affect the shadow's
  //  visibility, including all the nodes it contains). The host could be any normal node,
  //  or a custom element (i.e. web component). Either way, that's the one that is considered
  //  part of the document, not the shadow root, nor any of its children (i.e. the node being
  //  tested).
  // To further complicate things, we have to look all the way up until we find a shadow HOST
  //  that is attached (or find none) because the node might be in nested shadows...
  // If rootNode is not a shadow root, it won't have a host, and so rootNode should be the
  //  document (per the docs) and while it's a Document-type object, that document does not
  //  appear to be the same as the node's `ownerDocument` for some reason, so it's safer
  //  to ignore the rootNode at this point, and use `node.ownerDocument`. Otherwise,
  //  using `rootNode.contains(node)` will _always_ be true we'll get false-positives when
  //  node is actually detached.
  // NOTE: If `nodeRootHost` or `node` happens to be the `document` itself (which is possible
  //  if a tabbable/focusable node was quickly added to the DOM, focused, and then removed
  //  from the DOM as in https://github.com/focus-trap/focus-trap-react/issues/905), then
  //  `ownerDocument` will be `null`, hence the optional chaining on it.
  let nodeRoot = node && getRootNode(node)
  let nodeRootHost = (nodeRoot as ShadowRoot | null | undefined)?.host

  // in some cases, a detached node will return itself as the root instead of a document or
  //  shadow root object, in which case, we shouldn't try to look further up the host chain
  let attached = false
  if (nodeRoot && nodeRoot !== node) {
    attached = !!(
      nodeRootHost?.ownerDocument?.contains(nodeRootHost) || node?.ownerDocument?.contains(node)
    )

    while (!attached && nodeRootHost) {
      // since it's not attached and we have a root host, the node MUST be in a nested shadow DOM,
      //  which means we need to get the host's host and check if that parent host is contained
      //  in (i.e. attached to) the document
      nodeRoot = getRootNode(nodeRootHost)
      nodeRootHost = (nodeRoot as ShadowRoot | null | undefined)?.host
      attached = !!nodeRootHost?.ownerDocument?.contains(nodeRootHost)
    }
  }

  return attached
}

const isHidden = function (node: Element) {
  // NOTE: visibility will be `undefined` if node is detached from the document
  //  (see notes about this further down), which means we will consider it visible
  //  (this is legacy behavior from a very long way back)
  // NOTE: we check this regardless of `displayCheck="none"` because this is a
  //  _visibility_ check, not a _display_ check
  const { visibility } = getComputedStyle(node)
  if (visibility === 'hidden' || visibility === 'collapse') {
    return true
  }

  const isDirectSummary = matches.call(node, 'details>summary:first-of-type')
  const nodeUnderDetails = isDirectSummary ? node.parentElement! : node
  if (matches.call(nodeUnderDetails, 'details:not([open]) *')) {
    return true
  }

  // Test to see if it would normally be visible or not, provided it's
  //  attached to the main document.
  // NOTE: We must consider case where node is inside a shadow DOM and given directly to
  //  `isTabbable()` or `isFocusable()` -- regardless of `getShadowRoot` option setting.

  if (isNodeAttached(node)) {
    // this works wherever the node is: if there's at least one client rect, it's
    //  somehow displayed; it also covers the CSS 'display: contents' case where the
    //  node itself is hidden in place of its contents; and there's no need to search
    //  up the hierarchy either
    return !node.getClientRects().length
  }

  // Else, the node isn't attached to the document, which means the `getClientRects()`
  //  API will __always__ return zero rects (this can happen, for example, if React
  //  is used to render nodes onto a detached tree, as confirmed in this thread:
  //  https://github.com/facebook/react/issues/9117#issuecomment-284228870)
  //
  // It also means that even window.getComputedStyle(node).display will return `undefined`
  //  because styles are only computed for nodes that are in the document.
  //
  // v6.0.0: As of this major release, the default 'full' option __no longer treats detached
  //  nodes as visible with the 'none' fallback.__
  return true // hidden
}

// form fields (nested) inside a disabled fieldset are not focusable/tabbable
//  unless they are in the _first_ <legend> element of the top-most disabled
//  fieldset
const isDisabledFromFieldset = function (node: Element) {
  if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(node.tagName)) {
    let parentNode = node.parentElement
    // check if `node` is contained in a disabled <fieldset>
    while (parentNode) {
      if (parentNode.tagName === 'FIELDSET' && (parentNode as HTMLFieldSetElement).disabled) {
        // look for the first <legend> among the children of the disabled <fieldset>
        for (let i = 0; i < parentNode.children.length; i++) {
          const child = parentNode.children.item(i)!
          // when the first <legend> (in document order) is found
          if (child.tagName === 'LEGEND') {
            // if its parent <fieldset> is not nested in another disabled <fieldset>,
            // return whether `node` is a descendant of its first <legend>
            return matches.call(parentNode, 'fieldset[disabled] *') ? true : !child.contains(node)
          }
        }
        // the disabled <fieldset> containing `node` has no <legend>
        return true
      }
      parentNode = parentNode.parentElement
    }
  }

  // else, node's tabbable/focusable state should not be affected by a fieldset's
  //  enabled/disabled state
  return false
}

const isNodeMatchingSelectorFocusable = function (node: Element) {
  if (
    (node as HTMLButtonElement).disabled ||
    isHiddenInput(node) ||
    isHidden(node) ||
    // For a details element with a summary, the summary element gets the focus
    isDetailsWithSummary(node) ||
    isDisabledFromFieldset(node)
  ) {
    return false
  }
  return true
}

const isNodeMatchingSelectorTabbable = function (node: FocusableElement) {
  if (isNonTabbableRadio(node) || getTabIndex(node) < 0 || !isNodeMatchingSelectorFocusable(node)) {
    return false
  }
  return true
}

const isShadowRootTabbable = function (shadowHostNode: Element) {
  const tabIndex = parseInt(shadowHostNode.getAttribute('tabindex')!, 10)
  if (isNaN(tabIndex) || tabIndex >= 0) {
    return true
  }
  // If a custom element has an explicit negative tabindex,
  // browsers will not allow tab targeting said element's children.
  return false
}

const sortByOrder = function (candidates: Candidate[]): FocusableElement[] {
  const regularTabbables: FocusableElement[] = []
  const orderedTabbables: OrderedTabbable[] = []
  candidates.forEach(function (item, i) {
    const isScope = !!(item as CandidateScope).scopeParent
    const element = (isScope ? (item as CandidateScope).scopeParent : item) as FocusableElement
    const candidateTabindex = getSortOrderTabIndex(element, isScope)
    const elements = isScope ? sortByOrder((item as CandidateScope).candidates) : element
    if (candidateTabindex === 0) {
      if (isScope) regularTabbables.push(...(elements as FocusableElement[]))
      else regularTabbables.push(element)
    } else {
      orderedTabbables.push({
        documentOrder: i,
        tabIndex: candidateTabindex,
        item: item,
        isScope: isScope,
        content: elements,
      })
    }
  })

  return orderedTabbables
    .sort(sortOrderedTabbables)
    .reduce<FocusableElement[]>((acc, sortable) => {
      if (sortable.isScope) acc.push(...(sortable.content as FocusableElement[]))
      else acc.push(sortable.content as FocusableElement)
      return acc
    }, [])
    .concat(regularTabbables)
}

const tabbable = function (
  container: Element,
  options?: TabbableOptions & CheckOptions
): FocusableElement[] {
  options = options || {}

  let candidates
  if (options.getShadowRoot) {
    candidates = getCandidatesIteratively([container], options.includeContainer, {
      filter: isNodeMatchingSelectorTabbable,
      flatten: false,
      shadowRootFilter: isShadowRootTabbable,
    })
  } else {
    candidates = getCandidates(container, options.includeContainer, isNodeMatchingSelectorTabbable)
  }
  return sortByOrder(candidates)
}

const focusable = function (
  container: Element,
  options?: TabbableOptions & CheckOptions
): FocusableElement[] {
  options = options || {}

  let candidates
  if (options.getShadowRoot) {
    candidates = getCandidatesIteratively([container], options.includeContainer, {
      filter: isNodeMatchingSelectorFocusable,
      flatten: true,
    }) as FocusableElement[]
  } else {
    candidates = getCandidates(container, options.includeContainer, isNodeMatchingSelectorFocusable)
  }

  return candidates
}

const focusableCandidateSelector = /* #__PURE__ */ candidateSelectors
  .concat('iframe:not([inert]):not([inert] *)')
  .join(',')

// Without `displayCheck` or a `getShadowRoot` callback, no check reads the
//  options here; the parameter stays so call sites match the upstream API.
const isFocusable = function (node: Element, _options?: CheckOptions): boolean {
  if (!node) {
    throw new Error('No node provided')
  }
  if (matches.call(node, focusableCandidateSelector) === false) {
    return false
  }
  return isNodeMatchingSelectorFocusable(node)
}

export { tabbable, focusable, isFocusable, getTabIndex }
