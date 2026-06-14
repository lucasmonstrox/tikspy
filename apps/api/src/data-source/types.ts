import type { z } from "zod"

import type {
  marketCategoryDetailSchema,
  marketCategorySchema,
  marketCategoryStatsSchema,
  marketCreativeSchema,
  marketCreatorSchema,
  marketLiveSchema,
  marketProductSchema,
  marketSummarySchema,
  marketTrendPointSchema,
} from "./schemas"

export type MarketProduct = z.infer<typeof marketProductSchema>
export type MarketCreative = z.infer<typeof marketCreativeSchema>
export type MarketCreator = z.infer<typeof marketCreatorSchema>
export type MarketCategory = z.infer<typeof marketCategorySchema>
export type MarketCategoryStats = z.infer<typeof marketCategoryStatsSchema>
export type MarketCategoryDetail = z.infer<typeof marketCategoryDetailSchema>
export type MarketLive = z.infer<typeof marketLiveSchema>
export type MarketTrendPoint = z.infer<typeof marketTrendPointSchema>
export type MarketSummary = z.infer<typeof marketSummarySchema>

export type ListOptions = {
  limit?: number
}

export type TrendOptions = {
  days?: number
}

/** Ordenação do ranking de vídeos: por views (em alta) ou por GMV (mais vendas). */
export type VideoSort = "trending" | "top-selling"

/** Cadência do ranking de vídeos — mapeia pro rank_type do EchoTik. */
export type VideoPeriod = "day" | "week" | "month"

export type VideoListOptions = {
  sort?: VideoSort
  period?: VideoPeriod
  /** ID de categoria L1 (product_category_id); só faz sentido no ranking de vendas. */
  category?: string
  /** Filtra vídeos gerados por IA (true) ou humanos (false); ambos quando omitido. */
  ai?: boolean
  limit?: number
}

/**
 * Campo de ordenação do ranking de criadores. followers/videos/efficiency mapeiam
 * pro influencer_sort_field_v2 do EchoTik (server-side); gmv não tem campo de sort
 * na influencer/list → ordenado pós-fetch sobre a janela trazida.
 */
export type CreatorSort = "followers" | "videos" | "efficiency" | "gmv"

export type CreatorListOptions = {
  /** Nome do nicho/categoria (influencer_category_name). */
  niche?: string
  /** Faixa de seguidores (min/max_total_followers_cnt). */
  minFollowers?: number
  maxFollowers?: number
  /** Campo de ordenação; default followers. */
  sort?: CreatorSort
  /** Direção; default desc. */
  sortDir?: "asc" | "desc"
  limit?: number
}

/**
 * Contrato único de fonte de dados de mercado (infra.md §1: camada
 * substituível). Todo fornecedor (EchoTik, Apify, scraping próprio)
 * implementa esta interface; o produto nunca importa um adapter direto.
 */
export type MarketDataSource = {
  getMarketSummary(): Promise<MarketSummary>
  getTopProducts(options?: ListOptions): Promise<MarketProduct[]>
  getTrendingCreatives(options?: ListOptions): Promise<MarketCreative[]>
  getTopSellingCreatives(options?: ListOptions): Promise<MarketCreative[]>
  /** Criadores (influencer/list) com filtros server-side — base do /criadores. */
  getCreators(options?: CreatorListOptions): Promise<MarketCreator[]>
  /** Ranking de vídeos com filtros (sort/período/categoria/IA) — base do /videos. */
  getVideos(options?: VideoListOptions): Promise<MarketCreative[]>
  /** Categorias L1 pro filtro de vídeos (lista estática, cacheável). */
  getVideoCategories(): Promise<MarketCategory[]>
  /** Categorias L1 com métricas agregadas do ranking diário — lista de /categorias. */
  getMarketCategories(options?: ListOptions): Promise<MarketCategoryStats[]>
  /** Detalhe de uma categoria (métricas + produtos em alta) — /categorias/[slug]. */
  getMarketCategory(id: string): Promise<MarketCategoryDetail>
  /** Lives de venda recentes das lojas que mais venderam (seller/live/list). */
  getLives(options?: ListOptions): Promise<MarketLive[]>
  getMarketTrend(options?: TrendOptions): Promise<MarketTrendPoint[]>

}

export type SourceName = "echotik" | "mock"
