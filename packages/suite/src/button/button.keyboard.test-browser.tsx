// jsdom cannot observe `button.keyboard.16`: it has no shadow-root event
// retargeting, so a composed keydown never reaches the host through
// composedPath().
import { screen } from '@testing-library/dom'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

describe('button keyboard', () => {
  spec('button.keyboard.16', async () => {
    const clicks = vi.fn()
    const m = mount('button', {
      as: 'div',
      children: <span>Go</span>,
      onClick: clicks,
    })
    const el = screen.getByRole('button')
    const shadowHost = el.firstElementChild
    if (!(shadowHost instanceof HTMLElement)) throw new Error('no shadow host')
    const root = shadowHost.attachShadow({ mode: 'open' })
    const inner = document.createElement('button')
    root.append(inner)
    inner.focus()
    inner.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true })
    )
    await m.settle()
    expect(clicks).toHaveBeenCalledTimes(1)
  })
})
