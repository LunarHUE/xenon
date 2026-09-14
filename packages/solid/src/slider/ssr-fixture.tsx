import { renderToString } from '@solidjs/web'
import { Slider } from './slider'
import { Field } from '../field/field'
/** Server fixture for native values and Field forward associations. */
export function renderSlider(): string {
  return renderToString(() => (
    <Field>
      <Field.Label>Budget</Field.Label>
      <Slider defaultValue={[20, 60]} name="budget">
        <Slider.Control>
          <Slider.Thumb id="lower" index={0} aria-label="Minimum" />
          <Slider.Thumb id="upper" index={1} aria-label="Maximum" />
        </Slider.Control>
        <Slider.ValueText />
      </Slider>
      <Field.Description>Price range</Field.Description>
    </Field>
  ))
}
