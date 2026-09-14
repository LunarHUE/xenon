import { within, fireEvent } from '@testing-library/dom'
import { describe, expect, vi } from 'vitest'
import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

function separator(props: Record<string, unknown> = {}) {
  const m = mount('separator', props)
  return { ...m, el: m.container.firstElementChild as HTMLElement }
}

describe('separator conformance', () => {
  spec('separator.roles.1', () => {
    for (const as of ['hr', 'div']) {
      const m = separator({ as })
      expect(within(m.container).getByRole('separator')).toBe(m.el)
    }
  })
  spec('separator.roles.2', () => {
    const m = separator({ orientation: 'vertical' })
    expect(m.el).toHaveAttribute('aria-orientation', 'vertical')
    expect(m.el).not.toHaveAttribute('tabindex')
    m.el.focus()
    expect(m.el).not.toHaveFocus()
  })
  spec('separator.roles.3', () => {
    expect(separator({ orientation: 'vertical' }).el).toHaveAttribute(
      'aria-orientation',
      'vertical'
    )
  })
  spec('separator.roles.4', () => {
    for (const orientation of [undefined, 'horizontal'])
      expect(separator({ orientation }).el).not.toHaveAttribute('aria-orientation')
  })
  spec('separator.roles.6', () => {
    const m = separator()
    expect(m.el).toHaveAttribute('data-orientation', 'horizontal')
    m.setProps({ orientation: 'vertical' })
    expect(m.el).toHaveAttribute('data-orientation', 'vertical')
    expect(m.el).toHaveAttribute('aria-orientation', 'vertical')
    m.setProps({ orientation: 'horizontal' })
    expect(m.el).not.toHaveAttribute('aria-orientation')
  })
  spec('separator.roles.7', () => {
    const m = separator()
    expect(m.el.tagName).toBe('HR')
    expect(m.el).not.toHaveAttribute('role')
    expect(separator({ as: 'div' }).el).toHaveAttribute('role', 'separator')
  })
  spec('separator.roles.9', () => {
    const m = separator({ orientation: 'vertical' })
    m.setProps({ decorative: true })
    expect(m.el).toHaveAttribute('role', 'none')
    expect(m.el).not.toHaveAttribute('aria-orientation')
    expect(within(m.container).queryByRole('separator')).toBeNull()
    m.setProps({ decorative: false })
    expect(m.el).not.toHaveAttribute('role')
    expect(within(m.container).getByRole('separator')).toBe(m.el)
  })
  spec('separator.roles.10', () => {
    const m = separator({ 'aria-label': 'Section boundary', 'aria-labelledby': 'author-label' })
    expect(m.el).toHaveAttribute('aria-label', 'Section boundary')
    expect(m.el).toHaveAttribute('aria-labelledby', 'author-label')
  })
  spec('separator.a11y.1', async () => {
    for (const as of ['hr', 'div'])
      for (const orientation of ['horizontal', 'vertical']) {
        const m = separator({ as, orientation })
        await expectNoViolations(m.container)
        expect(m.el).not.toHaveAttribute('aria-valuenow')
      }
  })
  spec('separator.notes.1', () => {
    let node: HTMLElement | undefined
    const click = vi.fn()
    const m = separator({
      as: 'div',
      orientation: 'vertical',
      ref: (el: HTMLElement) => {
        node = el
      },
      'data-author': 'yes',
      class: 'rule',
      style: { color: 'red' },
      onClick: click,
    })
    expect(node).toBe(m.el)
    expect(m.el.tagName).toBe('DIV')
    expect(m.el).toHaveAttribute('role', 'separator')
    expect(m.el).toHaveAttribute('aria-orientation', 'vertical')
    expect(m.el).toHaveClass('rule')
    expect(m.el).toHaveAttribute('data-author', 'yes')
    expect(m.el.style.color).toBe('red')
    fireEvent.click(m.el)
    expect(click).toHaveBeenCalledOnce()
  })
})
