import { computeScores } from "../../score"
import type {
  MarketCreative,
  MarketCreator,
  MarketLive,
  MarketProduct,
} from "../../types"
import type {
  InfluencerListItem,
  LiveSearchItem,
  ProductDetailItem,
  RankItem,
  VideoItem,
} from "./schemas"

/** Audiência atual de uma live (live/detail); null quando não enriquecida. */
export type LiveAudience = { viewers: number | null; totalViewers: number | null }

/** `cover_url` vem como string JSON `[{ url, index }]` — pega a capa (index 0). */
export function firstCoverUrl(raw?: string | null): string | null {
  if (!raw) return null
  try {
    const list = JSON.parse(raw) as Array<{ url?: string; index?: number }>
    if (!Array.isArray(list) || list.length === 0) return null
    const primary = list.find((cover) => cover.index === 0) ?? list[0]
    return primary?.url ?? null
  } catch {
    return null
  }
}

/**
 * Combo: `current` = ranklist diário (o `total_sale_cnt` JÁ é as vendas do dia =
 * 24h, e a ordem é o ranking de 24h); `detailById` = janelas 1d/7d/30d do
 * /product/detail (o ranklist não as tem) pra montar Tendência e Variação.
 */
export function toMarketProducts(
  current: RankItem[],
  detailById: Map<string, ProductDetailItem>,
  // capa original (echosell) → URL assinada acessível (batch/cover/download).
  signedCoverByOriginal: Map<string, string>,
  // category_id L1 → nome localizado; sem o mapa, a categoria fica "—".
  categoryNameById?: Map<string, string>,
): MarketProduct[] {
  const signals = current.map((item) => {
    const detail = detailById.get(item.product_id)
    return {
      item,
      detail,
      // Demanda do score = 30d do detalhe (estável); fallback p/ vendas do dia.
      sales24h: detail?.total_sale_30d_cnt ?? item.total_sale_cnt,
      gmv24h: detail?.total_sale_gmv_30d_amt ?? item.total_sale_gmv_amt,
      videoCount: detail?.total_video_cnt ?? item.total_video_cnt,
    }
  })
  const scores = computeScores(signals)

  return signals.map((signal) => {
    const { item, detail } = signal
    const rawCover = firstCoverUrl(detail?.cover_url)
    const dailyAvg7d = (detail?.total_sale_7d_cnt ?? 0) / 7
    // Variação 24h: vendas do dia (ranklist) vs o ritmo diário da última semana.
    const delta = dailyAvg7d > 0 ? item.total_sale_cnt / dailyAvg7d - 1 : null
    return {
      id: item.product_id,
      name: item.product_name,
      // ranklist/detail só trazem category_id; resolve o nome quando o mapa do
      // catálogo é fornecido, senão "—".
      category:
        (item.category_id && categoryNameById?.get(item.category_id)) || "—",
      image: rawCover ? (signedCoverByOriginal.get(rawCover) ?? null) : null,
      // Vendas DO DIA (ranklist rank_type=1 = vendas das últimas 24h).
      sales24h: item.total_sale_cnt,
      // Mini-série de RITMO diário: média/dia em 30d → 7d → hoje.
      salesTrend: detail
        ? [
            Math.round(detail.total_sale_30d_cnt / 30),
            Math.round(detail.total_sale_7d_cnt / 7),
            item.total_sale_cnt,
          ]
        : [item.total_sale_cnt],
      salesDelta24h: delta,
      score: scores.get(signal) ?? 50,
    }
  })
}

/**
 * Eficiência de venda 0–100 do criador (REGRA DE NEGÓCIO — calibrar com dados
 * reais). v1: ec_score (rating EchoTik 0–10) reescalado p/ 0–100, com piso pela
 * taxa de interação (0–1 → 0–100). Sempre clampado em [0, 100].
 */
function deriveEfficiency(item: InfluencerListItem): number {
  const fromScore = item.ec_score * 10
  const fromEngagement = item.interaction_rate * 100
  const value = Math.max(fromScore, fromEngagement)
  return Math.round(Math.min(Math.max(value, 0), 100))
}

/**
 * Mini-série de crescimento pro sparkline: seguidores reconstruídos a partir dos
 * incrementos 90/30/7/1d (a influencer/list não dá série temporal). Ordem
 * cronológica (mais antigo → hoje); valores não-negativos.
 */
