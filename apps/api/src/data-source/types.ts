import type { z } from "zod"

import type {
  marketCategoryDetailSchema,
  marketCategorySchema,
  marketCategoryStatsSchema,
  marketCreativeSchema,
  marketCreatorSchema,
  marketLiveSchema,
  marketProductCreatorSchema,
  marketProductDetailSchema,
  marketProductListItemSchema,
  marketProductSchema,
  marketProductVideoSchema,
  marketSummarySchema,
  marketTrendPointSchema,
} from "./schemas"

export type MarketProduct = z.infer<typeof marketProductSchema>
export type MarketProductListItem = z.infer<typeof marketProductListItemSchema>
export type MarketProductDetail = z.infer<typeof marketProductDetailSchema>
export type MarketProductCreator = z.infer<typeof marketProductCreatorSchema>
export type MarketProductVideo = z.infer<typeof marketProductVideoSchema>
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
 * Campo de ordenação da lista de produtos. sales/sales7d/sales30d/price mapeiam
 * pro product_sort_field do EchoTik (server-side); `score` é o nosso score
 * derivado, então ordena pós-fetch sobre a janela trazida.
 */
export type ProductSort = "sales" | "sales7d" | "sales30d" | "price" | "score"

/**
 * "Momento" do produto — preset de negócio sobre tendência + idade (NÃO é um
 * parâmetro do EchoTik; combinamos sales_trend_flag, first_crawl_dt e volume):
 * - `emergente`: explodiu rápido e do nada — produto novo (first_crawl recente)
 *   + subindo (sales_trend=1), ordenado pela velocidade de vendas 7d.
 * - `consolidado` ("em alta"): vendedor consistente já estabelecido (alto volume
 *   acumulado) + subindo — produto maduro que segue crescendo.
 * - `todos`: sem preset.
 */
export type ProductMomentum = "todos" | "emergente" | "consolidado"

/**
 * Filtros da lista de descoberta de produtos (/produtos). Mapeiam pra query do
 * EchoTik product/list (offline T+1, filtros server-side ricos). `query` (busca
 * por nome) NÃO existe no product/list → roteia pro search/items quando presente.
 */
export type ProductListOptions = {
  /** Busca por nome (search/items type=2); sem ela, usa product/list filtrado. */
  query?: string
  /** category_id L1 (category_id). */
  category?: string
  /** Faixa de preço médio do SKU em BRL (min/max_spu_avg_price). */
  minPrice?: number
  maxPrice?: number
  /** Comissão mínima do afiliado em fração 0–1 (min_product_commission_rate). */
  minCommission?: number
  /** Preset de tendência+idade; default todos. */
  momentum?: ProductMomentum
  /** Campo de ordenação; default sales30d. */
  sort?: ProductSort
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
  /** Descoberta de produtos com filtros server-side (product/list) — base do /produtos. */
  getProducts(options?: ProductListOptions): Promise<MarketProductListItem[]>
  /** Ficha completa de um produto (detalhe + criadores + vídeos) — sheet do dashboard. */
  getProductDetail(id: string): Promise<MarketProductDetail>
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
