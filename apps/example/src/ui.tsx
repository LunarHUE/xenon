import type { JSX } from '@solidjs/web'
import { For } from 'solid-js'

export function Section(props: {
  index: string
  title: string
  blurb: string
  children: JSX.Element
}): JSX.Element {
  return (
    <section class="section" id={props.title.toLowerCase().replace(' ', '-')}>
      <div class="section__rail">
        <p class="section__index">{props.index}</p>
        <h2 class="section__title">{props.title}</h2>
        <p class="section__blurb">{props.blurb}</p>
      </div>
      <div class="section__body">{props.children}</div>
    </section>
  )
}

export function Bench(props: {
  caption: string
  note?: string
  children: JSX.Element
}): JSX.Element {
  return (
    <figure class="bench">
      <figcaption class="bench__caption">
        <span>{props.caption}</span>
        <span class="bench__note">{props.note}</span>
      </figcaption>
      <div class="bench__stage">{props.children}</div>
    </figure>
  )
}

export function Readout(props: { rows: [string, string][] }): JSX.Element {
  return (
    <dl class="readout">
      <For each={props.rows}>
        {(row) => (
          <div class="readout__row">
            <dt>{row[0]}</dt>
            <dd>{row[1]}</dd>
          </div>
        )}
      </For>
    </dl>
  )
}

export function Keys(props: { children: JSX.Element }): JSX.Element {
  return <kbd class="key">{props.children}</kbd>
}
