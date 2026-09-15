import { Avatar, Field, Meter } from '@xenon/solid'

export function UtilityCoverage(props: { avatarPolicy?: 'no-referrer' | 'origin' } = {}) {
  return (
    <main>
      <h1>Utility SSR coverage</h1>
      <section aria-label="Avatar hydration">
        <Avatar>
          <Avatar.Image
            alt="Hydrated avatar"
            src="/utility-avatar.png"
            referrerpolicy={props.avatarPolicy ?? 'no-referrer'}
          />
          <Avatar.Fallback>Avatar fallback</Avatar.Fallback>
        </Avatar>
        <Avatar>
          <Avatar.Fallback>No image avatar</Avatar.Fallback>
        </Avatar>
      </section>
      <section aria-label="Meter hydration">
        <Meter value={40} aria-label="Utility meter" />
      </section>
      <section aria-label="Textarea hydration">
        <Field>
          <Field.Label>Utility notes</Field.Label>
          <Field.Control as="textarea" name="utility-notes" />
          <Field.Description>Hydrated textarea help</Field.Description>
        </Field>
      </section>
    </main>
  )
}