function deriveTrend(item: InfluencerListItem): number[] {
  const now = item.total_followers_cnt
  const at = (delta: number) => Math.max(now - delta, 0)
  return [
    at(item.total_followers_90d_cnt),
    at(item.total_followers_30d_cnt),
    at(item.total_followers_7d_cnt),
    at(item.total_followers_1d_cnt),
    now,
  ]
}

/**
 * influencer/list → MarketCreator[]. Descarta criadores sem handle. GMV fica em
 * USD igual a produtos/vídeos (conversão BRL é pendência transversal). Avatar é
 * carregado mas não assinado — a UI v1 usa iniciais.
 */
export function toMarketCreators(items: InfluencerListItem[]): MarketCreator[] {
  return items
    .filter((item) => item.unique_id)
    .map((item) => {
      const trend = deriveTrend(item)
      return {
        id: item.user_id,
        handle: `@${item.unique_id}`,
        name: item.nick_name?.trim() || `@${item.unique_id}`,
        avatar: item.avatar || null,
        niche: item.category?.trim() || "—",
        followers: item.total_followers_cnt,
        followersDelta30d: item.total_followers_30d_cnt || null,
        videos: item.total_post_video_cnt,
        products: item.total_product_cnt,
        // 30d quando houver; senão o acumulado. Ambos estimados, em USD.
        estimatedGmv: item.total_sale_gmv_30d_amt || item.total_sale_gmv_amt,
        efficiency: deriveEfficiency(item),
        trend,
        up: trend[trend.length - 1]! >= trend[0]!,
      }
    })
}

export function toMarketCreatives(
  videos: VideoItem[],
  signedCoverByOriginal: Map<string, string>,
): MarketCreative[] {
  // video/ranklist já vem ordenado pelo servidor (trending) — não reordenamos.
  return videos
    .filter((video) => video.unique_id)
    .map((video) => ({
      id: video.video_id,
      title: video.video_desc?.trim() || `Vídeo de @${video.unique_id}`,
      creatorHandle: `@${video.unique_id}`,
      cover: video.reflow_cover
        ? (signedCoverByOriginal.get(video.reflow_cover) ?? null)
        : null,
      tiktokUrl: `https://www.tiktok.com/@${video.unique_id}/video/${video.video_id}`,
      // No ranking por vendas os contadores do período vêm 0 → caem no histórico.
      views: video.total_views_cnt || video.total_views_history_cnt,
      likes: video.total_digg_cnt || video.total_digg_history_cnt,
      comments: video.total_comments_cnt || video.total_comments_history_cnt,
      shares: video.total_shares_cnt || video.total_shares_history_cnt,
      favorites: video.total_favorites_cnt || video.total_favorites_history_cnt,
      estimatedGmv: video.total_video_sale_gmv_amt,
    }))
}

/**
 * Lives ao vivo (realtime/live/search) já deduplicadas, com a audiência atual
 * (live/detail) injetada por room_id quando disponível. A capa vem do CDN do
 * TikTok (acessível direto — não é echosell, não precisa assinar). Descarta
 * lives sem room_id ou sem handle do host.
 */
export function toMarketLives(
  items: LiveSearchItem[],
  audienceByRoom: Map<string, LiveAudience>,
): MarketLive[] {
  return items
    .map((item): MarketLive | null => {
      const author = item.author
      const id = author?.room_id_str ?? item.aweme_id ?? null
      const handle = author?.unique_id ?? null
      if (!id || !handle) return null

      const cover =
        author?.room_cover?.url_list?.[0] ??
        author?.cover_url?.url_list?.[0] ??
        null
      const audience = audienceByRoom.get(id)
      const productCount = item.products_count ?? null

      return {
        id,
        title: author?.room_title?.trim() || `Live de @${handle}`,
        host: `@${handle}`,
        hostName: author?.nickname?.trim() || null,
        cover,
        viewers: audience?.viewers ?? null,
        totalViewers: audience?.totalViewers ?? null,
        productCount,
        hasProducts: Boolean(item.is_live_has_products || (productCount ?? 0) > 0),
        tiktokUrl: `https://www.tiktok.com/@${handle}/live`,
        region: "BR",
      }
    })
    .filter((live): live is MarketLive => live !== null)
}
