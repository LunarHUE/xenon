import solid from '@solidjs/vite-plugin'
import { createServer } from 'vite'
import { expect, test, vi } from 'vitest'

test('SSR emits native values, actual output target IDs, and forward Field descriptions', async () => {
  const server = await createServer({
    configFile: false,
    root: process.cwd(),
    appType: 'custom',
    plugins: [solid({ ssr: true, refresh: false })],
    server: { middlewareMode: true, hmr: false, ws: false },
  })
  try {
    const fixture = (await server.ssrLoadModule('/src/slider/ssr-fixture.tsx')) as {
      renderSlider(): string
      renderSliderLabel(): string
    }
    const warn = vi.spyOn(console, 'warn')
    const error = vi.spyOn(console, 'error')
    try {
      const labeled = new DOMParser().parseFromString(fixture.renderSliderLabel(), 'text/html')
      expect(labeled.querySelector('input')?.getAttribute('aria-labelledby')).toBe('slider-label')
      expect([...warn.mock.calls, ...error.mock.calls].flat().join(' ')).not.toContain(
        'SERVER_WRITE'
      )
    } finally {
      warn.mockRestore()
      error.mockRestore()
    }
    const doc = new DOMParser().parseFromString(fixture.renderSlider(), 'text/html')
    const inputs = Array.from(doc.querySelectorAll('input'))
    expect(inputs.map((input) => input.getAttribute('value'))).toEqual(['20', '60'])
    expect(doc.querySelector('output')?.getAttribute('for')).toBe('lower upper')
    for (const input of inputs) {
      expect(input.getAttribute('name')).toBe('budget')
      expect(doc.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe(
        'Price range'
      )
    }
  } finally {
    await server.close()
  }
})
