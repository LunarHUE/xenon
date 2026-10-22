import { render } from '@solidjs/testing-library'
import type { ComponentProps } from '@solidjs/web'
import { createSignal, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { Breadcrumbs } from './breadcrumbs'

const ForwardedNav = (props: ComponentProps<'nav'>) => <nav {...props} />

test.each(['div', ForwardedNav] as const)(
  'polymorphic root %s retains navigation semantics and native list structure',
  (as) => {
    let ref: HTMLElement | undefined
    const view = render(() => (
      <Breadcrumbs.Root
        as={as}
        ref={(node: HTMLElement) => {
          ref = node
        }}
      >
        <Breadcrumbs.List>
          <Breadcrumbs.Item>
            <Breadcrumbs.Current>Settings</Breadcrumbs.Current>
          </Breadcrumbs.Item>
        </Breadcrumbs.List>
      </Breadcrumbs.Root>
    ))
    const root = view.getByRole('navigation', { name: 'Breadcrumbs' })
    expect(root).toBe(ref)
    expect(root).toHaveAttribute('role', 'navigation')
    expect(view.getByRole('list').parentElement).toBe(root)
    expect(view.getByRole('listitem').parentElement).toBe(view.getByRole('list'))
    expect(root).not.toHaveAttribute('as')
  }
)

test.each(['step', 'location', 'false', false] as const)(
  'author aria-current=%s overrides current-page marking reactively',
  (author) => {
    const [current, setCurrent] = createSignal(true)
    const view = render(() => (
      <Breadcrumbs.Link href="#step" current={current()} aria-current={author}>
        Step
      </Breadcrumbs.Link>
    ))
    const link = view.getByRole('link')
    if (author === false) expect(link).not.toHaveAttribute('aria-current')
    else expect(link).toHaveAttribute('aria-current', author)
    setCurrent(false)
    flush()
    expect(view.getByRole('link')).toBe(link)
    if (author === false) expect(link).not.toHaveAttribute('aria-current')
    else expect(link).toHaveAttribute('aria-current', author)
    expect(link).not.toHaveAttribute('current')
  }
)

test('all anatomy parts forward IDs and refs without inserting extra entries', () => {
  const refs: HTMLElement[] = []
  const ref = (node: HTMLElement) => {
    refs.push(node)
  }
  const view = render(() => (
    <Breadcrumbs>
      <Breadcrumbs.List id="trail-list" ref={ref}>
        <Breadcrumbs.Item id="trail-item" ref={ref}>
          <Breadcrumbs.Link id="trail-link" ref={ref} href="#home">
            Home
          </Breadcrumbs.Link>
          <Breadcrumbs.Separator id="trail-separator" ref={ref}>
            /
          </Breadcrumbs.Separator>
          <Breadcrumbs.Current id="trail-current" ref={ref}>
            Here
          </Breadcrumbs.Current>
        </Breadcrumbs.Item>
      </Breadcrumbs.List>
    </Breadcrumbs>
  ))
  expect(view.getAllByRole('listitem')).toHaveLength(1)
  for (const id of ['trail-list', 'trail-item', 'trail-link', 'trail-separator', 'trail-current']) {
    expect(refs).toContain(view.container.querySelector(`#${id}`))
  }
  expect(view.getByRole('listitem').children).toHaveLength(3)
})
