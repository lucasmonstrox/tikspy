import { cache } from "react"

import { api } from "@/lib/api/client"
import type { SourceName } from "api"

import { CATEGORIES_LIMIT } from "../consts"

const DATA_SOURCE_HEADER = "x-data-source"

function apiUnavailable(status: unknown): never {
  throw new Error(
    `API do TIKSPY indisponível (status ${String(status)}) — suba o apps/api com \`bun dev\``,
  )
}

/** Lista de categorias com métricas agregadas do ranking diário (cards de /categorias). */
export const getMarketCategories = cache(async () => {
  const { data, error, response } = await api.v1.market.categories.overview.get({
    query: { limit: CATEGORIES_LIMIT },
  })
  if (error) apiUnavailable(error.status)
  return {
    categories: data,
    source: (response.headers.get(DATA_SOURCE_HEADER) ?? "mock") as SourceName,
  }
})

/**
 * Detalhe de uma categoria (métricas + produtos em alta). Devolve null no 404
 * (id fora do catálogo) pra a página chamar notFound(); demais erros propagam.
 */
export const getMarketCategory = cache(async (id: string) => {
  const { data, error, response } = await api.v1.market.categories({ id }).get()
  if (error) {
    // 404 = id fora do catálogo L1 → a página chama notFound(); resto propaga.
    if (response.status === 404) return null
    apiUnavailable(error.status)
  }
  return data
})
