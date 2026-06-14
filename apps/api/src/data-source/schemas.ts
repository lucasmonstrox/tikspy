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

/**
 * Item da lista de descoberta (/produtos) — superset do MarketProduct com os
 * campos que o product/list já entrega numa só chamada (preço/comissão/rating,
 * janelas 7d/30d, criadores/vídeos, frescor e tendência), sem precisar da
 * chamada extra de detalhe. Sem GMV em R$: a fonte só dá GMV em USD (pendência
 * de conversão) — ancoramos em vendas (unidades) + preço/comissão em BRL.
 */
export const marketProductListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  /** Capa do produto (assinada); null quando indisponível. */
  image: z.string().nullish(),
  /** Faixa de preço de venda em BRL (menor/maior SKU); null sem preço. */
  priceMin: z.number().nonnegative().nullable(),
  priceMax: z.number().nonnegative().nullable(),
  /** Comissão do afiliado em fração 0–1; null quando não informada. */
  commissionRate: z.number().min(0).max(1).nullable(),
  /** Avaliação média 0–5 e nº de avaliações; null quando sem reviews. */
  rating: z.number().min(0).max(5).nullable(),
  reviewCount: z.number().nonnegative().nullable(),
  /** Vendas por janela (unidades, incrementais do período) + acumulado total. */
  sales7d: z.number().nonnegative(),
  sales30d: z.number().nonnegative(),
  salesTotal: z.number().nonnegative(),
  /** Mini-série de RITMO diário (30d→7d→1d) pro sparkline. */
  salesTrend: z.array(z.number()),
  /** Variação do ritmo recente vs. semana; null sem base de comparação. */
  salesDelta: z.number().nullable(),
  /** Tendência de vendas 7d da EchoTik: subindo/estável/caindo. */
  trendFlag: z.enum(["up", "stable", "down"]),
  /** Nº de criadores e vídeos promovendo o produto. */
  creatorCount: z.number().nonnegative(),
  videoCount: z.number().nonnegative(),
  /** Data (yyyy-MM-dd) da 1ª captura pela EchoTik — proxy de idade/frescor. */
  firstSeen: z.string().nullish(),
  /** Score proprietário 0–100 (derivado sobre a janela trazida). */
  score: z.number().min(0).max(100),
})

/**
 * Criador que promove um produto (EchoTik product/influencer/list). O payload
 * NÃO traz o @handle público (só nome de exibição, avatar e user_id), então a
 * UI cai nas iniciais. `productSales` = vendas DESTE produto atribuídas ao
 * criador (unidades, não GMV — a fonte só dá GMV em USD).
 */
export const marketProductCreatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Avatar (CDN EchoTik, expira/403 direto). Não usado na UI v1 (iniciais). */
  avatar: z.string().nullish(),
  niche: z.string(),
  followers: z.number().nonnegative(),
  videos: z.number().nonnegative(),
  views: z.number().nonnegative(),
  productSales: z.number().nonnegative(),
})

/**
 * Vídeo que promove um produto (EchoTik product/video/list). `id` é o video_id
 * do TikTok (embeda no player). Métricas em unidades; sem GMV em BRL de
 * propósito (a fonte dá em USD — pendência de conversão).
 */
export const marketProductVideoSchema = z.object({
  id: z.string(),
  /** @handle do autor (unique_id, sem "@") resolvido via influencer/detail; null se desconhecido. */
  creatorHandle: z.string().nullish(),
  /** Capa assinada (echosell exige assinatura); null quando indisponível. */
  cover: z.string().nullish(),
  description: z.string(),
  hashtags: z.array(z.string()),
  durationSec: z.number().nonnegative().nullable(),
  views: z.number().nonnegative(),
  likes: z.number().nonnegative(),
  comments: z.number().nonnegative(),
  shares: z.number().nonnegative(),
  favorites: z.number().nonnegative(),
  productSales: z.number().nonnegative(),
})

/**
 * Ficha completa de um produto pro sheet de detalhe do dashboard. Combina o
 * product/detail (preço/comissão/avaliação REAIS em BRL, janelas de venda) com
 * as listas de criadores e vídeos que o promovem. Sem GMV em R$: a EchoTik só
 * dá GMV estimado em USD (pendência de conversão), então a ficha ancora em
 * UNIDADES + preço/comissão/avaliação, que vêm corretos em BRL.
 */
export const marketProductDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  /** Capa do produto (assinada); null quando indisponível. */
  image: z.string().nullish(),
  /** Faixa de preço de venda em BRL (menor/maior SKU); null sem SKU. */
  priceMin: z.number().nonnegative().nullable(),
  priceMax: z.number().nonnegative().nullable(),
  /** Comissão do afiliado em fração 0–1; null quando não informada. */
  commissionRate: z.number().min(0).max(1).nullable(),
  /** Avaliação média 0–5 e nº de avaliações; null quando sem reviews. */
  rating: z.number().min(0).max(5).nullable(),
  reviewCount: z.number().nonnegative().nullable(),
  /** Vendas por janela (unidades, incrementais do período). */
  sales7d: z.number().nonnegative(),
  sales30d: z.number().nonnegative(),
  /** Vendas acumuladas (histórico total). */
  salesTotal: z.number().nonnegative(),
  /** Nº total de vídeos e criadores promovendo o produto. */
  videoCount: z.number().nonnegative(),
  creatorCount: z.number().nonnegative(),
  /** Data (yyyy-MM-dd) em que a EchoTik viu o produto pela 1ª vez — frescor. */
  firstSeen: z.string().nullish(),
  creators: z.array(marketProductCreatorSchema),
  videos: z.array(marketProductVideoSchema),
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

const gmvDeltaSchema = z.object({
  amount: z.number().nonnegative(),
  deltaPct: z.number().nullable(),
})

export const marketSummarySchema = z.object({
  /** GMV somado dos top criativos do dia (ranking de vídeos por GMV) */
  creativesGmv24h: gmvDeltaSchema,
  trendingCreatives: countDeltaSchema,
  /** GMV somado do top 100 do ranking diário — não é o GMV do mercado inteiro */
  topGmv24h: gmvDeltaSchema,
})
