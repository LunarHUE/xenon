import { within, fireEvent } from '@testing-library/dom'
import { describe, expect, test, vi } from 'vitest'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

function bar(props: Record<string, unknown> = {}) {
  const m = mount('progress', { 'aria-label': 'Upload', ...props })
  return { ...m, el: within(m.container).getByRole('progressbar') }
}

describe('progress conformance', () => {
  spec('progress.roles.1', () => {
    const m = bar()
    expect(m.el).toHaveAttribute('role', 'progressbar')
    expect(within(m.container).queryByRole('meter')).toBeNull()
  })
  spec('progress.roles.2', () => {
    const m = bar({ value: 40 })
    expect(m.el).toHaveAttribute('aria-valuenow', '40')
  })
  spec('progress.roles.3', () => {
    const m = bar({ value: 0 })
    expect(m.el).toHaveAttribute('aria-valuemin', '0')
    expect(m.el).toHaveAttribute('aria-valuemax', '100')
  })
  spec('progress.roles.4', () => {
    const m = bar({ value: 5, 'aria-valuetext': 'Five files uploaded' })
    expect(m.el).toHaveAttribute('aria-valuetext', 'Five files uploaded')
  })
  spec('progress.roles.9', () => {
    const m = bar({ value: 12 })
    expect(m.el).toHaveAttribute('aria-valuenow', '12')
    m.setProps({ value: 47 })
    expect(m.el).toHaveAttribute('aria-valuenow', '47')
  })
  spec('progress.roles.10', () => {
    const m = bar({ min: 10, max: 20, value: 15 })
    expect(m.el).toHaveAttribute('aria-valuemin', '10')
    expect(m.el).toHaveAttribute('aria-valuemax', '20')
  })
  spec('progress.roles.11', () => {
    expect(bar({ value: 25 }).el).toHaveAttribute('aria-valuetext', '25%')
  })
  spec('progress.roles.12', () => {
    const m = bar({ value: 30, 'aria-labelledby': 'author-label', 'aria-valuetext': 'Author text' })
    expect(m.el).toHaveAttribute('aria-labelledby', 'author-label')
    expect(m.el).toHaveAttribute('aria-valuetext', 'Author text')
    m.setProps({ value: 60 })
    expect(m.el).toHaveAttribute('aria-valuetext', 'Author text')
  })
  spec('progress.keyboard.1', () => {
    const m = bar()
    expect(m.el).not.toHaveAttribute('tabindex')
    m.el.focus()
    expect(m.el).not.toHaveFocus()
  })
  spec('progress.pointer.1', () => {
    const m = bar({ value: 10 })
    fireEvent.click(m.el)
    expect(m.el).toHaveAttribute('aria-valuenow', '10')
  })
  spec('progress.state.5', () => {
    const m = bar()
    expect(m.el).not.toHaveAttribute('aria-valuenow')
    expect(m.el).not.toHaveAttribute('aria-valuetext')
  })
  spec('progress.state.6', () => {
    const m = bar()
    expect(m.el).toHaveAttribute('aria-valuemin', '0')
    expect(m.el).toHaveAttribute('aria-valuemax', '100')
  })
  spec('progress.state.9', () => {
    const m = bar({ min: -5, max: 5, value: 0 })
    expect(m.el).toHaveAttribute('aria-valuenow', '0')
    expect(m.el).toHaveAttribute('aria-valuetext', '50%')
  })
  spec('progress.state.11', () => {
    const m = bar({ value: 99 })
    expect(m.el).toHaveAttribute('data-state', 'loading')
    m.setProps({ value: 100 })
    expect(m.el).toHaveAttribute('data-state', 'complete')
    m.setProps({ value: 101 })
    expect(m.el).toHaveAttribute('aria-valuenow', '100')
    expect(m.el).toHaveAttribute('data-state', 'complete')
  })
  spec('progress.state.21', () => {
    const m = bar({ value: 20 })
    m.setProps({ value: 80 })
    expect(m.el).toHaveAttribute('aria-valuenow', '80')
    expect(m.el).toHaveAttribute('aria-valuetext', '80%')
  })
  spec('progress.a11y.1', async () => {
    const m = bar({ value: 25 })
    await expectNoViolations(m.container)
    m.setProps({ value: undefined })
    await expectNoViolations(m.container)
  })
  spec('progress.notes.2', () => {
    let node: HTMLElement | undefined
    const click = vi.fn()
    const m = bar({
      value: 5,
      ref: (el: HTMLElement) => {
        node = el
      },
      'data-author': 'yes',
      class: 'upload',
      style: { color: 'red' },
      onClick: click,
    })
    expect(node).toBe(m.el)
    expect(m.el).toHaveAttribute('data-author', 'yes')
    expect(m.el).toHaveClass('upload')
    expect(m.el.style.color).toBe('red')
    fireEvent.click(m.el)
    expect(click).toHaveBeenCalledOnce()
  })
  spec('progress.notes.3', () => {
    const m = bar({ as: 'article', value: 30 })
    expect(m.el.tagName).toBe('ARTICLE')
    expect(m.el).toHaveAttribute('aria-valuenow', '30')
    expect(m.el).toHaveAttribute('data-state', 'loading')
  })
})

