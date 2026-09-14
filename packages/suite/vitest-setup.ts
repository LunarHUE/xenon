import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

import { cleanup } from './src/harness/solid'

afterEach(cleanup)
