import { generateHydrationScript, renderToString } from '@solidjs/web'
import { RoundOne } from './round-one'

export function render() {
  return generateHydrationScript() + renderToString(() => <RoundOne />)
}
