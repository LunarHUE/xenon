import { Editable } from '@tenon/solid/editable'
import { Field } from '@tenon/solid/field'
import { NumberField } from '@tenon/solid/number-field'
import { PinInput } from '@tenon/solid/pin-input'
import { Slider } from '@tenon/solid/slider'
import { TagsInput } from '@tenon/solid/tags-input'
import type { JSX } from '@solidjs/web'
import { For, createSignal } from 'solid-js'

import { Bench, Readout, Section } from '../ui'

export function NumberFieldDemo(): JSX.Element {
  const [quantity, setQuantity] = createSignal<number | null>(3)
  const [price, setPrice] = createSignal<number | null>(12.5)
  return (
    <Section
      index="20"
      title="Number field"
      blurb="Edit a number as text, then commit it. Bounds, decimal steps and locale formatting stay together."
    >
      <Bench caption="A bounded quantity" note="0–12 · step 1">
        <NumberField class="stack" value={quantity()} onValueChange={setQuantity} min={0} max={12}>
          <NumberField.Label class="fieldset__label">Print copies</NumberField.Label>
          <NumberField.Control class="number-control">
            <NumberField.DecrementTrigger class="btn" aria-label="Fewer copies">
              −
            </NumberField.DecrementTrigger>
            <NumberField.Input class="input number-control__input" />
            <NumberField.IncrementTrigger class="btn" aria-label="More copies">
              +
            </NumberField.IncrementTrigger>
          </NumberField.Control>
        </NumberField>
        <p class="prose">
          Type a quantity, use the buttons, or press the arrow keys. Enter commits the draft.
        </p>
        <Readout rows={[['numeric value', quantity() === null ? 'empty' : String(quantity())]]} />
      </Bench>
      <Bench caption="French decimal notation" note="fr-FR · step 0.25">
        <NumberField
          class="stack"
          value={price()}
          onValueChange={setPrice}
          min={0}
          max={100}
          step={0.25}
          locale="fr-FR"
          formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
        >
          <NumberField.Label class="fieldset__label">Price per print, EUR</NumberField.Label>
          <NumberField.Control class="number-control">
            <NumberField.DecrementTrigger class="btn" aria-label="Lower price">
              −
            </NumberField.DecrementTrigger>
            <NumberField.Input class="input number-control__input" />
            <NumberField.IncrementTrigger class="btn" aria-label="Raise price">
              +
            </NumberField.IncrementTrigger>
          </NumberField.Control>
        </NumberField>
        <p class="prose">
          Try <code>18,75</code>. The field displays a decimal comma and keeps a numeric value for
          calculations and forms.
        </p>
        <Readout rows={[['numeric value', price() === null ? 'empty' : String(price())]]} />
      </Bench>
    </Section>
  )
}

export function PinInputDemo(): JSX.Element {
  const [code, setCode] = createSignal('')
  return (
    <Section
      index="21"
      title="Pin input"
      blurb="Six slots, one code. Typing advances focus; pasting distributes characters from the active slot."
    >
      <Bench caption="One-time verification" note="six digits">
        <Field class="fieldset" required>
          <Field.Label class="fieldset__label">Verification code</Field.Label>
          <Field.Description class="fieldset__hint">
            Try pasting 012345, or type one digit at a time.
          </Field.Description>
          <PinInput class="pin-slots" value={code()} onValueChange={setCode}>
            <For each={[0, 1, 2, 3, 4, 5]}>
              {(index) => <PinInput.Input class="input pin-slots__input" index={index} />}
            </For>
          </PinInput>
        </Field>
        <p class="prose">
          Arrow keys move between digits. Backspace removes a digit and moves back; Home and End
          move to the start and insertion point.
        </p>
        <Readout
          rows={[
            ['code', code() || 'empty'],
            ['completion', code().length === 6 ? 'complete' : `${code().length} of 6`],
          ]}
        />
      </Bench>
    </Section>
  )
}

