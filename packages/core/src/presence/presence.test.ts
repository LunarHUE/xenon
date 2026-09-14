import { describe, expect, test } from 'vitest'

import { presence } from './presence'

describe('presence', () => {
  test('closed by default: absent, no attributes beyond the state hook', () => {
    const { state, parts } = presence()
    expect(state).toEqual({ open: false, present: false, status: 'exited' })
    expect(parts.root.attrs).toEqual({
      'data-state': 'closed',
      'data-starting-style': undefined,
      'data-ending-style': undefined,
      hidden: undefined,
    })
  })

  test('open without a status settles as entered and is present', () => {
    const { state, parts } = presence({ open: true })
    expect(state).toEqual({ open: true, present: true, status: 'entered' })
    expect(parts.root.attrs['data-state']).toBe('open')
  })

  test('entering marks the starting style', () => {
    const { attrs } = presence({ open: true, status: 'entering' }).parts.root
    expect(attrs).toMatchObject({ 'data-state': 'open', 'data-starting-style': '' })
    expect(attrs['data-ending-style']).toBeUndefined()
  })

  test('exiting keeps the element present and marks the ending style', () => {
    const { state, parts } = presence({ open: false, status: 'exiting' })
    expect(state.present).toBe(true)
    expect(parts.root.attrs).toMatchObject({
      'data-state': 'closed',
      'data-ending-style': '',
    })
    expect(parts.root.attrs['data-starting-style']).toBeUndefined()
  })

  test('a force mounted element stays visible while it animates out', () => {
    const exiting = presence({ open: false, status: 'exiting', forceMount: true })
    expect(exiting.state.present).toBe(true)
    expect(exiting.parts.root.attrs.hidden).toBeUndefined()
    expect(exiting.parts.root.attrs['data-ending-style']).toBe('')
  })

  test('force mount is always present and hidden while closed', () => {
    const closed = presence({ forceMount: true })
    expect(closed.state.present).toBe(true)
    expect(closed.parts.root.attrs.hidden).toBe(true)
    const open = presence({ open: true, forceMount: true })
    expect(open.parts.root.attrs.hidden).toBeUndefined()
  })

  test('without force mount the hidden attribute is never set', () => {
    expect(presence({ open: false, status: 'exiting' }).parts.root.attrs.hidden).toBeUndefined()
    expect(presence().parts.root.attrs.hidden).toBeUndefined()
  })

  test('the root carries no listeners and no role', () => {
    const { attrs, on } = presence({ open: true }).parts.root
    expect(on).toEqual({})
    expect(attrs).not.toHaveProperty('role')
  })
})
