import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Separator } from './separator'

describe('<Separator />', () => {
  test('renders a native hr and adds no role of its own', () => {
    const { getByRole } = render(() => <Separator />)
    const el = getByRole('separator')
    expect(el.tagName).toBe('HR')
    expect(el).not.toHaveAttribute('role')
    expect(el).not.toHaveAttribute('aria-orientation')
    expect(el).toHaveAttribute('data-orientation', 'horizontal')
  })

  test('vertical is the only orientation worth announcing', () => {
    const { getByRole } = render(() => <Separator orientation="vertical" />)
    const el = getByRole('separator')
    expect(el).toHaveAttribute('aria-orientation', 'vertical')
    expect(el).toHaveAttribute('data-orientation', 'vertical')
  })

  test('any other element spells the role out', () => {
    const { getByRole } = render(() => <Separator as="div" />)
    expect(getByRole('separator').tagName).toBe('DIV')
  })

  test('decorative takes it out of the accessibility tree', () => {
    const { container } = render(() => <Separator decorative orientation="vertical" />)
    const el = container.querySelector('hr')
    expect(el).toHaveAttribute('role', 'none')
    expect(el).not.toHaveAttribute('aria-orientation')
    expect(el).toHaveAttribute('data-orientation', 'vertical')
  })

  test('unconsumed props land on the element and the ref resolves to it', () => {
    let seen: HTMLElement | undefined
    const { container } = render(() => (
      <Separator class="rule" data-testid="x" ref={(el) => (seen = el)} />
    ))
    const el = container.querySelector('hr')
    expect(el).toHaveClass('rule')
    expect(el).toHaveAttribute('data-testid', 'x')
    expect(seen).toBe(el)
  })
})
