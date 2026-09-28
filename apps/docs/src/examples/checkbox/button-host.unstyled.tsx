import { Checkbox } from '@xenon-ui/solid/checkbox'

export default function ButtonHost() {
  return (
    <Checkbox as="button" name="archived">
      Include archived projects
    </Checkbox>
  )
}
