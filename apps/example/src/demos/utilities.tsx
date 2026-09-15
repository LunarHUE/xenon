import { Avatar } from '@tenon/solid/avatar'
import { VisuallyHidden } from '@tenon/solid/visually-hidden'
import { AccessibleIcon } from '@tenon/solid/accessible-icon'
import { Meter } from '@tenon/solid/meter'
import { Pagination } from '@tenon/solid/pagination'
import { Breadcrumbs } from '@tenon/solid/breadcrumbs'
import { ScrollArea } from '@tenon/solid/scroll-area'
import { Resizable } from '@tenon/solid/resizable'
import { Button } from '@tenon/solid/button'
import { createSignal, For } from 'solid-js'
import { Bench, Keys, Readout, Section } from '../ui'

/** A local illustration keeps the avatar study independent of external image services. */
const portrait = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#c1401b"/><circle cx="48" cy="36" r="17" fill="#f1eee4"/><path d="M15 96v-9a33 33 0 0 1 66 0v9" fill="#f1eee4"/></svg>')}`

/** Replace a native image with a broken source and recover without leaving the page. */
export function AvatarDemo() {
  const [available, setAvailable] = createSignal(true)
  return (
    <Section
      index="37"
      title="Avatar"
      blurb="A face when the image arrives, a name when it cannot. Switch the source to see the fallback take its place."
    >
      <Bench caption="Studio directory" note="local artwork · native loading">
        <div class="utility-person">
          <Avatar class="utility-avatar">
            <Avatar.Image
              src={available() ? portrait : 'data:image/png;base64,AAAA'}
              alt="Ada Lovelace"
            />
            <Avatar.Fallback role="img" aria-label="Ada Lovelace">
              AL
            </Avatar.Fallback>
          </Avatar>
          <div>
            <p class="utility-title">Ada Lovelace</p>
            <p class="prose">Correspondence &amp; calculations</p>
          </div>
        </div>
        <Button class="btn" onClick={() => setAvailable(!available())}>
          {available() ? 'Use broken image' : 'Restore image'}
        </Button>
        <Readout rows={[['source', available() ? 'local illustration' : 'broken image bytes']]} />
      </Bench>
    </Section>
  )
}

/** Focusable hidden content reveals a working skip link when reached by keyboard. */
export function VisuallyHiddenDemo() {
  const [saved, setSaved] = createSignal(false)
  return (
    <Section
      index="38"
      title="Visually hidden"
      blurb="Some words belong in an accessible name without taking up space. A skip link stays hidden until the keyboard reaches it."
    >
      <Bench caption="Names & shortcuts" note="Tab to reveal the skip link">
        <div class="utility-focus-slot">
          <VisuallyHidden as="a" focusable href="#hidden-study-result" class="utility-skip">
            Skip to saved note ↓
          </VisuallyHidden>
        </div>
        <Button class="btn utility-icon-button" onClick={() => setSaved(!saved())}>
          <span aria-hidden="true">{saved() ? '✓' : '+'}</span>
          <VisuallyHidden>{saved() ? 'Remove saved note' : 'Save note'}</VisuallyHidden>
        </Button>
        <p id="hidden-study-result" tabindex={-1} class="prose" role="status">
          {saved() ? 'The note is saved.' : 'The note has not been saved.'}
        </p>
        <p class="prose">
          The button has a full name for assistive technology. Use <Keys>Tab</Keys> to find the
          shortcut above it.
        </p>
      </Bench>
    </Section>
  )
}

