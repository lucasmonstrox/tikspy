import { z } from "zod"

export const PRODUCT_SORTS = [
  "sales30d",
  "sales7d",
  "sales",
  "score",
  "price",
] as const

// Momento = preset de tendência + idade do produto (resolvido server-side):
// emergente (novo + explodindo) · consolidado ("em alta", maduro + subindo).
export const PRODUCT_MOMENTA = ["todos", "emergente", "consolidado"] as const

/**
 * Filtros do /produtos — 100% server-side (viajam na URL → query do EchoTik
 * product/list). Source of truth (CLAUDE.md): a UI, o service e o parser de
 * searchParams derivam daqui. `.catch()` torna o parse resiliente: querystring
 * inválida cai no default em vez de quebrar a página.
 */
export const productFiltersSchema = z.object({
  /** Busca por nome (search/items); vazio = lista por filtros (product/list). */
  q: z.string().trim().min(1).optional().catch(undefined),
  /** category_id L1 (catálogo /categories). */
  category: z.string().optional().catch(undefined),
  /** Preset de momento; default todos. */
  momentum: z.enum(PRODUCT_MOMENTA).catch("todos"),
  /** Comissão mínima em fração 0–1 (0.1 = 10%). */
  minCommission: z.coerce.number().min(0).max(1).optional().catch(undefined),
  /** Campo de ordenação; default vendas 30d. */
  sort: z.enum(PRODUCT_SORTS).catch("sales30d"),
})

export type ProductFilters = z.infer<typeof productFiltersSchema>

/** searchParams cruas (Next) → filtros validados com defaults. */
export function parseProductFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ProductFilters {
  return productFiltersSchema.parse({
    q: searchParams.q,
    category: searchParams.category,
    momentum: searchParams.momentum,
    minCommission: searchParams.minCommission,
    sort: searchParams.sort,
  })
}
