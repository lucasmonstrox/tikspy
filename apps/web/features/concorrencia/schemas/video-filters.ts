import { z } from "zod"

export const VIDEO_SORTS = ["trending", "top-selling"] as const
export const VIDEO_PERIODS = ["day", "week", "month"] as const
// Filtro de formato → created_by_ai do EchoTik (humano/IA); "all" = sem filtro.
export const VIDEO_AI = ["all", "human", "ai"] as const

/**
 * Filtros do /videos. Source of truth (CLAUDE.md): a UI, o service e o parser de
 * searchParams derivam daqui. `.catch()` torna o parse resiliente — querystring
 * inválida cai no default em vez de quebrar a página.
 */
export const videoFiltersSchema = z.object({
  sort: z.enum(VIDEO_SORTS).catch("trending"),
  period: z.enum(VIDEO_PERIODS).catch("day"),
  category: z.string().optional().catch(undefined),
  ai: z.enum(VIDEO_AI).catch("all"),
})

export type VideoFilters = z.infer<typeof videoFiltersSchema>

/** searchParams cruas (Next) → filtros validados com defaults. */
export function parseVideoFilters(
  searchParams: Record<string, string | string[] | undefined>,
): VideoFilters {
  return videoFiltersSchema.parse({
    sort: searchParams.sort,
    period: searchParams.period,
    category: searchParams.category,
    ai: searchParams.ai,
  })
}
