import { Toolbar } from '@tenon/solid'
import type { JSX } from '@solidjs/web'
import { createSignal } from 'solid-js'

import { Bench, Keys, Readout, Section } from '../ui'

export function ToolbarDemo(): JSX.Element {
  const [last, setLast] = createSignal('nothing yet')

  const pick = (name: string) => () => setLast(name)

  return (
    <Section
      index="04"
      title="Toolbar"
      blurb="One tab stop, arrows inside. The engine underneath is a plain navigator over an array
        of items, so it never touches an element and the next composite gets it for free."
    >
      <Bench caption="Horizontal" note="roving tabindex">
        <Toolbar class="toolbar" aria-label="Text formatting">
          <Toolbar.Group class="toolbar__group" aria-label="Style">
            <Toolbar.Button class="tool tool--bold" onClick={pick('bold')}>
              B
            </Toolbar.Button>
            <Toolbar.Button class="tool tool--italic" onClick={pick('italic')}>
              I
            </Toolbar.Button>
            <Toolbar.Button class="tool tool--underline" onClick={pick('underline')}>
              U
            </Toolbar.Button>
          </Toolbar.Group>
          <Toolbar.Separator class="sep" />
          <Toolbar.Group class="toolbar__group" aria-label="Clipboard" disabled>
            <Toolbar.Button class="tool" onClick={pick('cut')}>
              cut
            </Toolbar.Button>
            <Toolbar.Button class="tool" onClick={pick('copy')}>
              copy
            </Toolbar.Button>
          </Toolbar.Group>
          <Toolbar.Separator class="sep" />
          <Toolbar.Link class="tool" href="#toolbar" onClick={pick('link')}>
            docs
          </Toolbar.Link>
        </Toolbar>
        <p class="prose">
          <Keys>Tab</Keys> enters once and leaves once. <Keys>←</Keys> <Keys>→</Keys> move,{' '}
          <Keys>Home</Keys> and <Keys>End</Keys> jump, and the tab stop follows focus, so coming
          back lands where you left. The clipboard group is disabled as a group: its buttons answer{' '}
          <code>aria-disabled</code>, stay in the arrow ring, and swallow the click.
        </p>
        <Readout rows={[['last activated', last()]]} />
      </Bench>

      <Bench caption="Vertical" note="orientation">
        <Toolbar class="toolbar toolbar--vertical" orientation="vertical" aria-label="Layers">
          <Toolbar.Button class="tool" onClick={pick('raise')}>
            raise
          </Toolbar.Button>
          <Toolbar.Button class="tool" onClick={pick('lower')}>
            lower
          </Toolbar.Button>
          <Toolbar.Separator class="sep" />
          <Toolbar.Button class="tool" onClick={pick('merge')}>
            merge
          </Toolbar.Button>
        </Toolbar>
        <p class="prose">
          Vertical claims <Keys>↑</Keys> <Keys>↓</Keys> and leaves the horizontal arrows to the
          page. Separators always report the perpendicular orientation.
        </p>
      </Bench>

      <Bench caption="Right to left, no wrap" note="dir · loop">
        <div dir="rtl">
          <Toolbar class="toolbar" loop={false} aria-label="Pagination">
            <Toolbar.Button class="tool" onClick={pick('first')}>
              الأول
            </Toolbar.Button>
            <Toolbar.Button class="tool" onClick={pick('previous')}>
              السابق
            </Toolbar.Button>
            <Toolbar.Button class="tool" onClick={pick('next')}>
              التالي
            </Toolbar.Button>
            <Toolbar.Button class="tool" onClick={pick('last')}>
              الأخير
            </Toolbar.Button>
          </Toolbar>
        </div>
        <p class="prose">
          Direction comes from the nearest <code>dir</code> ancestor unless you pass one, so{' '}
          <Keys>→</Keys> walks backwards here. With <code>loop=&#123;false&#125;</code> the ends
          clamp instead of wrapping, and the key still has its default prevented at the boundary.
        </p>
      </Bench>
    </Section>
  )
}
