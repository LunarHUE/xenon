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
 * so Astro can render it without hydrating. The separator carries its own word
 * spaces instead of flex gaps, so the trail sets like the line of text
 * "Components / Button" on the board.
 */
export function DocsBreadcrumb(props: { crumbs: Crumb[] }) {
  const last = () => props.crumbs.length - 1
  return (
    <Breadcrumb>
      <BreadcrumbList variant="compact" class="gap-x-0">
        <For each={props.crumbs}>
          {(crumb, index) => (
            <BreadcrumbItem class="group-data-[variant=compact]/breadcrumb-list:gap-0">
              <Show
                when={index() < last()}
                fallback={<BreadcrumbPage>{crumb.label}</BreadcrumbPage>}
              >
                <Show when={crumb.href} fallback={<span>{crumb.label}</span>}>
                  {(href) => <BreadcrumbLink href={href()}>{crumb.label}</BreadcrumbLink>}
                </Show>
                <BreadcrumbSeparator class="whitespace-pre">{' / '}</BreadcrumbSeparator>
              </Show>
            </BreadcrumbItem>
          )}
        </For>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
