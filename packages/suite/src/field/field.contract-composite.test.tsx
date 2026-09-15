import { test } from 'vitest'
import { fieldAdapterContract } from './contract'

test('field.notes.6 Combobox runs the shared Field battery', () => fieldAdapterContract('combobox'))
test('field.notes.6 TagsInput runs the shared Field battery', () => fieldAdapterContract('tags'))
