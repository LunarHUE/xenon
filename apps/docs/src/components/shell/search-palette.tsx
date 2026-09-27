import type { JSX } from '@solidjs/web'
import {
  For,
  Match,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onSettled,
} from 'solid-js'
import { navigate } from 'astro:transitions/client'
import type { AnyPart } from '@xenon-ui/core'
import { combobox, getComboboxItemId } from '@xenon-ui/core/combobox'
import { Dialog } from '@xenon-ui/solid/dialog'
import { Search } from 'lucide'
import { Icon } from '../ui/icon'
import { cn } from '../../lib/utils'
import { search, type SearchIndex, type SearchResult } from '../../lib/search'

/** A result with a value that stays unique when two results share an href. */
type Entry = SearchResult & { value: string }

interface Loaded {
  version: string
  entries: Entry[]
}

declare global {
  interface Window {
    /** Set by SearchBoot.astro. */
    __docsSearch?: { opener: Element | null }
  }
}

/**
 * A core part's attributes and listeners as Solid props, with overrides on top.
 * An override handler runs first, and the part's own runs only if it didn't
 * prevent the default. It mirrors `spread` from the package root, which can't be
 * imported alone: the root re-exports every component.
 */
function bind(part: AnyPart, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const props: Record<string, unknown> = { ...part.attrs, ...overrides }
  for (const [name, listener] of Object.entries(part.on) as [string, (event: Event) => void][]) {
    const key = `on${name}`
    const own = Object.keys(overrides).find((prop) => prop.toLowerCase() === key)
    const first = own ? (overrides[own] as (event: Event) => void) : undefined
    if (own) delete props[own]
    props[key] = first
      ? (event: Event) => {
          first(event)
          if (!event.defaultPrevented) listener(event)
        }
      : listener
  }
  return props
}

let request: Promise<Loaded> | undefined

/** Fetch the index once per page load. A failed fetch is retried on the next open. */
function loadIndex(url: string): Promise<Loaded> {
  request ??= fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`${url}: ${response.status}`)
      return response.json() as Promise<SearchIndex>
    })
    .then((index) => ({
      version: index.version,
      entries: index.results.map((result, i) => ({ ...result, value: String(i) })),
    }))
    .catch((error: unknown) => {
      request = undefined
      throw error
    })
  return request
}

export interface SearchPaletteProps {
  /** The index built by pages/search-index.json.ts. */
  indexUrl: string
  /** Shown in the header before the index loads, so it doesn't jump. */
  version: string
}

/**
 * The search palette: a modal dialog holding a combobox and its listbox of
 * results. SearchBoot.astro catches the buttons and shortcuts, so this island
 * can load when the browser is idle. The index is fetched on first open.
 *
 * The input keeps focus the whole time. Arrows, Home and End move the
 * highlight, Enter opens it, and Escape closes the dialog and returns focus to
 * whatever opened it. The first result is highlighted as you type.
 */
