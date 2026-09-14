/**
 * Shared setup for jsdom and browser Vitest projects. Installs jest-dom matchers
 * and unmounts fixtures tracked by the suite's Solid harness after every test.
 * Independently created DOM or other testing-library mounts remain caller-owned.
 *
 * @packageDocumentation
 */
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

import { cleanup } from './src/harness/solid'

afterEach(cleanup)
