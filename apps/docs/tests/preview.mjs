import { preview } from 'astro'

// The programmatic API stays in the foreground in agent environments too,
// allowing Playwright to own the server's lifetime.
const server = await preview({ server: { host: '127.0.0.1', port: 4323 } })
console.log('Docs preview ready')
process.on('SIGTERM', () => server.stop())
process.on('SIGINT', () => server.stop())
