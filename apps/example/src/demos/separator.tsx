import { Separator } from '@tenon/solid/separator'
import type { JSX } from '@solidjs/web'

import { Bench, Section } from '../ui'

export function SeparatorDemo(): JSX.Element {
  return (
    <Section
      index="14"
      title="Separator"
      blurb="The smallest thing in the library, and the one that gets the accessibility tree wrong
        most often elsewhere. An hr is already a separator; saying so twice is the bug."
    >
      <Bench caption="Orientation" note="orientation">
        <div class="stack stack--wide">
          <p class="prose">Above the rule.</p>
          <Separator class="rule" />
          <p class="prose">Below it.</p>
        </div>
        <div class="row row--rule">
          <span>drafts</span>
          <Separator class="rule" as="div" orientation="vertical" />
          <span>sent</span>
          <Separator class="rule" as="div" orientation="vertical" />
          <span>archive</span>
        </div>
        <p class="prose">
          The default host is a real <code>hr</code>, which already means separator, so it is given
          no role at all. Any other element spells out <code>role="separator"</code>. Horizontal is
          the role's own default and stays unannounced; only{' '}
          <code>aria-orientation="vertical"</code> is worth the bytes. Both ends emit{' '}
          <code>data-orientation</code>, which is what the rules above and beside these words are
          keyed on.
        </p>
      </Bench>

      <Bench caption="Decorative" note="decorative">
        <div class="stack stack--wide">
          <p class="prose">A rule that is only a line.</p>
          <Separator class="rule" decorative />
          <p class="prose">
            It takes <code>role="none"</code> and drops its orientation from the tree, so a screen
            reader walks straight past it. Use it when the line is grouping nothing and is there
            because the page looked crowded without it.
          </p>
        </div>
      </Bench>
    </Section>
  )
}