export function SearchPalette(props: SearchPaletteProps): JSX.Element {
  const id = `docs-search-${createUniqueId()}`
  const [open, setOpen] = createSignal(false)
  const [opener, setOpener] = createSignal<HTMLElement>()
  const [index, setIndex] = createSignal<Loaded>()
  const [failed, setFailed] = createSignal(false)
  const [query, setQuery] = createSignal('')
  const [picked, setPicked] = createSignal<string>()

  const results = createMemo(() => {
    const loaded = index()
    return loaded ? (search(loaded.entries, query()) as Entry[]) : []
  })
  // An explicit highlight survives while it's still listed; otherwise the top result.
  const active = createMemo(() => {
    const list = results()
    const value = picked()
    return list.some((entry) => entry.value === value) ? value : list[0]?.value
  })

  const go = (value: string | undefined) => {
    const entry = results().find((candidate) => candidate.value === value)
    if (!entry) return
    setOpen(false)
    void navigate(entry.href)
  }

  const engine = createMemo(() =>
    combobox({
      id,
      items: results().map((entry) => ({ value: entry.value, label: entry.title })),
      inputValue: query(),
      open: true,
      activeValue: active(),
      filter: false,
      loop: true,
      onInputValueChange: (value) => {
        setQuery(value)
        setPicked(undefined)
      },
      onActiveChange: setPicked,
      onValueChange: go,
    })
  )

  const show = (element: Element | null) => {
    setOpener(element instanceof HTMLElement && element !== document.body ? element : undefined)
    setQuery('')
    setPicked(undefined)
    setOpen(true)
    if (index()) return
    loadIndex(props.indexUrl).then(
      (loaded) => {
        setFailed(false)
        setIndex(loaded)
      },
      () => setFailed(true)
    )
  }

  onSettled(() => {
    const state = (window.__docsSearch ??= { opener: null })
    const handle = () => {
      const element = state.opener
      state.opener = null
      if (open()) document.getElementById(`${id}-input`)?.focus()
      else show(element)
    }
    // A request that came in before this island loaded.
    if (state.opener) handle()
    document.addEventListener('docs-search:open', handle)
    return () => document.removeEventListener('docs-search:open', handle)
  })

  // Runs before the engine's handler, which skips any key prevented here.
  const keydown = (event: KeyboardEvent) => {
    const list = results()
    const plain = !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
    if (event.key === 'Escape') {
      // Close the dialog, not just the engine's notion of an open list.
      event.preventDefault()
      setOpen(false)
    } else if (plain && (event.key === 'Home' || event.key === 'End') && list.length) {
      event.preventDefault()
      setPicked(list[event.key === 'Home' ? 0 : list.length - 1].value)
    }
  }

  // Keep the highlighted row in view as it moves.
  createEffect(active, (value) => {
    if (value === undefined) return
    document.getElementById(getComboboxItemId(id, value))?.scrollIntoView({ block: 'nearest' })
  })

  const status = () => {
    if (failed()) return 'Search is unavailable. Reload the page to try again.'
    if (!index()) return 'Loading the index'
    if (!query().trim()) return ''
    const count = results().length
    return count === 0 ? 'No results' : count === 1 ? '1 result' : `${count} results`
  }

  return (
    <Dialog open={open()} onOpenChange={setOpen} finalFocus={opener()}>
      <Dialog.Portal>
        <Dialog.Viewport
          data-slot="search-viewport"
          class="outline-none [&::backdrop]:bg-foreground/20"
        >
          <Dialog.Content
            data-slot="search-palette"
            class={cn(
              'flex flex-col bg-background font-sans text-foreground outline-none',
              // A sheet on phones, a floating palette from sm up.
              'h-dvh w-full',
              'sm:mx-auto sm:mt-[12vh] sm:h-auto sm:max-h-[min(34rem,76vh)] sm:w-[min(40rem,calc(100vw-3rem))] sm:border sm:border-foreground sm:shadow-[3px_3px_0_var(--color-foreground)]'
            )}
          >
            <Dialog.Title class="sr-only">Search the docs</Dialog.Title>
            <div class="flex h-14 shrink-0 items-center gap-3 border-b-2 border-foreground px-4">
              <Icon icon={Search} class="size-5 shrink-0 text-muted-foreground" />
              <input
                {...bind(engine().parts.input, {
                  onKeyDown: keydown,
                  // The engine says "none" when it doesn't filter; the list here is filtered.
                  'aria-autocomplete': 'list',
                })}
                id={`${id}-input`}
                type="text"
                autofocus
                autocomplete="off"
                autocapitalize="off"
                spellcheck={false}
                enterkeyhint="go"
                placeholder="Search components, props, guides"
                aria-label="Search the docs"
                class="h-full min-w-0 flex-1 bg-transparent text-base leading-6 outline-none placeholder:text-muted-foreground"
              />
              <span class="hidden shrink-0 border border-border px-1.5 font-mono text-xs leading-5 text-muted-foreground sm:inline">
                {index()?.version ?? props.version}
              </span>
              <Dialog.Close
                aria-label="Close search"
                class="shrink-0 cursor-pointer border border-foreground px-1.5 font-mono text-xs leading-5 hover:bg-muted outline-offset-2 focus-visible:outline-2 focus-visible:outline-sidebar-primary"
              >
                <span class="sm:hidden">Close</span>
                <span class="hidden sm:inline">Esc</span>
              </Dialog.Close>
            </div>

            <div
              {...bind(engine().parts.content)}
              aria-label="Results"
              class="scroll-area min-h-0 flex-1 py-2 empty:hidden"
            >
              <For each={results()}>
                {(entry) => (
                  <div
                    {...bind(engine().parts.item(entry.value), {
                      // The highlighted row is the one Enter opens; nothing stays "chosen".
                      'aria-selected': active() === entry.value ? 'true' : 'false',
                    })}
                    class={cn(
                      'group grid cursor-pointer grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-x-3 border-s-[3px] border-transparent py-2 ps-[13px] pe-4',
                      'data-highlighted:border-sidebar-primary data-highlighted:bg-sidebar-selected'
                    )}
                  >
                    <span class="font-mono text-xs leading-5 text-muted-foreground group-data-highlighted:text-sidebar-primary">
                      {entry.type}
                    </span>
                    <span class="flex min-w-0 flex-col">
                      <span class="flex min-w-0 items-baseline gap-2">
                        <span
                          class={cn(
                            'truncate text-sm leading-5 font-medium group-data-highlighted:text-sidebar-primary',
                            entry.type === 'Property' && 'font-mono text-[13px]'
                          )}
                        >
                          {entry.title}
                        </span>
                        {entry.detail && (
                          <span class="truncate font-mono text-xs leading-5 text-muted-foreground">
                            {entry.detail}
                          </span>
                        )}
                      </span>
                      <span class="truncate text-xs leading-5 text-muted-foreground">
                        {entry.path.join(' / ')}
                      </span>
                    </span>
                  </div>
                )}
              </For>
            </div>

            <Switch>
              <Match when={failed() || !index() || (query().trim() && !results().length)}>
                <p class="flex-1 px-4 py-6 text-sm leading-5 text-muted-foreground sm:flex-none">
                  {failed()
                    ? 'Search is unavailable. Reload the page to try again.'
                    : !index()
                      ? 'Loading…'
                      : `No results for "${query().trim()}".`}
                </p>
              </Match>
              <Match when={!query().trim()}>
                <p class="flex-1 px-4 py-6 text-sm leading-5 text-muted-foreground sm:flex-none">
                  Search pages, guides, sections, props and examples.
                </p>
              </Match>
            </Switch>

            <div class="flex h-10 shrink-0 items-center justify-between gap-4 border-t border-foreground px-4 font-mono text-xs leading-5 text-muted-foreground">
              <span aria-hidden="true" class="hidden gap-4 sm:flex">
                <span>↑ ↓ move</span>
                <span>↵ open</span>
                <span>esc close</span>
              </span>
              {/* The message above already shows every state but a count. */}
              <span role="status" class={results().length ? 'ms-auto' : 'sr-only'}>
                {status()}
              </span>
            </div>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  )
}
