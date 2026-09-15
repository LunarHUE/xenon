import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal, flush, Show } from 'solid-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Avatar } from '../../../solid/src/avatar'

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

test('avatar.roles.3 avatar.animation.1: native source props reach both the probe and the loaded image', () => {
  const m = mount(() => (
    <Avatar>
      <Avatar.Image
        alt="Ada"
        src="avatar.png"
        srcset="avatar@2x.png 2x"
        sizes="48px"
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
      />
      <Avatar.Fallback>Ada</Avatar.Fallback>
    </Avatar>
  ))
  expect(probes[0]).toMatchObject({
    src: 'avatar.png',
    srcset: 'avatar@2x.png 2x',
    sizes: '48px',
    crossOrigin: 'anonymous',
    referrerPolicy: 'no-referrer',
  })
  probes[0]!.load()
  const image = m.getByRole('img')
  expect(image).toHaveAttribute('src', 'avatar.png')
  expect(image).toHaveAttribute('srcset', 'avatar@2x.png 2x')
  expect(image).toHaveAttribute('sizes', '48px')
  expect(image).toHaveAttribute('crossorigin', 'anonymous')
  expect(image).toHaveAttribute('referrerpolicy', 'no-referrer')
})

test('avatar.roles.6: explicit author aria-hidden remains on the loaded image', () => {
  const m = mount(() => (
    <Avatar>
      <Avatar.Image alt="Ada" src="avatar.png" aria-hidden="true" />
      <Avatar.Fallback>Ada</Avatar.Fallback>
    </Avatar>
  ))
  probes[0]!.load()
  expect(m.getByRole('img', { hidden: true })).toHaveAttribute('aria-hidden', 'true')
})

test('avatar.roles.8: fallback and image expose inverse data-state values', () => {
  const m = mount(() => (
    <Avatar>
      <Avatar.Image alt="Ada" src="avatar.png" />
      <Avatar.Fallback>Ada</Avatar.Fallback>
    </Avatar>
  ))
  expect(m.getByText('Ada')).toHaveAttribute('data-state', 'loading')
  probes[0]!.load()
  expect(m.getByRole('img')).toHaveAttribute('data-state', 'loaded')
  expect(m.queryByText('Ada')).toBeNull()
})

test('avatar.animation.5 avatar.animation.6: positive fallback delay waits, while zero delay shows synchronously', () => {
  vi.useFakeTimers()
  const delayed = mount(() => (
    <Avatar fallbackDelay={100}>
      <Avatar.Image alt="Ada" src="avatar.png" />
      <Avatar.Fallback>Ada delayed</Avatar.Fallback>
    </Avatar>
  ))
  expect(delayed.queryByText('Ada delayed')).toBeNull()
  vi.advanceTimersByTime(99)
  flush()
  expect(delayed.queryByText('Ada delayed')).toBeNull()
  vi.advanceTimersByTime(1)
  flush()
  expect(delayed.getByText('Ada delayed')).toBeInTheDocument()

  const fast = mount(() => (
    <Avatar fallbackDelay={100}>
      <Avatar.Image alt="Fast" src="fast.png" />
      <Avatar.Fallback>Fast fallback</Avatar.Fallback>
    </Avatar>
  ))
  const fastProbe = probes[1]!
  vi.advanceTimersByTime(50)
  fastProbe.load()
  expect(fast.getByRole('img')).toBeInTheDocument()
  expect(fast.queryByText('Fast fallback')).toBeNull()
  vi.advanceTimersByTime(100)
  flush()
  expect(fast.getByRole('img')).toBeInTheDocument()
  expect(fast.queryByText('Fast fallback')).toBeNull()

  const immediate = mount(() => (
    <Avatar fallbackDelay={0}>
      <Avatar.Image alt="Grace" src="missing.png" />
      <Avatar.Fallback>Grace immediate</Avatar.Fallback>
    </Avatar>
  ))
  expect(immediate.getByText('Grace immediate')).toBeInTheDocument()
})

test('avatar.state.5: a cached complete probe with zero natural width resolves directly to error', () => {
  class CachedBroken extends Probe {
    override complete = true
  }
  vi.stubGlobal('Image', CachedBroken)
  const m = mount(() => (
    <Avatar>
      <Avatar.Image alt="Grace" src="broken.png" />
      <Avatar.Fallback>Grace</Avatar.Fallback>
    </Avatar>
  ))
  expect(m.root.firstElementChild).toHaveAttribute('data-state', 'error')
  expect(m.getByText('Grace')).toBeInTheDocument()
  expect(m.queryByRole('img')).toBeNull()
})

test('avatar.state.7: unmounting a pending image cancels its fallback timer and obsolete callbacks', () => {
  vi.useFakeTimers()
  const [visible, setVisible] = createSignal(true)
  const m = mount(() => (
    <Show when={visible()}>
      <Avatar fallbackDelay={100}>
        <Avatar.Image alt="Ada" src="avatar.png" />
        <Avatar.Fallback>Ada</Avatar.Fallback>
      </Avatar>
    </Show>
  ))
  const stale = probes[0]!
  const staleOnload = stale.onload
  const timersBeforeDispose = vi.getTimerCount()
  setVisible(false)
  flush()
  expect(vi.getTimerCount()).toBeLessThan(timersBeforeDispose)
  vi.advanceTimersByTime(200)
  flush()
  expect(m.queryByText('Ada')).toBeNull()
  staleOnload?.()
  flush()
  stale.load()
  expect(m.queryByRole('img')).toBeNull()
  expect(m.queryByText('Ada')).toBeNull()
})

test('avatar.state.11: author load and prevented error handlers compose exactly once and can veto status changes', () => {
  const onLoad = vi.fn()
  const onError = vi.fn((event: Event) => event.preventDefault())
  const m = mount(() => (
    <Avatar>
      <Avatar.Image alt="Ada" src="avatar.png" onLoad={onLoad} onError={onError} />
      <Avatar.Fallback>Ada</Avatar.Fallback>
    </Avatar>
  ))
  probes[0]!.load()
  const image = m.getByRole('img')
  fireEvent.load(image)
  expect(onLoad).toHaveBeenCalledOnce()
  fireEvent.error(image)
  expect(onError).toHaveBeenCalledOnce()
  expect(m.getByRole('img')).toBe(image)
  expect(m.root.firstElementChild).toHaveAttribute('data-state', 'loaded')
})

test('avatar.notes.6: root and fallback props, refs, and polymorphic tags remain wired', () => {
  let rootRef: HTMLElement | undefined
  let fallbackRef: HTMLElement | undefined
  const m = mount(() => (
    <Avatar as="article" data-avatar="yes" ref={(node: HTMLElement) => (rootRef = node)}>
      <Avatar.Fallback
        as="div"
        data-fallback="yes"
        ref={(node: HTMLElement) => (fallbackRef = node)}
      >
        Ada
      </Avatar.Fallback>
    </Avatar>
  ))
  expect(m.root.firstElementChild?.tagName).toBe('ARTICLE')
  expect(m.root.firstElementChild).toHaveAttribute('data-avatar', 'yes')
  expect(rootRef).toBe(m.root.firstElementChild)
  expect(m.getByText('Ada').tagName).toBe('DIV')
  expect(m.getByText('Ada')).toHaveAttribute('data-fallback', 'yes')
  expect(fallbackRef).toBe(m.getByText('Ada'))
})
