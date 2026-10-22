import { render, fireEvent } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Avatar } from './index'

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
}

beforeEach(() => {
  probes.length = 0
  vi.stubGlobal('Image', Probe)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

test.each(['srcset', 'sizes', 'crossorigin', 'referrerpolicy'] as const)(
  'a changed %s request rejects both stale success and stale failure',
  (key) => {
    const initial = {
      srcset: 'first.png 1x',
      sizes: '48px',
      crossorigin: 'anonymous' as const,
      referrerpolicy: 'no-referrer' as const,
    }
    const changed = {
      srcset: 'second.png 2x',
      sizes: '96px',
      crossorigin: 'use-credentials' as const,
      referrerpolicy: 'origin' as const,
    }
    const [config, setConfig] = createSignal(
      initial as {
        srcset: string
        sizes: string
        crossorigin: 'anonymous' | 'use-credentials'
        referrerpolicy: 'no-referrer' | 'origin'
      }
    )
    const view = render(() => (
      <Avatar data-testid="avatar">
        <Avatar.Image alt="Ada" src="profile.png" {...config()} />
        <Avatar.Fallback>Loading Ada</Avatar.Fallback>
      </Avatar>
    ))
    const old = probes[0]!
    const staleSuccess = old.onload!
    const staleFailure = old.onerror!
    old.load()
    expect(view.getByRole('img', { name: 'Ada' })).toBeInTheDocument()
    setConfig({ ...initial, [key]: changed[key] })
    flush()
    expect(view.queryByRole('img')).toBeNull()
    expect(view.getByTestId('avatar')).toHaveAttribute('data-state', 'loading')
    expect(view.getByText('Loading Ada')).toBeInTheDocument()
    staleSuccess()
    staleFailure()
    flush()
    expect(view.getByTestId('avatar')).toHaveAttribute('data-state', 'loading')
    expect(view.queryByRole('img')).toBeNull()
    probes[1]!.load()
    const image = view.getByRole('img', { name: 'Ada' })
    expect(image).toHaveAttribute(key, changed[key])
    staleFailure()
    flush()
    expect(view.getByRole('img')).toBe(image)
    expect(view.getByTestId('avatar')).toHaveAttribute('data-state', 'loaded')
    expect(view.queryByText('Loading Ada')).toBeNull()
  }
)

test('clearing all sources restores idle, ignores the abandoned request and allows a later srcset-only request', () => {
  const [src, setSrc] = createSignal<string | undefined>('first.png')
  const [srcset, setSrcset] = createSignal<string | undefined>()
  const view = render(() => (
    <Avatar data-testid="avatar">
      <Avatar.Image alt="Ada" src={src()} srcset={srcset()} />
      <Avatar.Fallback>Ada fallback</Avatar.Fallback>
    </Avatar>
  ))
  const first = probes[0]!
  const stale = first.onload!
  setSrc(undefined)
  flush()
  expect(view.getByTestId('avatar')).toHaveAttribute('data-state', 'idle')
  expect(view.getByText('Ada fallback')).toBeInTheDocument()
  first.naturalWidth = 48
  stale()
  flush()
  expect(view.queryByRole('img')).toBeNull()
  expect(view.getByTestId('avatar')).toHaveAttribute('data-state', 'idle')
  setSrcset('later.png 2x')
  flush()
  expect(view.getByTestId('avatar')).toHaveAttribute('data-state', 'loading')
  probes[1]!.load()
  expect(view.getByRole('img')).toHaveAttribute('srcset', 'later.png 2x')
  expect(view.getByRole('img')).not.toHaveAttribute('src')
  expect(view.queryByText('Ada fallback')).toBeNull()
})

test('a rendered image error starts a fresh fallback delay and a later source can recover', () => {
  vi.useFakeTimers()
  const [src, setSrc] = createSignal('first.png')
  const view = render(() => (
    <Avatar fallbackDelay={100} data-testid="avatar">
      <Avatar.Image src={src()} alt="Ada" />
      <Avatar.Fallback>Ada fallback</Avatar.Fallback>
    </Avatar>
  ))
  vi.advanceTimersByTime(100)
  flush()
  expect(view.getByText('Ada fallback')).toBeInTheDocument()
  probes[0]!.load()
  expect(view.queryByText('Ada fallback')).toBeNull()
  fireEvent.error(view.getByRole('img'))
  flush()
  expect(view.getByTestId('avatar')).toHaveAttribute('data-state', 'error')
  expect(view.queryByRole('img')).toBeNull()
  vi.advanceTimersByTime(99)
  flush()
  expect(view.queryByText('Ada fallback')).toBeNull()
  vi.advanceTimersByTime(1)
  flush()
  expect(view.getByText('Ada fallback')).toBeInTheDocument()
  setSrc('recovered.png')
  flush()
  probes[1]!.load()
  expect(view.getByRole('img')).toHaveAttribute('src', 'recovered.png')
  expect(view.queryByText('Ada fallback')).toBeNull()
})

test('separate avatar owners keep image failures and fallback delays independent', () => {
  vi.useFakeTimers()
  const view = render(() => (
    <>
      <Avatar fallbackDelay={100} data-testid="first">
        <Avatar.Image src="ada.png" alt="Ada" />
        <Avatar.Fallback>Ada fallback</Avatar.Fallback>
      </Avatar>
      <Avatar fallbackDelay={200} data-testid="second">
        <Avatar.Image src="grace.png" alt="Grace" />
        <Avatar.Fallback>Grace fallback</Avatar.Fallback>
      </Avatar>
    </>
  ))
  probes[0]!.load()
  probes[1]!.onerror?.()
  flush()
  vi.advanceTimersByTime(100)
  flush()
  expect(view.getByRole('img', { name: 'Ada' })).toBeInTheDocument()
  expect(view.getByTestId('first')).toHaveAttribute('data-state', 'loaded')
  expect(view.getByTestId('second')).toHaveAttribute('data-state', 'error')
  expect(view.queryByText('Ada fallback')).toBeNull()
  expect(view.queryByText('Grace fallback')).toBeNull()
  vi.advanceTimersByTime(100)
  flush()
  expect(view.getByText('Grace fallback')).toBeInTheDocument()
  expect(view.getByRole('img', { name: 'Ada' })).toBeInTheDocument()
})
