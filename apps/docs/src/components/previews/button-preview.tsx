import { createSignal } from 'solid-js'
import { Button } from '../ui/button'

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function ButtonSpecimens(props: { theme: 'light' | 'dark' }) {
  const [count, setCount] = createSignal(0)

  return (
    <section
      data-theme={props.theme}
      class="border border-border bg-background p-6 text-foreground sm:p-8"
    >
      <h2 class="mb-8 text-sm capitalize text-muted-foreground">{props.theme}</h2>
      <div class="space-y-8">
        {(['default', 'outline'] as const).map((variant) => (
          <div class="flex flex-wrap items-center gap-6">
            <Button variant={variant} onClick={() => setCount((value) => value + 1)}>
              {variant === 'default' ? 'Save changes' : 'Show code'}
            </Button>
            <Button variant={variant} disabled>
              Disabled
            </Button>
            <Button variant={variant} pending>
              Saving...
            </Button>
            <Button variant={variant} disabled focusableWhenDisabled>
              Focusable disabled
            </Button>
          </div>
        ))}
        <div class="flex flex-wrap items-center gap-6">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button variant="outline" size="icon-sm" aria-label="Add item, small">
            <PlusIcon />
          </Button>
          <Button variant="outline" size="icon" aria-label="Add item">
            <PlusIcon />
          </Button>
          <Button variant="outline" size="icon-lg" aria-label="Add item, large">
            <PlusIcon />
          </Button>
        </div>
        <Button as="a" href="/" variant="outline">
          Back to docs
        </Button>
        <p role="status" class="text-sm text-muted-foreground">
          Actions: {count()}
        </p>
      </div>
    </section>
  )
}

export default function ButtonPreview() {
  return (
    <div class="space-y-8">
      <ButtonSpecimens theme="light" />
      <ButtonSpecimens theme="dark" />
    </div>
  )
}
