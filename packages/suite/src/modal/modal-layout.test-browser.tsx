import { registerModal } from '@xenon-ui/dom/modal'
import { afterEach, expect, test } from 'vitest'

const cleanups: (() => void)[] = []
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup()
})
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

test('modal scroll locking preserves viewport sticky headers and section rails', async () => {
  const originalScroll = window.scrollY
  const fixture = document.createElement('div')
  fixture.innerHTML = `<style>
    .modal-layout { min-height: 3500px; }
    .modal-layout header { position: sticky; top: 0; height: 40px; background: white; z-index: 1; }
    .modal-layout section { display: grid; grid-template-columns: 160px 1fr; margin-top: 200px; min-height: 2500px; }
    .modal-layout aside { position: sticky; top: 40px; align-self: start; height: 100px; background: white; }
  </style><div class="modal-layout"><header>Sticky masthead</header><section><aside>Sticky section rail</aside><main>Page content</main></section></div>`
  const dialog = document.createElement('dialog')
  dialog.innerHTML = '<button>Close</button>'
  document.body.append(fixture, dialog)
  cleanups.push(() => {
    fixture.remove()
    dialog.remove()
    window.scrollTo(0, originalScroll)
  })
  window.scrollTo(0, 500)
  await frame()
  const header = fixture.querySelector('header')!
  const rail = fixture.querySelector('aside')!
  const before = {
    header: header.getBoundingClientRect().top,
    rail: rail.getBoundingClientRect().top,
    scroll: window.scrollY,
    width: fixture.getBoundingClientRect().width,
  }
  expect(before.header).toBe(0)
  expect(before.rail).toBe(40)
  dialog.showModal()
  const lock = registerModal(dialog)
  cleanups.push(() => {
    lock.dispose()
    dialog.close()
  })
  await frame()
  expect(window.scrollY).toBe(before.scroll)
  expect(header.getBoundingClientRect().top).toBe(before.header)
  expect(rail.getBoundingClientRect().top).toBe(before.rail)
  expect(fixture.getBoundingClientRect().width).toBe(before.width)
  lock.dispose()
  dialog.close()
  await frame()
  expect(window.scrollY).toBe(before.scroll)
  expect(header.getBoundingClientRect().top).toBe(before.header)
})
