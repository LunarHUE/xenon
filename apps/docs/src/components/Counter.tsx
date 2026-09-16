import { createSignal } from 'solid-js'

export default function Counter(props: { initialCount?: number; label: string }) {
  const [count, setCount] = createSignal(props.initialCount ?? 0)

  return (
    <section aria-label={props.label} class="my-8 border border-stone-300 p-6">
      <h2 class="m-0 font-mono text-sm text-stone-600">{props.label}</h2>
      <p class="my-4 text-4xl tabular-nums" role="status" aria-live="polite">
        Count: {count()}
      </p>
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="cursor-pointer bg-stone-900 px-4 py-2 text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-4"
          onClick={() => setCount((value) => value + 1)}
        >
          Increment
        </button>
        <button
          type="button"
          class="cursor-pointer border border-stone-400 px-4 py-2 hover:bg-stone-200 focus-visible:outline-2 focus-visible:outline-offset-4"
          onClick={() => setCount(props.initialCount ?? 0)}
        >
          Reset
        </button>
      </div>
    </section>
  )
}
