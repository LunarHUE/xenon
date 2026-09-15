import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { Avatar } from '../../../solid/src/avatar'
import { createSignal, flush, Show } from 'solid-js'
import { within } from '@testing-library/dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { expectNoViolations } from '../a11y'

const cleanups: (() => void)[] = []
const probes: Probe[] = []
class Probe {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  naturalWidth = 0
  complete = false
  src = ''
  srcset = ''
  sizes = ''
  crossOrigin = ''
  referrerPolicy = ''
  constructor() {
    probes.push(this)
  }
  load() {
    this.naturalWidth = 48
    this.onload?.()
    flush()
  }
  error() {
    this.onerror?.()
    flush()
  }
}
function mount(children: () => JSX.Element) {
  const root = document.createElement('div')
  document.body.append(root)
  const dispose = render(children, root)
  cleanups.push(() => {
    dispose()
    root.remove()
  })
  flush()
  return { root, ...within(root) }
}
beforeEach(() => {
  probes.length = 0
  vi.stubGlobal('Image', Probe)
})
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

test('loading, loaded, error and stale source completion preserve one accessible representation', async () => {
  const [src, setSrc] = createSignal('one.png')
  const m = mount(() => (
    <Avatar>
      <Avatar.Image alt="Ada Lovelace" src={src()} />
      <Avatar.Fallback>Ada Lovelace</Avatar.Fallback>
    </Avatar>
  ))
  expect(m.root.firstElementChild).toHaveAttribute('data-state', 'loading')
  expect(m.queryByRole('img')).toBeNull()
  const first = probes[0]!
  const stale = first.onload!
  first.load()
  expect(m.getByRole('img')).toHaveAccessibleName('Ada Lovelace')
  expect(m.queryByText('Ada Lovelace')).toBeNull()
  setSrc('two.png')
  flush()
  expect(m.getByText('Ada Lovelace')).toBeInTheDocument()
  expect(first.onload).toBeNull()
  stale()
  flush()
  expect(m.queryByRole('img')).toBeNull()
  probes[1]!.error()
  expect(m.root.firstElementChild).toHaveAttribute('data-state', 'error')
  await expectNoViolations(m.root)
  setSrc('three.png')
  flush()
  probes[2]!.load()
  await expectNoViolations(m.root)
})

test('responsive source config and refs reach native img; removing Image restores fallback', () => {
  const [show, setShow] = createSignal(true)
  let image: HTMLImageElement | undefined
  const m = mount(() => (
    <Avatar>
      <Show when={show()}>
        <Avatar.Image
          alt="Ada"
          srcset="one.png 1x"
          sizes="48px"
          crossorigin="anonymous"
          referrerpolicy="no-referrer"
          ref={(node) => {
            image = node
          }}
          data-author="yes"
        />
      </Show>
      <Avatar.Fallback>Ada</Avatar.Fallback>
    </Avatar>
  ))
  expect(probes[0]).toMatchObject({
    srcset: 'one.png 1x',
    sizes: '48px',
    crossOrigin: 'anonymous',
    referrerPolicy: 'no-referrer',
  })
  probes[0]!.load()
  expect(m.getByRole('img')).toBe(image)
  expect(image).toHaveAttribute('data-author', 'yes')
  expect(image).toHaveAttribute('srcset', 'one.png 1x')
  setShow(false)
  flush()
  expect(m.getByText('Ada')).toBeInTheDocument()
  expect(m.root.firstElementChild).toHaveAttribute('data-state', 'idle')
})

test('missing source stays idle and fallback delay cleans up and responds to zero', () => {
  vi.useFakeTimers()
  const [delay, setDelay] = createSignal(100)
  const m = mount(() => (
    <Avatar fallbackDelay={delay()}>
      <Avatar.Image alt="Ada" />
      <Avatar.Fallback>Ada</Avatar.Fallback>
    </Avatar>
  ))
  expect(probes).toHaveLength(0)
  expect(m.root.firstElementChild).toHaveAttribute('data-state', 'idle')
  expect(m.queryByText('Ada')).toBeNull()
  vi.advanceTimersByTime(99)
  flush()
  expect(m.queryByText('Ada')).toBeNull()
  setDelay(0)
  flush()
  expect(m.getByText('Ada')).toBeInTheDocument()
  setDelay(500)
  flush()
  expect(m.getByText('Ada')).toBeInTheDocument()
})

test('cached complete probes resolve immediately and zero-width loads fail', () => {
  class Cached extends Probe {
    override complete = true
    override naturalWidth = 48
  }
  vi.stubGlobal('Image', Cached)
  const m = mount(() => (
    <Avatar>
      <Avatar.Image alt="Ada" src="cached.png" />
      <Avatar.Fallback>Ada</Avatar.Fallback>
    </Avatar>
  ))
  expect(m.getByRole('img')).toHaveAccessibleName('Ada')
  vi.stubGlobal('Image', Probe)
  const broken = mount(() => (
    <Avatar>
      <Avatar.Image alt="Grace" src="empty.png" />
      <Avatar.Fallback>Grace</Avatar.Fallback>
    </Avatar>
  ))
  probes[1]!.onload?.()
  flush()
  expect(broken.queryByRole('img')).toBeNull()
  expect(broken.root.firstElementChild).toHaveAttribute('data-state', 'error')
})
