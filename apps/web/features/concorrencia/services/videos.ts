import { cache } from "react"

import { api } from "@/lib/api/client"

import { VIDEOS_LIMIT } from "../consts"
import type { VideoFilters } from "../schemas/video-filters"

/** cache() do React deduplica chamadas do mesmo request entre componentes. */
export const getVideos = cache(async (filters: VideoFilters) => {
  const { data, error } = await api.v1.market.videos.get({
    query: {
      sort: filters.sort,
      period: filters.period,
      // Categoria só vale no ranking de vendas (doc EchoTik) — a UI já bloqueia
      // o filtro fora de "Mais vendas", mas reforçamos aqui.
      category:
        filters.sort === "top-selling" && filters.category
          ? filters.category
          : undefined,
      ai: filters.ai === "all" ? undefined : filters.ai === "ai",
      limit: VIDEOS_LIMIT,
    },
  })
  if (error) {
    throw new Error(
      `API do TIKSPY indisponível (status ${String(error.status)}) — suba o apps/api com \`bun dev\``,
    )
  }
  return data
})

/**
 * Categorias L1 pro filtro. É auxiliar: se a API falhar, devolve [] (o select
 * fica vazio) em vez de derrubar a página inteira de vídeos.
 */
export const getVideoCategories = cache(async () => {
  const { data, error } = await api.v1.market.categories.get()
  if (error) return []
  return data
})
