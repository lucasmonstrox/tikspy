import { z } from "zod"

export const marketProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  /** URL da capa do produto (cover do EchoTik); null quando indisponível. */
  image: z.string().nullish(),
  sales24h: z.number().nonnegative(),
  salesTrend: z.array(z.number()),
  salesDelta24h: z.number().nullable(),
  score: z.number().min(0).max(100),
})

export const marketCreativeSchema = z.object({
  id: z.string(),
  title: z.string(),
  creatorHandle: z.string(),
  /** Capa do vídeo (assinada); null quando indisponível. */
  cover: z.string().nullish(),
  /** Link do vídeo no TikTok (abre em nova aba). */
  tiktokUrl: z.string().nullish(),
  views: z.number().nonnegative(),
  likes: z.number().nonnegative().nullish(),
  comments: z.number().nonnegative().nullish(),
  shares: z.number().nonnegative().nullish(),
  favorites: z.number().nonnegative().nullish(),
  estimatedGmv: z.number().nonnegative(),
})

/**
 * Criador (influencer) da biblioteca EchoTik — base da página /criadores.
 * Métricas estimadas; GMV em USD igual aos demais (conversão BRL é pendência
 * transversal). `efficiency` (0–100), `trend` e `up` são derivados no mapper.
 */
export const marketCreatorSchema = z.object({
  id: z.string(),
  /** @handle público do TikTok. */
  handle: z.string(),
  name: z.string(),
  /** Avatar (CDN EchoTik; pode expirar). Não usado na UI v1 (card usa iniciais). */
  avatar: z.string().nullish(),
  /** Nicho/categoria principal do criador. */
  niche: z.string(),
  followers: z.number().nonnegative(),
  /** Crescimento de seguidores em 30d; null sem incremento. */
  followersDelta30d: z.number().nullable(),
  /** Vídeos publicados (total). */
  videos: z.number().nonnegative(),
  /** Produtos promovidos (total). */
  products: z.number().nonnegative(),
  /** GMV estimado (USD — ver pendência de conversão p/ BRL). */
  estimatedGmv: z.number().nonnegative(),
  /** Eficiência de venda 0–100, derivada (ec_score / engajamento). */
  efficiency: z.number().min(0).max(100),
  /** Mini-série de crescimento pro sparkline (cronológica). */
  trend: z.array(z.number()),
  /** Tendência ascendente (último ponto ≥ primeiro). */
  up: z.boolean(),
})

/** Categoria L1 do catálogo (EchoTik /category/l1) — alimenta o filtro de vídeos. */
export const marketCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
})

/**
 * Categoria L1 com métricas agregadas do ranking diário — base dos cards de
 * /categorias. GMV/vendas/contagem somam os produtos da categoria presentes no
 * ranking (não o catálogo inteiro); `gmvDelta` compara com o dia anterior.
 */
export const marketCategoryStatsSchema = z.object({
  /** category_id L1 (também é o slug da rota /categorias/[slug]). */
  id: z.string(),
  /** Nome localizado pt-BR quando mapeado; senão o nome en-US do catálogo. */
  name: z.string(),
  /** GMV somado dos produtos da categoria no ranking diário (BRL). */
  gmv: z.number().nonnegative(),
  /** Vendas somadas dos produtos da categoria no ranking diário (unidades). */
  sales: z.number().nonnegative(),
  /** Nº de produtos da categoria no ranking (não é o catálogo todo). */
  productCount: z.number().nonnegative(),
  /** Variação do GMV vs. dia anterior; null sem base de comparação. */
  gmvDelta: z.number().nullable(),
  /** GMV dos produtos-líderes (asc) pro mini-gráfico do card. */
  gmvTrend: z.array(z.number()),
})

/** Detalhe de uma categoria: as métricas agregadas + os produtos em alta dela. */
export const marketCategoryDetailSchema = z.object({
  category: marketCategoryStatsSchema,
  products: z.array(marketProductSchema),
})

export const marketTrendPointSchema = z.object({
  date: z.iso.date(),
  estimatedGmv: z.number().nonnegative(),
  videosPublished: z.number().nonnegative(),
})

// Lives BR só existem em tempo-real na EchoTik (realtime/live/search) — a
// biblioteca offline não cobre lives do Brasil. Logo: sem GMV/duração (são
// métricas offline), só "ao vivo agora" + audiência atual via live/detail.
export const marketLiveSchema = z.object({
  /** room_id da live (string — int64 grande, nunca number). */
  id: z.string(),
  title: z.string(),
  /** Handle do host (@unique_id). */
  host: z.string(),
  /** Nome de exibição do host. */
  hostName: z.string().nullish(),
  /** Capa da live (CDN TikTok, URL assinada que expira); null se indisponível. */
  cover: z.string().nullish(),
  /** Espectadores no momento (live/detail.user_count); null se não enriquecido. */
  viewers: z.number().nonnegative().nullish(),
  /** Total que já entraram na live (live/detail.total_user); null se não enriquecido. */
  totalViewers: z.number().nonnegative().nullish(),
  /** Nº de produtos na vitrine da live; null quando a busca não informa. */
  productCount: z.number().nonnegative().nullish(),
  /** Live com vitrine de produtos ativa. */
  hasProducts: z.boolean(),
  /** Link p/ assistir a live no TikTok. */
  tiktokUrl: z.string().nullish(),
  region: z.string().nullish(),
})

const countDeltaSchema = z.object({
  count: z.number().nonnegative(),
  delta: z.number().nullable(),
})

export const marketSummarySchema = z.object({
  bestsellers: countDeltaSchema,
  trendingCreatives: countDeltaSchema,
  /** GMV somado do top 100 do ranking diário — não é o GMV do mercado inteiro */
  topGmv24h: z.object({
    amount: z.number().nonnegative(),
    deltaPct: z.number().nullable(),
  }),
})
