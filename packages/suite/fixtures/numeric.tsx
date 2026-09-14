import { Field } from '@tenon/solid/field'
import { NumberField } from '@tenon/solid/number-field'
import { PinInput } from '@tenon/solid/pin-input'
import { Slider } from '@tenon/solid/slider'
import { TagsInput } from '@tenon/solid/tags-input'
import { Editable } from '@tenon/solid/editable'

/** Numeric and text-entry forms rendered identically on server and client. */
export function NumericFixture() {
  return (
    <section id="numeric-fixture">
      <form onSubmit={(event) => event.preventDefault()}>
        <NumberField defaultValue={2.5} locale="de-DE" name="amount">
          <NumberField.Label>Server amount</NumberField.Label>
          <NumberField.IncrementTrigger />
          <NumberField.Input id="server-number-input" />
        </NumberField>
        <Field name="otp">
          <Field.Label>Server verification</Field.Label>
          <Field.Description>Enter the received code</Field.Description>
          <PinInput length={2} defaultValue="12">
            <PinInput.Input index={0} id="server-pin-input" />
            <PinInput.Input index={1} />
          </PinInput>
        </Field>
        <Slider defaultValue={[25]} name="volume">
          <Slider.Label>Server volume</Slider.Label>
          <Slider.Control>
            <Slider.Track />
            <Slider.Range />
            <Slider.Thumb index={0} />
          </Slider.Control>
        </Slider>
        <TagsInput defaultValue={['alpha']} name="labels">
          <TagsInput.Label>Server labels</TagsInput.Label>
          <TagsInput.Control>
            <TagsInput.Item index={0}>
              <TagsInput.ItemText />
              <TagsInput.ItemDeleteTrigger />
            </TagsInput.Item>
            <TagsInput.Input />
          </TagsInput.Control>
        </TagsInput>
        <Editable defaultValue="Server title" name="title">
          <Editable.Label>Server title label</Editable.Label>
          <Editable.Preview />
          <Editable.Input />
          <Editable.EditTrigger aria-label="Edit server title">
            Edit server title
          </Editable.EditTrigger>
          <Editable.SubmitTrigger aria-label="Save server title">
            Save server title
          </Editable.SubmitTrigger>
        </Editable>
      </form>
    </section>
  )
}
