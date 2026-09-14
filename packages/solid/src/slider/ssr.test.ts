import solid from '@solidjs/vite-plugin'
import { createServer } from 'vite'
import { expect, test } from 'vitest'

test('SSR emits native values, actual output target IDs, and forward Field descriptions', async () => {
  const server = await createServer({
    configFile: false,
    root: process.cwd(),
    appType: 'custom',
    plugins: [solid({ ssr: true, refresh: { disabled: true } })],
    server: { middlewareMode: true, hmr: false },
  })
  try {
    const fixture = (await server.ssrLoadModule('/src/slider/ssr-fixture.tsx')) as {
      renderSlider(): string
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
