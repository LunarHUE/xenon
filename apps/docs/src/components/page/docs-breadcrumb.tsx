import { For, Show } from 'solid-js'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb'

/** One crumb. Crumbs without an href have no page of their own and render as text. */
export interface Crumb {
  label: string
  href?: string
}

/**
 * The trail above a docs page. The last crumb is the current page. Props only,
 * so Astro can render it without hydrating.
 */
export function DocsBreadcrumb(props: { crumbs: Crumb[] }) {
  const last = () => props.crumbs.length - 1
  return (
    <Breadcrumb>
      <BreadcrumbList variant="compact" class="min-h-14 gap-x-1 border-b border-muted-foreground">
        <For each={props.crumbs}>
          {(crumb, index) => (
            <BreadcrumbItem>
              <Show
                when={index() < last()}
                fallback={<BreadcrumbPage>{crumb.label}</BreadcrumbPage>}
              >
                <Show when={crumb.href} fallback={<span>{crumb.label}</span>}>
                  {(href) => <BreadcrumbLink href={href()}>{crumb.label}</BreadcrumbLink>}
                </Show>
                <BreadcrumbSeparator />
              </Show>
            </BreadcrumbItem>
          )}
        </For>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
