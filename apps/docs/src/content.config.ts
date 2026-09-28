import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

/** Guides and start-here pages: `src/content/docs/<slug>.mdx`. */
const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: z.enum(['start', 'guides']),
    /** Position in its sidebar section. Ties sort by title. */
    order: z.number().default(0),
  }),
})

/**
 * Component pages: `src/content/components/<component>/<tab>.mdx`, where the
 * file name is the tab. Every tab shares the component's header, so the
 * component-level fields live on `overview.mdx` only. `lib/content.ts` checks
 * that and rejects the fields anywhere else.
 */
const components = defineCollection({
  loader: glob({ pattern: '*/*.{md,mdx}', base: './src/content/components' }),
  schema: z.object({
    /** Component name, shown as the H1 on every tab. */
    title: z.string().optional(),
    description: z.string().optional(),
    /** Directory group. */
    group: z.enum(['actions', 'forms', 'overlays', 'structure']).optional(),
    /** Import path in the eyebrow. Defaults to `@xenon-ui/solid/<component>`. */
    package: z.string().optional(),
    /** A draft API gets "· Draft API" after the eyebrow. */
    status: z.enum(['stable', 'draft']).optional(),
  }),
})

export const collections = { docs, components }
