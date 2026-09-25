import { Button } from '@xenon-ui/solid/button'

export default function SubmitForm() {
  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <Button type="submit">Save profile</Button>
    </form>
  )
}
