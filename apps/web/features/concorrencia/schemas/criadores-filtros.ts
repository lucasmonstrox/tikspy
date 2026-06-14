import { z } from "zod"

export const CREATOR_SORTS = [
  "followers",
  "videos",
  "efficiency",
  "gmv",
] as const

/**
 * Filtros do /criadores — 100% server-side (viajam na URL → query do EchoTik).
 * Source of truth (CLAUDE.md): UI, service e parser derivam daqui. `.catch()`
 * torna o parse resiliente: querystring inválida cai no default em vez de
 * quebrar a página.
 */
export const creatorFiltersSchema = z.object({
  sort: z.enum(CREATOR_SORTS).catch("followers"),
  niche: z.string().optional().catch(undefined),
  minFollowers: z.coerce.number().int().positive().optional().catch(undefined),
})

export type CreatorFilters = z.infer<typeof creatorFiltersSchema>

/** searchParams cruas (Next) → filtros validados com defaults. */
export function parseCreatorFilters(
  searchParams: Record<string, string | string[] | undefined>
): CreatorFilters {
  return creatorFiltersSchema.parse({
    sort: searchParams.sort,
    niche: searchParams.niche,
    minFollowers: searchParams.minFollowers,
  })
}