describe('progress round-one contract', () => {
  // Root-only API: these assertions replace the research's indicator-width API.
  for (const value of [NaN, Infinity, -Infinity, undefined]) {
    itIndeterminate(value)
  }
  function itIndeterminate(value: number | undefined) {
    test(`clears previous values for ${String(value)}`, () => {
      const format = vi.fn(() => 'custom')
      const m = bar({ value: 25, format })
      expect(m.el.style.getPropertyValue('--progress-percentage')).toBe('25')
      format.mockClear()
      m.setProps({ value })
      expect(m.el).not.toHaveAttribute('aria-valuenow')
      expect(m.el).not.toHaveAttribute('aria-valuetext')
      expect(m.el).toHaveAttribute('data-state', 'indeterminate')
      expect(m.el.style.getPropertyValue('--progress-percentage')).toBe('')
      expect(format).not.toHaveBeenCalled()
    })
  }
  test('clamps both bounds and publishes percentage without losing author styles', () => {
    const m = bar({ min: 10, max: 20, value: -10, style: { color: 'red' } })
    expect(m.el).toHaveAttribute('aria-valuenow', '10')
    expect(m.el).toHaveAttribute('aria-valuetext', '0%')
    expect(m.el.style.getPropertyValue('--progress-percentage')).toBe('0')
    m.setProps({ value: 50 })
    expect(m.el).toHaveAttribute('aria-valuenow', '20')
    expect(m.el.style.getPropertyValue('--progress-percentage')).toBe('100')
    expect(m.el.style.color).toBe('red')
  })
  test('zero-width and invalid ranges never leak non-finite values', () => {
    for (const min of [0, 5]) {
      const m = bar({ min, max: min, value: min })
      expect(m.el).toHaveAttribute('aria-valuetext', '0%')
      expect(m.el.style.getPropertyValue('--progress-percentage')).toBe('0')
    }
    const m = bar({ min: NaN, max: Infinity, value: 30 })
    expect(m.el).toHaveAttribute('aria-valuemin', '0')
    expect(m.el).toHaveAttribute('aria-valuemax', '100')
  })
  test('formatter gets clamped range details and reacts to replacement', () => {
    const format = vi.fn(({ value }: { value: number }) => `${value} files`)
    const m = bar({ min: 10, max: 20, value: 50, format })
    expect(format).toHaveBeenCalledWith({ value: 20, min: 10, max: 20, percentage: 100 })
    expect(m.el).toHaveAttribute('aria-valuetext', '20 files')
    m.setProps({ format: () => 'Finished' })
    expect(m.el).toHaveAttribute('aria-valuetext', 'Finished')
  })
  test('changing author styles preserves the published percentage', () => {
    const m = bar({ value: 25, style: { color: 'red' } })
    m.setProps({ style: { color: 'blue' } })
    expect(m.el.style.color).toBe('blue')
    expect(m.el.style.getPropertyValue('--progress-percentage')).toBe('25')
    m.setProps({ style: 'color: green' })
    expect(m.el.style.color).toBe('green')
    expect(m.el.style.getPropertyValue('--progress-percentage')).toBe('25')
  })
})
