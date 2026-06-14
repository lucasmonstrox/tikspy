import { cache } from "react"

import { api } from "@/lib/api/client"
import type { SourceName } from "api"

const DATA_SOURCE_HEADER = "x-data-source"

function apiUnavailable(status: unknown): never {
  throw new Error(
    `API do TIKSPY indisponível (status ${String(status)}) — suba o apps/api com \`bun dev\``,
  )
}

/** cache() do React deduplica chamadas do mesmo request entre widgets. */
export const getMarketSummary = cache(async () => {
  const { data, error, response } = await api.v1.market.summary.get()
  if (error) apiUnavailable(error.status)
  return {
    summary: data,
    source: (response.headers.get(DATA_SOURCE_HEADER) ?? "mock") as SourceName,
  }
})

export const getTopProducts = cache(async (limit: number) => {
  const { data, error } = await api.v1.market.products.top.get({
    query: { limit },
  })
  if (error) apiUnavailable(error.status)
  return data
})

export const getProductDetail = cache(async (id: string) => {
  const { data, error } = await api.v1.market.products({ id }).get()
  if (error) {
    // 404 = produto sem ficha no EchoTik; devolve null (sheet sinaliza indisponível).
    if (error.status === 404) return null
    apiUnavailable(error.status)
  }
  return data
})

export const getTrendingCreatives = cache(async (limit: number) => {
  const { data, error } = await api.v1.market.creatives.trending.get({
    query: { limit },
  })
  if (error) apiUnavailable(error.status)
  return data
})

export const getTopSellingCreatives = cache(async (limit: number) => {
  const { data, error } = await api.v1.market.creatives["top-selling"].get({
    query: { limit },
  })
  if (error) apiUnavailable(error.status)
  return data
})

export const getMarketTrend = cache(async (days: number) => {
  const { data, error } = await api.v1.market.trend.get({
    query: { days },
  })
  if (error) apiUnavailable(error.status)
  return data
})
