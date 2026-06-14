import { z } from "zod"

// Shapes crus da EchoTik v3 (apenas os campos que consumimos).
// Spec completa em docs/echotik/api/. Zod ignora campos extras do payload.

/** Item do GET /api/v3/echotik/product/ranklist (ranking por região/período) */
export const rankItemSchema = z.object({
  product_id: z.string(),
  product_name: z.string(),
  category_id: z.string().nullable(),
  total_sale_cnt: z.coerce.number().default(0),
  total_sale_gmv_amt: z.coerce.number().default(0),
  total_video_cnt: z.coerce.number().default(0),
})

export type RankItem = z.infer<typeof rankItemSchema>

/**
 * Item do GET /api/v3/echotik/product/detail — traz as janelas 1d/7d/30d e a
 * flag de tendência que o ranklist NÃO tem. `product_ids` aceita vários IDs
 * (vírgula), então 1 chamada enriquece o top-N inteiro do ranklist.
 */
export const productDetailItemSchema = z.object({
  product_id: z.coerce.string(),
  // String com JSON array `[{ "url", "index" }, ...]` — parseada no mapper.
  cover_url: z.string().nullish(),
  total_sale_1d_cnt: z.coerce.number().default(0),
  total_sale_7d_cnt: z.coerce.number().default(0),
  total_sale_30d_cnt: z.coerce.number().default(0),
  total_sale_gmv_30d_amt: z.coerce.number().default(0),
  sales_trend_flag: z.coerce.number().default(0),
  total_video_cnt: z.coerce.number().default(0),
})

export type ProductDetailItem = z.infer<typeof productDetailItemSchema>

/**
 * Item do GET /api/v3/echotik/video/ranklist — ranking de vídeos já ordenado
 * pelo servidor (video_rank_field=1 trending). Traz título (video_desc), GMV
 * e thumbnail reais, ao contrário do /api/v2/video/list antigo.
 */
export const videoItemSchema = z.object({
  video_id: z.coerce.string(),
  user_id: z.coerce.string(),
  unique_id: z.string().nullable(),
  nick_name: z.string().nullish(),
  video_desc: z.string().nullish(),
  reflow_cover: z.string().nullish(),
  total_views_cnt: z.coerce.number().default(0),
  // No ranking por vendas (field=2) os contadores do período vêm 0; o *_history tem o real.
  total_views_history_cnt: z.coerce.number().default(0),
  total_digg_cnt: z.coerce.number().default(0),
  total_digg_history_cnt: z.coerce.number().default(0),
  total_comments_cnt: z.coerce.number().default(0),
  total_comments_history_cnt: z.coerce.number().default(0),
  total_shares_cnt: z.coerce.number().default(0),
  total_shares_history_cnt: z.coerce.number().default(0),
  total_favorites_cnt: z.coerce.number().default(0),
  total_favorites_history_cnt: z.coerce.number().default(0),
  total_video_sale_cnt: z.coerce.number().default(0),
  total_video_sale_gmv_amt: z.coerce.number().default(0),
})

export type VideoItem = z.infer<typeof videoItemSchema>

/**
 * Item do GET /api/v3/echotik/category/l1 — categorias de 1º nível (estáticas,
 * T+1). Alimenta o filtro de categoria do /videos. Nomes vêm no idioma pedido
 * (a opendoc não oferece pt-BR; usamos en-US).
 */
export const categoryItemSchema = z.object({
  category_id: z.string(),
  category_name: z.string(),
})

export type CategoryItem = z.infer<typeof categoryItemSchema>

const liveCoverSchema = z.object({ url_list: z.array(z.string()).nullish() })

/**
 * Item do GET /api/v3/realtime/live/search — uma live do TikTok no ar agora.
 * Payload bruto e volátil: pegamos só o essencial e toleramos ausências. O host
 * (e título/capa da sala) vem em `author`; contadores de audiência NÃO vêm aqui
 * (só via live/detail). `products_count` aparece em algumas lives, não todas.
 */
export const liveSearchItemSchema = z.object({
  aweme_id: z.coerce.string().nullish(),
  products_count: z.coerce.number().nullish(),
  is_live_has_products: z.boolean().nullish(),
  author: z
    .object({
      uid: z.coerce.string().nullish(),
      unique_id: z.string().nullish(),
      nickname: z.string().nullish(),
      room_id_str: z.coerce.string().nullish(),
      room_title: z.string().nullish(),
      room_cover: liveCoverSchema.nullish(),
      cover_url: liveCoverSchema.nullish(),
    })
    .nullish(),
})

export type LiveSearchItem = z.infer<typeof liveSearchItemSchema>

/** Envelope da busca — echotikFetch já desembrulha p/ este `{ data: [...] }`. */
export const liveSearchEnvelopeSchema = z.object({
  data: z.array(z.object({ lives: liveSearchItemSchema.nullish() })).nullish(),
})

/** Trecho de live/detail que interessa: audiência atual da sala. */
export const liveDetailSchema = z.object({
  data: z
    .object({
      user_count: z.coerce.number().nullish(),
      total_user: z.coerce.number().nullish(),
    })
    .nullish(),
})

/**
 * Item do GET /api/v3/echotik/influencer/list — criador da biblioteca offline
 * (T+1). Consumimos só identidade, nicho, seguidores (+incrementos), vídeos,
 * produtos, GMV e ec_score. IDs vêm como string; contadores podem vir string →
 * coerce. Zod ignora os demais campos do payload.
 */
export const influencerListItemSchema = z.object({
  user_id: z.coerce.string(),
  unique_id: z.string().nullable(),
  nick_name: z.string().nullish(),
  avatar: z.string().nullish(),
  category: z.string().nullish(),
  ec_score: z.coerce.number().default(0),
  interaction_rate: z.coerce.number().default(0),
  total_followers_cnt: z.coerce.number().default(0),
  total_followers_1d_cnt: z.coerce.number().default(0),
  total_followers_7d_cnt: z.coerce.number().default(0),
  total_followers_30d_cnt: z.coerce.number().default(0),
  total_followers_90d_cnt: z.coerce.number().default(0),
  total_post_video_cnt: z.coerce.number().default(0),
  total_product_cnt: z.coerce.number().default(0),
  total_sale_gmv_amt: z.coerce.number().default(0),
  total_sale_gmv_30d_amt: z.coerce.number().default(0),
})

export type InfluencerListItem = z.infer<typeof influencerListItemSchema>
