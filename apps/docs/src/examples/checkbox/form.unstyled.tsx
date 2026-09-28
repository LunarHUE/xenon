import { createSignal } from 'solid-js'
import { Button } from '@xenon-ui/solid/button'
import { Checkbox } from '@xenon-ui/solid/checkbox'

export default function Form() {
  const [sent, setSent] = createSignal('Not sent yet')
  const submit = (event: SubmitEvent) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget as HTMLFormElement)
    const entries = [...data].map(([name, value]) => `${name}=${value}`)
    setSent(entries.join('&') || 'No entries')
  }

  return (
    <form onSubmit={submit}>
      <label>
        <Checkbox name="digest" value="weekly" defaultChecked />
        Weekly digest
      </label>
      <label>
        <Checkbox name="announcements" />
        Product announcements
      </label>
      <Button type="submit">Save preferences</Button>
      <p>{sent()}</p>
    </form>
  )
}
