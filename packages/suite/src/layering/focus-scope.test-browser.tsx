import { registerFocusScope, registerLayer } from '@tenon/dom'
import type { FocusScopeHandle, FocusScopeOptions } from '@tenon/dom'
import { afterEach, expect, onTestFinished, test } from 'vitest'
import { userEvent } from 'vitest/browser'

const scopes: FocusScopeHandle[] = []
const roots: HTMLElement[] = []
function region(markup: string) {
  const root = document.createElement('div')
  root.innerHTML = markup
  document.body.append(root)
  roots.push(root)
  return root
}
function scope(root: HTMLElement, options?: FocusScopeOptions) {
  const handle = registerFocusScope(root, options)
  scopes.push(handle)
  return handle
}
function input(root: ParentNode, id: string) {
  return root.querySelector<HTMLElement>(`#${id}`)!
}
afterEach(() => {
  for (const handle of scopes.splice(0).reverse()) handle.dispose()
  for (const root of roots.splice(0)) root.remove()
})

test('Tab wraps both ways and native fieldset, visibility, and tabindex rules filter stops', async () => {
  const root = region(`
    <input id="first">
    <input disabled><input hidden><input style="display:none">
    <input style="visibility:hidden"><input tabindex="-1">
    <fieldset disabled><input></fieldset><div inert><input></div>
    <input id="last">
  `)
  scope(root)
  expect(input(root, 'first')).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(input(root, 'last')).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(input(root, 'first')).toHaveFocus()
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
  expect(input(root, 'last')).toHaveFocus()
})

test('explicit initial focus wins, and disposal restores the opener', () => {
  const before = region('<input id="opener">')
  const opener = input(before, 'opener')
  opener.focus()
  const root = region('<input id="first"><input autofocus><input id="chosen" tabindex="-1">')
  const handle = scope(root, { initialFocus: input(root, 'chosen') })
  expect(input(root, 'chosen')).toHaveFocus()
  handle.dispose()
  expect(opener).toHaveFocus()
})

test('initialFocus false leaves the opener alone until keyboard navigation', async () => {
  const before = region('<input id="opener">')
  const opener = input(before, 'opener')
  opener.focus()
  const root = region('<input id="first"><input id="last">')
  scope(root, { initialFocus: false })
  expect(opener).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(input(root, 'first')).toHaveFocus()
})

test('an empty scope owns only its temporary fallback tabindex', async () => {
  const root = region('<p>Nothing interactive</p>')
  const handle = scope(root)
  expect(root).toHaveFocus()
  expect(root).toHaveAttribute('tabindex', '-1')
  await userEvent.keyboard('{Tab}')
  expect(root).toHaveFocus()
  handle.dispose()
  expect(root).not.toHaveAttribute('tabindex')
  const author = region('<p>Author fallback</p>')
  author.tabIndex = -1
  const another = scope(author)
  another.dispose()
  expect(author).toHaveAttribute('tabindex', '-1')
})

test('a portalled child trap pauses its parent and restores the parent opener', async () => {
  const root = region('<input id="first"><input id="opener">')
  const parent = scope(root)
  input(root, 'opener').focus()
  const portal = region('<input id="child-first"><input id="child-last">')
  const child = scope(portal, { parent })
  expect(input(portal, 'child-first')).toHaveFocus()
  input(root, 'first').focus()
  expect(input(portal, 'child-first')).toHaveFocus()
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
  expect(input(portal, 'child-last')).toHaveFocus()
  child.dispose()
  expect(input(root, 'opener')).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(input(root, 'first')).toHaveFocus()
})

test('a non-containing child and registered branches join the parent Tab ring', async () => {
  const root = region('<input id="parent">')
  const parent = scope(root)
  const branch = region('<input id="branch">')
  const release = parent.registerBranch(branch)
  const portal = region('<input id="child">')
  scope(portal, { parent, contain: false, initialFocus: false })
  await userEvent.keyboard('{Tab}')
  expect(input(branch, 'branch')).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(input(portal, 'child')).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(input(root, 'parent')).toHaveFocus()
  release()
  await userEvent.keyboard('{Tab}')
  expect(input(portal, 'child')).toHaveFocus()
})

test('programmatic escapes are reclaimed and a replacement view keeps its own focus', async () => {
  const root = region('<input id="first"><input id="last">')
  const outside = region('<input id="outside">')
  scope(root)
  input(root, 'last').focus()
  input(outside, 'outside').focus()
  expect(input(root, 'last')).toHaveFocus()
  root.innerHTML = '<input id="replacement"><input id="chosen">'
  input(root, 'chosen').focus()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  expect(input(root, 'chosen')).toHaveFocus()
  input(root, 'chosen').remove()
  await expect.poll(() => document.activeElement).toBe(input(root, 'replacement'))
  input(root, 'replacement').hidden = true
  await expect.poll(() => document.activeElement).toBe(root)
})

test('open shadow roots and slots participate in focus and Tab traversal', async () => {
  const root = region(
    '<input id="first"><div id="host"><input id="slotted"></div><input id="last">'
  )
  const shadow = input(root, 'host').attachShadow({ mode: 'open' })
  shadow.innerHTML = '<input id="shadow"><slot></slot>'
  scope(root)
  await userEvent.keyboard('{Tab}')
  expect(shadow.activeElement).toBe(input(shadow, 'shadow'))
  await userEvent.keyboard('{Tab}')
  expect(input(root, 'slotted')).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(input(root, 'last')).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(input(root, 'first')).toHaveFocus()
})

