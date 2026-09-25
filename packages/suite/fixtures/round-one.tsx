import {
  Accordion,
  Button,
  Checkbox,
  Collapsible,
  Field,
  Progress,
  RadioGroup,
  Separator,
  Switch,
  Tabs,
  Toggle,
  ToggleGroup,
  Toolbar,
} from '@xenon-ui/solid'
import { Show, createSignal } from 'solid-js'

import { NumericFixture } from './numeric'

import { NestedFields } from './nested-fields'
import { StreamingField } from './streaming-field'

export function RoundOne(props: { asyncContent?: boolean } = {}) {
  const [count, setCount] = createSignal(0)
  return (
    <main>
      <h1>Server rendered components</h1>
      <NestedFields />
      <NumericFixture />
      <Show when={props.asyncContent}>
        <StreamingField />
      </Show>
      <Button onClick={() => setCount(count() + 1)}>Count {count()}</Button>
      <Field invalid>
        <Field.Label>Email</Field.Label>
        <Field.Description>Work address</Field.Description>
        <Field.Error>Required</Field.Error>
        <Field.Control name="email" />
      </Field>
      <Field>
        <Field.Label>Notes</Field.Label>
        <Field.Control as="textarea" name="notes" />
        <Field.Description>Extra notes</Field.Description>
      </Field>
      <Field>
        <Field.Label>
          <Checkbox name="terms" defaultChecked />
          Accept terms
        </Field.Label>
      </Field>
      <Field>
        <Field.Label>
          <Switch name="alerts" />
          Alerts
        </Field.Label>
      </Field>
      <Field>
        <Field.Label>Nested</Field.Label>
        <div>
          <Field.Control name="nested" />
        </div>
        <Field.Description>Nested help</Field.Description>
      </Field>
      <Field>
        <Field.Label>Explicit nested</Field.Label>
        <div>
          <Field.Control name="explicit-nested" aria-describedby="explicit-help" />
        </div>
        <Field.Description id="explicit-help">Explicit nested help</Field.Description>
      </Field>
      <Toggle>Bold</Toggle>
      <ToggleGroup defaultValue="left" aria-label="Alignment">
        <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
        <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
      </ToggleGroup>
      <RadioGroup defaultValue="one" name="choice" aria-label="Choice">
        <RadioGroup.Item value="one" aria-label="One" />
        <RadioGroup.Item value="two" aria-label="Two" />
      </RadioGroup>
      <Tabs defaultValue="first">
        <Tabs.List aria-label="Pages">
          <Tabs.Tab value="first">First</Tabs.Tab>
          <Tabs.Tab value="second">Second</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="first">First page</Tabs.Panel>
        <Tabs.Panel value="second">Second page</Tabs.Panel>
      </Tabs>
      <Tabs>
        <Tabs.List aria-label="Automatic pages">
          <Tabs.Tab value="blocked" disabled>
            Blocked page
          </Tabs.Tab>
          <Tabs.Tab value="automatic">Automatic page</Tabs.Tab>
          <Tabs.Tab value="alternative">Alternative page</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="blocked">Blocked content</Tabs.Panel>
        <Tabs.Panel value="automatic">Automatic content</Tabs.Panel>
        <Tabs.Panel value="alternative">Alternative content</Tabs.Panel>
      </Tabs>
      <Tabs value="chosen">
        <Tabs.List aria-label="Controlled pages">
          <Tabs.Tab value="other">Other controlled page</Tabs.Tab>
          <Tabs.Tab value="chosen">Chosen controlled page</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="other">Other controlled content</Tabs.Panel>
        <Tabs.Panel value="chosen">Chosen controlled content</Tabs.Panel>
      </Tabs>
      <Collapsible>
        <Collapsible.Trigger>Initially closed</Collapsible.Trigger>
        <Collapsible.Content>Initially closed content</Collapsible.Content>
      </Collapsible>
      <Collapsible forceMount>
        <Collapsible.Trigger>Retained closed</Collapsible.Trigger>
        <Collapsible.Content>Retained closed content</Collapsible.Content>
      </Collapsible>
      <Collapsible defaultOpen>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>Details content</Collapsible.Content>
      </Collapsible>
      <Accordion defaultValue="one" collapsible>
        <Accordion.Item value="one">
          <h2>
            <Accordion.Trigger>Section</Accordion.Trigger>
          </h2>
          <Accordion.Panel>Section content</Accordion.Panel>
        </Accordion.Item>
      </Accordion>
      <Toolbar aria-label="Tools">
        <Toolbar.Button>Copy</Toolbar.Button>
        <Toolbar.Button>Paste</Toolbar.Button>
      </Toolbar>
      <section aria-label="Button host matrix">
        <Button>Default native</Button>
        <Button type="submit">Native submit</Button>
        <Button type="reset">Native reset</Button>
        <Button disabled>Disabled native</Button>
        <Button as="div">Generic action</Button>
        <Button as="div" disabled>
          Disabled generic
        </Button>
        <Button as="input" type="button" value="Input action" />
        <Button as="a" href="#server-target">
          Native link
        </Button>
      </section>
      <Field>
        <Field.Label>Explicit server checkbox</Field.Label>
        <Checkbox id="server-checkbox" defaultChecked />
      </Field>
      <section aria-label="Sequential toolbars">
        <Button>Before toolbars</Button>
        <Toolbar aria-label="First sequential toolbar">
          <Toolbar.Button>First action</Toolbar.Button>
          <Toolbar.Button disabled focusableWhenDisabled={false}>
            Unavailable action
          </Toolbar.Button>
          <Toolbar.Link href="#server-target">First link</Toolbar.Link>
        </Toolbar>
        <Toolbar aria-label="Second sequential toolbar">
          <Toolbar.Button>Second action</Toolbar.Button>
          <Toolbar.Button>Last action</Toolbar.Button>
        </Toolbar>
        <Button>After toolbars</Button>
      </section>
      <Progress value={40} aria-label="Loading" />
      <Separator />
    </main>
  )
}
