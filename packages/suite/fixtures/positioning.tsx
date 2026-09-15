import { createPositioner } from '@xenon/solid/positioning'
import { createSignal } from 'solid-js'

export function PositioningFixture() {
  const [anchor, setAnchor] = createSignal<HTMLElement>()
  const [floating, setFloating] = createSignal<HTMLElement>()
  const [arrow, setArrow] = createSignal<HTMLElement>()
  const [gap, setGap] = createSignal(12)
  const [moved, setMoved] = createSignal(false)
  const positioner = createPositioner({
    anchor,
    floating,
    arrow,
    options: () => ({
      side: 'bottom',
      align: 'start',
      sideOffset: gap(),
      autoUpdate: { animationFrame: true },
    }),
  })
  return (
    <main>
      <style>{`
        body { margin: 0; }
        #positioning-anchor { position: absolute; left: 160px; top: 140px;
          box-sizing: border-box; width: 80px; height: 30px; }
        #positioning-anchor[data-moved] { transform: translateX(75px); }
        #positioning-floating { width: 180px; height: 80px; }
        #positioning-floating article { height: 100%; background: #ddd;
          transform: scale(.95); transform-origin: var(--positioner-transform-origin); }
        #positioning-arrow { width: 10px; height: 10px; }
        #positioning-arrow::before { content: ''; position: absolute; inset: 0;
          transform: rotate(45deg); background: #ddd; }
      `}</style>
      <button onClick={() => setGap(24)}>Increase gap</button>
      <button onClick={() => setMoved(!moved())}>Move anchor</button>
      <button id="positioning-anchor" ref={setAnchor} data-moved={moved() ? '' : undefined}>
        Anchor
      </button>
      <div id="positioning-floating" ref={setFloating} {...positioner.positionerProps()}>
        <article>Positioned content</article>
        <span id="positioning-arrow" ref={setArrow} {...positioner.arrowProps()} />
      </div>
    </main>
  )
}
