import { render } from '@solidjs/web'
import { E2eApp } from './app'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('E2E fixture document is missing #root')
render(() => <E2eApp />, root)
