import { fieldAdapterContract } from './contract'
import { test } from 'vitest'

test('field.notes.6 NumberField runs the shared Field battery', () =>
  fieldAdapterContract('number'))
test('field.notes.6 Select runs the shared Field battery', () => fieldAdapterContract('select'))