test('checked native radios contribute one stop per form, with positive tabindex first', async () => {
  const root = region(`
    <input id="positive" tabindex="2">
    <form><input type="radio" name="choice"><input id="a" type="radio" name="choice" checked></form>
    <form><input id="b" type="radio" name="choice" checked><input type="radio" name="choice"></form>
    <input id="last">
  `)
  scope(root)
  expect(input(root, 'positive')).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(input(root, 'a')).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(input(root, 'b')).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(input(root, 'last')).toHaveFocus()
})

test('non-containing scopes preserve outside focus deliberately claimed before close', () => {
  const before = region('<input id="opener"><input id="destination">')
  input(before, 'opener').focus()
  const root = region('<input>')
  const handle = scope(root, { contain: false })
  input(before, 'destination').focus()
  handle.dispose()
  expect(input(before, 'destination')).toHaveFocus()
})

test('closing an ancestor first does not steal child focus or lose the original return target', () => {
  const before = region('<input id="opener">')
  input(before, 'opener').focus()
  const root = region('<input id="parent">')
  const parent = scope(root)
  const portal = region('<input id="child">')
  const child = scope(portal, { parent })
  parent.dispose()
  // Exit content can remain mounted after its focus session ends.
  expect(input(portal, 'child')).toHaveFocus()
  child.dispose()
  expect(input(before, 'opener')).toHaveFocus()
})

test('canceling Tab in a widget suppresses scope navigation', async () => {
  const root = region('<input id="first"><input id="last">')
  scope(root)
  input(root, 'first').addEventListener('keydown', (event) => event.preventDefault(), {
    once: true,
  })
  await userEvent.keyboard('{Tab}')
  expect(input(root, 'first')).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(input(root, 'last')).toHaveFocus()
})

test('enabling containment and releasing the focused branch immediately reclaim focus', () => {
  const root = region('<input id="inside">')
  const outside = region('<input id="outside">')
  input(outside, 'outside').focus()
  const handle = scope(root, { contain: false, initialFocus: false })
  expect(input(outside, 'outside')).toHaveFocus()
  handle.update({ contain: true })
  expect(input(root, 'inside')).toHaveFocus()
  const release = handle.registerBranch(outside)
  input(outside, 'outside').focus()
  expect(input(outside, 'outside')).toHaveFocus()
  release()
  expect(input(root, 'inside')).toHaveFocus()
})

test('a parent resumes containment when a child opts out of restoration', () => {
  const root = region('<input id="parent">')
  const parent = scope(root)
  const portal = region('<input id="child">')
  const child = scope(portal, { parent, restoreFocus: false })
  child.dispose()
  expect(input(root, 'parent')).toHaveFocus()
})

test('an iframe document owns its own scope and keyboard listeners', async () => {
  const host = region('<iframe title="Focus scope frame"></iframe>')
  const frame = host.querySelector('iframe')!
  const owner = frame.contentDocument!
  owner.body.innerHTML = '<input id="first"><input id="last">'
  scope(owner.body)
  expect(owner.activeElement).toBe(input(owner, 'first'))
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
  expect(owner.activeElement).toBe(input(owner, 'last'))
  await userEvent.keyboard('{Tab}')
  expect(owner.activeElement).toBe(input(owner, 'first'))
})

test('explicit final focus is used only when it remains focusable', () => {
  const before = region('<input id="opener"><input id="destination">')
  const opener = input(before, 'opener')
  const destination = input(before, 'destination')
  opener.focus()
  const root = region('<input>')
  scope(root, { finalFocus: destination }).dispose()
  expect(destination).toHaveFocus()
  opener.focus()
  const handle = scope(root, { finalFocus: destination })
  destination.hidden = true
  handle.dispose()
  expect(opener).toHaveFocus()
})

test('opening a child synchronously from initial focus gives the new scope focus', () => {
  const root = region('<input id="parent">')
  const portal = region('<input id="child">')
  input(root, 'parent').addEventListener('focus', () => scope(portal), { once: true })
  scope(root)
  expect(input(portal, 'child')).toHaveFocus()
})

test('outside dismissal closes the focus session and returns to its opener', async () => {
  const before = region('<input id="opener"><input id="outside">')
  input(before, 'opener').focus()
  const root = region('<input id="inside">')
  const focusScope = scope(root)
  const layer = registerLayer(root, {
    outsidePointer: 'dismiss',
    onDismiss() {
      layer.dispose()
      focusScope.dispose()
      root.remove()
    },
  })
  onTestFinished(() => layer.dispose())
  await userEvent.click(input(before, 'outside'))
  await expect.poll(() => root.isConnected).toBe(false)
  expect(input(before, 'opener')).toHaveFocus()
})

test('a scope inside a shadow root recovers when its focused child disappears', async () => {
  const host = region('')
  const shadow = host.attachShadow({ mode: 'open' })
  const root = document.createElement('div')
  root.innerHTML = '<input id="first"><input id="last">'
  shadow.append(root)
  scope(root)
  expect(shadow.activeElement).toBe(input(root, 'first'))
  input(root, 'first').remove()
  await expect.poll(() => shadow.activeElement).toBe(input(root, 'last'))
})