export function SliderDemo(): JSX.Element {
  const [volume, setVolume] = createSignal([40])
  const [range, setRange] = createSignal([25, 75])
  return (
    <Section
      index="22"
      title="Slider"
      blurb="One thumb or a bounded range. Native range inputs keep the values reachable by keyboard."
    >
      <Bench caption="A single value" note="0–100 · step 5">
        <Slider class="demo-slider" value={volume()} onValueChange={setVolume} step={5}>
          <div class="row demo-slider__heading">
            <Slider.Label class="fieldset__label">Playback level</Slider.Label>
            <Slider.ValueText />
          </div>
          <Slider.Control class="demo-slider__control">
            <Slider.Track class="demo-slider__track">
              <Slider.Range class="demo-slider__range" />
            </Slider.Track>
            <Slider.Thumb class="demo-slider__thumb" />
          </Slider.Control>
        </Slider>
        <p class="prose">
          Drag along the track, or focus the thumb and use the arrow keys. Home and End reach the
          bounds.
        </p>
        <Readout rows={[['value', String(volume()[0])]]} />
      </Bench>
      <Bench caption="A range with a minimum gap" note="two thumbs · gap 10">
        <Slider
          class="demo-slider"
          value={range()}
          onValueChange={setRange}
          step={5}
          minStepsBetweenThumbs={2}
        >
          <div class="row demo-slider__heading">
            <Slider.Label class="fieldset__label">Preferred light level</Slider.Label>
            <Slider.ValueText />
          </div>
          <Slider.Control class="demo-slider__control">
            <Slider.Track class="demo-slider__track">
              <Slider.Range class="demo-slider__range" />
            </Slider.Track>
            <Slider.Thumb class="demo-slider__thumb" index={0} aria-label="Minimum light level" />
            <Slider.Thumb class="demo-slider__thumb" index={1} aria-label="Maximum light level" />
          </Slider.Control>
        </Slider>
        <p class="prose">
          Each thumb has its own tab stop. The lower and upper values keep their order and stay at
          least ten units apart.
        </p>
        <Readout
          rows={[
            ['lower', String(range()[0])],
            ['upper', String(range()[1])],
          ]}
        />
      </Bench>
    </Section>
  )
}

export function TagsInputDemo(): JSX.Element {
  const [tags, setTags] = createSignal(['Print', 'Paper'])
  return (
    <Section
      index="23"
      title="Tags input"
      blurb="Collect short labels, edit them in place, and remove individual entries. Every tag remains a separate value."
    >
      <Bench caption="Project materials" note="comma or Enter · maximum 6">
        <TagsInput class="stack" value={tags()} onValueChange={setTags} max={6}>
          {(state) => (
            <>
              <TagsInput.Label class="fieldset__label">Materials</TagsInput.Label>
              <TagsInput.Control class="tag-control">
                <For each={state.value}>
                  {(_tag, index) => (
                    <TagsInput.Item class="demo-tag" index={index()}>
                      <TagsInput.ItemText />
                      <TagsInput.ItemInput class="demo-tag__editor" aria-label="Edit material" />
                      <TagsInput.ItemDeleteTrigger class="demo-tag__remove">
                        ×
                      </TagsInput.ItemDeleteTrigger>
                    </TagsInput.Item>
                  )}
                </For>
                <TagsInput.Input class="tag-control__input" placeholder="Add a material" />
              </TagsInput.Control>
              <TagsInput.ClearTrigger class="btn">Clear materials</TagsInput.ClearTrigger>
            </>
          )}
        </TagsInput>
        <p class="prose">
          Type a tag and press Enter, or paste a comma-separated list. Double-click a tag to edit
          it. Use the arrow keys to move through tags from an empty input.
        </p>
        <Readout
          rows={[
            ['values', tags().join(', ') || 'empty'],
            ['count', `${tags().length} of 6`],
          ]}
        />
      </Bench>
    </Section>
  )
}

export function EditableDemo(): JSX.Element {
  const [title, setTitle] = createSignal('Studies in warm paper')
  const [action, setAction] = createSignal('ready')
  return (
    <Section
      index="24"
      title="Editable"
      blurb="A preview becomes a text field. Draft edits stay separate until you save them, and cancel restores the previous text."
    >
      <Bench caption="An inline project title" note="Enter saves · Escape cancels">
        <Editable
          class="stack demo-editable"
          value={title()}
          onValueChange={setTitle}
          onValueCommit={() => setAction('saved')}
          onCancel={() => setAction('canceled')}
          submitMode="enter"
        >
          <Editable.Label class="fieldset__label">Project title</Editable.Label>
          <Editable.Preview class="demo-editable__preview" />
          <Editable.Input class="input" />
          <div class="row">
            <Editable.EditTrigger class="btn" aria-label="Edit title">
              Edit title
            </Editable.EditTrigger>
            <Editable.SubmitTrigger class="btn btn--accent">Save</Editable.SubmitTrigger>
            <Editable.CancelTrigger class="btn">Cancel</Editable.CancelTrigger>
          </div>
        </Editable>
        <p class="prose">
          Click the title or the edit button. Changes only reach the committed value when you save;
          clicking elsewhere leaves this draft open.
        </p>
        <Readout
          rows={[
            ['committed title', title()],
            ['last action', action()],
          ]}
        />
      </Bench>
    </Section>
  )
}