/** A labeled piece of artwork provides the name for its surrounding native action. */
export function AccessibleIconDemo() {
  const [bookmarked, setBookmarked] = createSignal(false)
  return (
    <Section
      index="39"
      title="Accessible icon"
      blurb="Give artwork a name once. The drawing stays decorative inside its named wrapper, and the button owns the action."
    >
      <Bench caption="Keep this reference" note="one icon · one accessible name">
        <div class="row">
          <Button
            class="btn utility-icon-button"
            aria-pressed={bookmarked() ? 'true' : 'false'}
            onClick={() => setBookmarked(!bookmarked())}
          >
            <AccessibleIcon label="Bookmark reference">
              <svg width="22" height="26" viewBox="0 0 22 26">
                <path
                  d="M4 2h14v21l-7-5-7 5Z"
                  fill={bookmarked() ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  stroke-width="1.5"
                />
              </svg>
            </AccessibleIcon>
          </Button>
          <span class="prose" role="status">
            {bookmarked() ? 'Reference bookmarked' : 'Reference not bookmarked'}
          </span>
        </div>
      </Bench>
    </Section>
  )
}

/** A bounded measurement tracks occupied studio shelves rather than task progress. */
export function MeterDemo() {
  const [used, setUsed] = createSignal(6)
  return (
    <Section
      index="40"
      title="Meter"
      blurb="A measurement within known bounds. Add or remove a box to change how much of the studio shelf is occupied."
    >
      <Bench caption="Archive capacity" note="12 spaces available">
        <div class="utility-measure">
          <span class="utility-number">
            {used()}
            <small> / 12</small>
          </span>
          <span>occupied spaces</span>
        </div>
        <Meter
          as="div"
          class="utility-meter"
          value={used()}
          max={12}
          aria-label="Archive shelf occupancy"
          format={({ value }) => `${value} of 12 spaces occupied`}
        >
          <span />
        </Meter>
        <div class="row">
          <Button class="btn" disabled={used() === 0} onClick={() => setUsed(used() - 1)}>
            Remove a box
          </Button>
          <Button class="btn" disabled={used() === 12} onClick={() => setUsed(used() + 1)}>
            Add a box
          </Button>
        </div>
      </Bench>
    </Section>
  )
}

/** Page controls update the displayed slice of a small local archive. */
export function PaginationDemo() {
  const [page, setPage] = createSignal(1)
  return (
    <Section
      index="41"
      title="Pagination"
      blurb="A long index, a few entries at a time. Page controls keep the current position visible and stop at either end."
    >
      <Bench caption="Correspondence index" note="36 letters · 12 pages">
        <ol class="utility-records" start={(page() - 1) * 3 + 1}>
          <For each={[0, 1, 2]}>
            {(offset) => (
              <li>
                <span>Letter {String((page() - 1) * 3 + offset + 1).padStart(2, '0')}</span>
                <span>Studio correspondence</span>
              </li>
            )}
          </For>
        </ol>
        <Pagination
          class="utility-pagination"
          count={12}
          page={page()}
          onPageChange={setPage}
          aria-label="Correspondence pages"
        >
          {(state) => (
            <>
              <Pagination.Previous class="btn">←</Pagination.Previous>
              <For each={state.pages}>
                {(item) =>
                  typeof item === 'number' ? (
                    <Pagination.Item class="btn" page={item}>
                      {item}
                    </Pagination.Item>
                  ) : (
                    <Pagination.Ellipsis class="utility-pagination__ellipsis">
                      …
                    </Pagination.Ellipsis>
                  )
                }
              </For>
              <Pagination.Next class="btn">→</Pagination.Next>
            </>
          )}
        </Pagination>
        <p class="prose" role="status">
          Page {page()} of 12
        </p>
      </Bench>
    </Section>
  )
}

/** Native fragment links give the trail real destinations on the behavior sheet. */
export function BreadcrumbsDemo() {
  return (
    <Section
      index="42"
      title="Breadcrumbs"
      blurb="A short trail through the sheet. Earlier entries are ordinary links; the final entry identifies where you are."
    >
      <Bench caption="You are here" note="native links · ordered trail">
        <Breadcrumbs class="utility-breadcrumbs" aria-label="Behavior sheet location">
          <Breadcrumbs.List>
            <Breadcrumbs.Item>
              <Breadcrumbs.Link href="#button">Behavior sheet</Breadcrumbs.Link>
              <Breadcrumbs.Separator>/</Breadcrumbs.Separator>
            </Breadcrumbs.Item>
            <Breadcrumbs.Item>
              <Breadcrumbs.Link href="#avatar">Utilities</Breadcrumbs.Link>
              <Breadcrumbs.Separator>/</Breadcrumbs.Separator>
            </Breadcrumbs.Item>
            <Breadcrumbs.Item>
              <Breadcrumbs.Current>Breadcrumbs</Breadcrumbs.Current>
            </Breadcrumbs.Item>
          </Breadcrumbs.List>
        </Breadcrumbs>
        <p class="prose">
          Follow either link to another study. The separators are visual punctuation and stay out of
          the spoken trail.
        </p>
      </Bench>
    </Section>
  )
}

/** Two custom tracks reflect a native viewport containing a wide, long archive. */
export function ScrollAreaDemo() {
  return (
    <Section
      index="43"
      title="Scroll area"
      blurb="A window into a larger archive. Wheel, touch and keyboard scrolling stay native; the two tracks follow the same position."
    >
      <Bench caption="Materials ledger" note="scroll both axes">
        <ScrollArea class="utility-scroll" type="auto">
          <ScrollArea.Viewport class="utility-scroll__viewport" aria-label="Materials ledger">
            <ScrollArea.Content class="utility-scroll__content">
              <div class="utility-ledger utility-ledger--heading">
                <span>Accession</span>
                <span>Material</span>
                <span>Location</span>
                <span>Condition</span>
              </div>
              <For each={Array.from({ length: 20 }, (_, index) => index)}>
                {(index) => (
                  <div class="utility-ledger">
                    <span>{String(index + 1).padStart(3, '0')}</span>
                    <span>
                      {
                        ['Cotton rag paper', 'Copperplate proof', 'Linen sample', 'Graphite study'][
                          index % 4
                        ]
                      }
                    </span>
                    <span>
                      Shelf {Math.floor(index / 4) + 1} · Drawer {(index % 4) + 1}
                    </span>
                    <span>Catalogued</span>
                  </div>
                )}
              </For>
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar class="utility-scroll__bar" aria-label="Scroll ledger vertically">
            <ScrollArea.Thumb class="utility-scroll__thumb" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar
            orientation="horizontal"
            class="utility-scroll__bar"
            aria-label="Scroll ledger horizontally"
          >
            <ScrollArea.Thumb class="utility-scroll__thumb" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Corner class="utility-scroll__corner" />
        </ScrollArea>
        <p class="prose">
          Focus the ledger to use the arrow keys. You can also drag either thumb or focus a track
          and use <Keys>Home</Keys> and <Keys>End</Keys>.
        </p>
      </Bench>
    </Section>
  )
}

/** A controlled split layout exposes its current proportions and a reset action. */
export function ResizableDemo() {
  const [sizes, setSizes] = createSignal<readonly number[]>([35, 65])
  return (
    <Section
      index="44"
      title="Resizable"
      blurb="Give the index more room, or the page. Drag the divider or focus it and adjust the split with the arrow keys."
    >
      <Bench caption="Reading desk" note="bounded panels · keyboard divider">
        <Resizable class="utility-resizable" sizes={sizes()} onSizesChange={setSizes}>
          <Resizable.Panel
            index={0}
            minSize={20}
            maxSize={65}
            aria-label="Letter index"
            class="utility-resizable__panel"
          >
            <div class="utility-resizable__inner">
              <p class="utility-eyebrow">Index</p>
              <p class="utility-title">Selected letters</p>
              <ol class="utility-letter-list">
                <li>On the engine</li>
                <li>A new notation</li>
                <li>Notes for autumn</li>
              </ol>
            </div>
          </Resizable.Panel>
          <Resizable.Handle index={0} class="utility-resizable__handle" />
          <Resizable.Panel
            index={1}
            minSize={35}
            aria-label="Letter preview"
            class="utility-resizable__panel"
          >
            <div class="utility-resizable__inner">
              <p class="utility-eyebrow">Letter 01 / September</p>
              <p class="utility-letter">There is room in the margin for another thought.</p>
              <p class="prose">
                The preview wraps as you move the divider. Both panels keep enough space to remain
                useful.
              </p>
            </div>
          </Resizable.Panel>
        </Resizable>
        <div class="row">
          <Button class="btn" onClick={() => setSizes([35, 65])}>
            Reset split
          </Button>
          <span class="prose">
            {Math.round(sizes()[0]!)}% index / {Math.round(sizes()[1]!)}% preview
          </span>
        </div>
        <p class="prose">
          <Keys>←</Keys> <Keys>→</Keys> adjust the divider. Hold <Keys>Shift</Keys> for a larger
          step.
        </p>
      </Bench>
    </Section>
  )
}
