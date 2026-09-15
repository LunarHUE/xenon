import { renderToString } from '@solidjs/web'
import { For } from 'solid-js'
import { Pagination } from './pagination'
import { Meter } from '../meter/meter'
import { Breadcrumbs } from '../breadcrumbs/breadcrumbs'
/** Serialize native measurement and navigation semantics before client JavaScript. */
export function renderFixture(): string {
  return renderToString(() => (
    <>
      <Meter value={40} aria-label="Storage" />
      <Pagination count={4} page={2}>
        {(state) => (
          <>
            <For each={state.pages}>
              {(page) =>
                typeof page === 'number' ? (
                  <Pagination.Item as="a" href={`/page/${page}`} page={page}>
                    {page}
                  </Pagination.Item>
                ) : (
                  <Pagination.Ellipsis>…</Pagination.Ellipsis>
                )
              }
            </For>
            <Pagination.Next as="a" href="/page/3">
              Next
            </Pagination.Next>
          </>
        )}
      </Pagination>
      <Breadcrumbs>
        <Breadcrumbs.List>
          <Breadcrumbs.Item>
            <Breadcrumbs.Link href="/">Home</Breadcrumbs.Link>
          </Breadcrumbs.Item>
          <Breadcrumbs.Item>
            <Breadcrumbs.Current>Page two</Breadcrumbs.Current>
          </Breadcrumbs.Item>
        </Breadcrumbs.List>
      </Breadcrumbs>
    </>
  ))
}
