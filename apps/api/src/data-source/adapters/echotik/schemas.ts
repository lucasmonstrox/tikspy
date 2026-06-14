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
 * Superset do product/detail pro sheet de detalhe (campos que o ranking/top NÃO
 * consome): preço/comissão/avaliação, janelas de venda, e `skus` (JSON-em-string
 * com o preço REAL em BRL por variação). Zod ignora os demais campos do payload.
 */
export const productDetailFullSchema = z.object({
  product_id: z.coerce.string(),
  product_name: z.string().nullish(),
  category_id: z.string().nullish(),
  cover_url: z.string().nullish(),
  product_commission_rate: z.coerce.number().nullish(),
  product_rating: z.coerce.number().nullish(),
  review_count: z.coerce.number().nullish(),
  // yyyyMMdd (int) de quando a EchoTik viu o produto pela 1ª vez.
  first_crawl_dt: z.coerce.number().nullish(),
  total_sale_7d_cnt: z.coerce.number().default(0),
  total_sale_30d_cnt: z.coerce.number().default(0),
  total_sale_cnt: z.coerce.number().default(0),
  total_video_cnt: z.coerce.number().default(0),
  total_ifl_cnt: z.coerce.number().default(0),
  // Array JSON dentro de string: cada SKU tem real_price.sale_price_decimal (BRL).
  skus: z.string().nullish(),
})

export type ProductDetailFull = z.infer<typeof productDetailFullSchema>

/**
 * Item do GET /api/v3/echotik/product/list — biblioteca offline (T+1) de
 * produtos com filtros server-side ricos. Diferente do ranklist, já traz preço
 * (min/max top-level em BRL), comissão, rating, janelas 7d/30d, tendência,
 * frescor (first_crawl_dt) e contagens de criadores/vídeos numa só chamada —
 * não precisa do enrich via product/detail. Zod ignora as demais janelas.
 */
export const productListItemSchema = z.object({
  product_id: z.coerce.string(),
  product_name: z.string().nullish(),
  category_id: z.string().nullish(),
  // JSON-em-string `[{ url, index }]` — parseado no mapper (firstCoverUrl).
  cover_url: z.string().nullish(),
  min_price: z.coerce.number().nullish(),
  max_price: z.coerce.number().nullish(),
  spu_avg_price: z.coerce.number().nullish(),
  product_commission_rate: z.coerce.number().nullish(),
  product_rating: z.coerce.number().nullish(),
  review_count: z.coerce.number().nullish(),
  // yyyyMMdd (int) da 1ª captura — proxy de idade do produto na base.
  first_crawl_dt: z.coerce.number().nullish(),
  // Tendência de vendas dos últimos 7d: 0=estável, 1=subindo, 2=caindo.
  sales_trend_flag: z.coerce.number().default(0),
  total_sale_cnt: z.coerce.number().default(0),
  total_sale_1d_cnt: z.coerce.number().default(0),
  total_sale_7d_cnt: z.coerce.number().default(0),
  total_sale_30d_cnt: z.coerce.number().default(0),
  total_sale_gmv_30d_amt: z.coerce.number().default(0),
  total_video_cnt: z.coerce.number().default(0),
  total_ifl_cnt: z.coerce.number().default(0),
})

export type ProductListItem = z.infer<typeof productListItemSchema>

/**
 * Item do GET /api/v3/echotik/search/items com type=2 (busca de produto por
 * nome). Shape ENXUTO de propósito (a doc avisa: poucos campos — comissão,
 * rating, tendência e frescor NÃO vêm; pra isso, chamar a interface de detalhe).
 * Gotcha: `cover_url` vem MALFORMADO (não-JSON: `[{index=1, url=...}]`) — a URL
 * é extraída por regex no adapter, não por JSON.parse.
 */
export const searchProductItemSchema = z.object({
  product_id: z.coerce.string(),
  product_name: z.string().nullish(),
  cover_url: z.string().nullish(),
  category_id: z.string().nullish(),
  spu_avg_price: z.coerce.number().nullish(),
  total_sale_cnt: z.coerce.number().default(0),
  total_sale_7d_cnt: z.coerce.number().default(0),
  total_sale_gmv_amt: z.coerce.number().default(0),
  total_sale_gmv_7d_amt: z.coerce.number().default(0),
  total_ifl_cnt: z.coerce.number().default(0),
  total_video_cnt: z.coerce.number().default(0),
})

export type SearchProductItem = z.infer<typeof searchProductItemSchema>

/**
 * Item do GET /api/v3/echotik/product/influencer/list — criador que promove o
 * produto. Sem @handle público (só nick_name + user_id + avatar). `per_product
 * _ifl_sale_cnt` = vendas DESTE produto atribuídas ao criador (unidades).
 */
export const productInfluencerItemSchema = z.object({
  user_id: z.coerce.string(),
  nick_name: z.string().nullish(),
  avatar: z.string().nullish(),
  category: z.string().nullish(),
  total_followers_cnt: z.coerce.number().default(0),
  total_post_video_cnt: z.coerce.number().default(0),
  total_views_cnt: z.coerce.number().default(0),
  per_product_ifl_sale_cnt: z.coerce.number().default(0),
})

export type ProductInfluencerItem = z.infer<typeof productInfluencerItemSchema>

/**
 * Item do GET /api/v3/echotik/product/video/list — vídeo que promove o produto.
 * `video_id` embeda no player do TikTok. `reflow_cover` é echosell (assinar).
 * `hash_tag` vem como string "#a #b". Sem @handle (só user_id).
 */
export const productVideoItemSchema = z.object({
  video_id: z.coerce.string(),
  user_id: z.coerce.string().nullish(),
  video_desc: z.string().nullish(),
  hash_tag: z.string().nullish(),
  duration: z.coerce.number().nullish(),
  reflow_cover: z.string().nullish(),
  total_views_cnt: z.coerce.number().default(0),
  total_digg_cnt: z.coerce.number().default(0),
  total_comments_cnt: z.coerce.number().default(0),
  total_shares_cnt: z.coerce.number().default(0),
  total_favorites_cnt: z.coerce.number().default(0),
  total_video_sale_cnt: z.coerce.number().default(0),
})

export type ProductVideoItem = z.infer<typeof productVideoItemSchema>

/**
 * Recorte do GET /api/v3/echotik/influencer/detail (batch por `user_ids`, máx.
 * 10) só pra resolver o @handle: nem o product/video/list nem o product/
 * influencer/list trazem `unique_id`, só `user_id`. Daqui sai user_id → handle.
 */
export const influencerHandleItemSchema = z.object({
  user_id: z.coerce.string(),
  unique_id: z.string().nullish(),
  nick_name: z.string().nullish(),
})

export type InfluencerHandleItem = z.infer<typeof influencerHandleItemSchema>

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
