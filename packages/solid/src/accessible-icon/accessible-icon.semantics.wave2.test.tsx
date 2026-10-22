import { fireEvent, render } from '@solidjs/testing-library'
import type { ComponentProps } from '@solidjs/web'
import { createSignal, flush } from 'solid-js'
import { expect, test, vi } from 'vitest'
import { AccessibleIcon } from './index'

test('empty artwork still exposes its required image name', () => {
  const view = render(() => <AccessibleIcon label="Offline" />)
  const image = view.getByRole('img', { name: 'Offline' })
  expect(image.tagName).toBe('SPAN')
  expect(image.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  expect(image).not.toHaveAttribute('tabindex')
  expect(image).not.toHaveAttribute('label')
})

test('multiple decorative children retain their authored SVG attributes and identity', () => {
  const artwork = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  artwork.setAttribute('role', 'img')
  artwork.setAttribute('aria-label', 'Original artwork')
  const view = render(() => (
    <AccessibleIcon label="Forecast">
      {artwork}
      <span>Sun and clouds</span>
    </AccessibleIcon>
  ))
  const image = view.getByRole('img', { name: 'Forecast' })
  expect(view.getAllByRole('img')).toHaveLength(1)
  expect(image.querySelector('svg')).toBe(artwork)
  expect(artwork).toHaveAttribute('role', 'img')
  expect(artwork).toHaveAttribute('aria-label', 'Original artwork')
  expect(artwork.parentElement).toHaveAttribute('aria-hidden', 'true')
  expect(artwork.nextElementSibling).toHaveTextContent('Sun and clouds')
})

test('authored labelledby tracks external label text ahead of the generated label', () => {
  const [name, setName] = createSignal('Download report')
  const view = render(() => (
    <>
      <span id="icon-name">{name()}</span>
      <AccessibleIcon label="Download" aria-labelledby="icon-name" />
    </>
  ))
  const image = view.getByRole('img', { name: 'Download report' })
  setName('Download invoice')
  flush()
  expect(view.getByRole('img', { name: 'Download invoice' })).toBe(image)
})

test('author role and aria-label override generated image semantics', () => {
  const view = render(() => (
    <AccessibleIcon label="Default" role="status" aria-label="Connection" />
  ))
  expect(view.getByRole('status')).toHaveAccessibleName('Connection')
  expect(view.queryByRole('img')).toBeNull()
})

test('a forwarding noninteractive component receives host props, ref and author events', () => {
  const Host = (props: ComponentProps<'div'>) => <div {...props} />
  const click = vi.fn()
  let node: HTMLDivElement | undefined
  const view = render(() => (
    <AccessibleIcon
      as={Host}
      label="Cloud"
      class="weather"
      onClick={click}
      ref={(el) => {
        node = el
      }}
    />
  ))
  const image = view.getByRole('img')
  expect(image).toBe(node)
  expect(image).toHaveClass('weather')
  fireEvent.click(image)
  expect(click).toHaveBeenCalledOnce()
})
