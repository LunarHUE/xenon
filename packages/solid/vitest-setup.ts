// Registers @testing-library/jest-dom's matchers (toHaveAttribute etc.) with
// vitest's expect, including their types.
import '@testing-library/jest-dom/vitest'
import { OBSERVE } from 'solid-js'
import { afterEach, beforeEach, expect } from 'vitest'

// Some hosts lack reportError. Keep uncaught reactive errors fatal there too,
// so catching a synchronous throw cannot mask Solid's separate error report.
globalThis.reportError ??= (error: unknown) => {
  queueMicrotask(() => {
    throw error
  })
}

// Strict-mode findings Xenon must never produce. Tests run Solid's dev build,
// so each one fails the test that triggered it, not just the console.
const forbidden = new Set([
  'REACTIVE_WRITE_IN_OWNED_SCOPE',
  'STRICT_READ_UNTRACKED',
  'FLUSH_IN_EFFECT_CALLBACK',
])
let capture: ReturnType<NonNullable<typeof OBSERVE>['diagnostics']['capture']> | undefined
beforeEach(() => {
  capture = OBSERVE?.diagnostics.capture()
})
afterEach(() => {
  const events = capture?.stop() ?? []
  capture = undefined
  expect(
    events
      .filter((event) => forbidden.has(event.code))
      .map((event) => `${event.code}: ${event.message}`)
  ).toEqual([])
})
