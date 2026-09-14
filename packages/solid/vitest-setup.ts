// Registers @testing-library/jest-dom's matchers (toHaveAttribute etc.) with
// vitest's expect, including their types.
import '@testing-library/jest-dom/vitest'

// Some hosts lack reportError. Keep uncaught reactive errors fatal there too,
// so catching a synchronous throw cannot mask Solid's separate error report.
globalThis.reportError ??= (error: unknown) => {
  queueMicrotask(() => {
    throw error
  })
}
