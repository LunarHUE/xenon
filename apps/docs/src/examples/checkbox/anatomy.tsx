import { Checkbox } from '@xenon-ui/solid/checkbox'

export default function CheckboxAnatomy() {
  return (
    <label data-anatomy="label" class="flex items-center gap-3 text-sm">
      <Checkbox
        data-anatomy="Checkbox"
        defaultChecked
        class="size-4 accent-neutral-950 focus-visible:outline-2
          focus-visible:outline-offset-4 focus-visible:outline-pink-600
          dark:accent-white"
      />
      Email me product updates
    </label>
  )
}
