import { Accordion, CheckboxGroup, Field } from '@xenon-ui/solid'

/** SSR fixture for generated accordion associations and checkbox-group item labels. */
export function GroupSsrFixture() {
  return (
    <main>
      <Accordion defaultValue="one" collapsible>
        <Accordion.Item value="one">
          <Accordion.Trigger>Server section</Accordion.Trigger>
          <Accordion.Panel>Server panel</Accordion.Panel>
        </Accordion.Item>
      </Accordion>
      <CheckboxGroup aria-label="Server choices" defaultValue={['one']}>
        <Field>
          <Field.Label>First choice</Field.Label>
          <CheckboxGroup.Item value="one" />
        </Field>
        <Field>
          <Field.Label>Second choice</Field.Label>
          <CheckboxGroup.Item as="button" value="two" />
        </Field>
      </CheckboxGroup>
    </main>
  )
}
