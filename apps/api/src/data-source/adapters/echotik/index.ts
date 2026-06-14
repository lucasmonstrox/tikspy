import {
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns"

import {
  CATEGORY_DETAIL_PAGES,
  CATEGORY_DETAIL_PRODUCTS,
  CATEGORY_LANGUAGE,
  CATEGORY_RANK_PAGES,
  CONSOLIDADO_MIN_TOTAL_SALES,
  EMERGENTE_MAX_AGE_DAYS,
  INFLUENCER_PAGES,
  INFLUENCER_PAGE_SIZE,
  LIVE_ENRICH_LIMIT,
  LIVE_KEYWORDS,
  PRODUCT_DETAIL_CREATORS,
  PRODUCT_DETAIL_VIDEOS,
  PRODUCT_LIST_PAGES,
  PRODUCT_LIST_PAGE_SIZE,
  PRODUCT_SEARCH_SIZE,
  RANK_PAGES,
  RANK_PAGE_SIZE,
  REGION,
  VIDEO_PAGES,
  VIDEO_PAGE_SIZE,
  VIRAL_MIN_VIEWS_24H,
} from "../../consts"
import type {
  CreatorListOptions,
  CreatorSort,
  ListOptions,
  MarketCategory,
  MarketCategoryDetail,
  MarketCategoryStats,
  MarketCreative,
  MarketCreator,
  MarketDataSource,
  MarketLive,
  MarketProductDetail,
  MarketProductListItem,
  ProductListOptions,
  ProductSort,
  VideoListOptions,
  VideoPeriod,
  VideoSort,
} from "../../types"
import {
  aggregateCategories,
  buildCategoryStats,
  localizeCategory,
} from "./categories"
import { EchotikApiError, echotikFetch } from "./client"
import {
  firstCoverUrl,
  type LiveAudience,
  toMarketCreatives,
  toMarketCreators,
  toMarketLives,
  toMarketProductListItems,
  toMarketProducts,
  toProductCreators,
  toProductDetail,
  toProductVideos,
} from "./mappers"
import {
  categoryItemSchema,
  influencerHandleItemSchema,
  influencerListItemSchema,
  liveDetailSchema,
  liveSearchEnvelopeSchema,
  productDetailFullSchema,
  productDetailItemSchema,
  productInfluencerItemSchema,
  productListItemSchema,
  productVideoItemSchema,
  rankItemSchema,
  searchProductItemSchema,
  videoItemSchema,
} from "./schemas"
import type {
  InfluencerListItem,
  LiveSearchItem,
  ProductDetailItem,
  ProductListItem,
  SearchProductItem,
  ProductVideoItem,
  RankItem,
  VideoItem,
} from "./schemas"

export { EchotikApiError, isEchotikConfigured } from "./client"

function toRankDate(daysAgo: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - daysAgo)
  return date.toISOString().slice(0, 10)
}

/** Dia imediatamente anterior a uma data `yyyy-MM-dd`. */
function previousDay(date: string): string {
  return format(subDays(parseISO(date), 1), "yyyy-MM-dd")
}

async function fetchRankPage(
  date: string,
  page: number,
  categoryId?: string,
): Promise<RankItem[]> {
  const query: Record<string, string | number> = {
    region: REGION,
    page_num: page,
    page_size: RANK_PAGE_SIZE,
    product_rank_field: 1,
    rank_type: 1,
    date,
  }
  // category_id filtra o ranklist por categoria L1 (usado no detalhe de /categorias).
  if (categoryId) query.category_id = categoryId
  const data = await echotikFetch("/echotik/product/ranklist", query)
  return rankItemSchema.array().parse(data ?? [])
}

/**
 * Ranking diário de produtos por vendas de UMA data específica (sem recuo),
 * paginado (trial limita page_size a 10). Vazio = ranking ainda não publicado.
 * `categoryId` filtra por categoria L1; `pages` controla a profundidade.
 */
async function fetchRankForDate(
  date: string,
  pages = RANK_PAGES,
  categoryId?: string,
): Promise<RankItem[]> {
  const results = await Promise.all(
    Array.from({ length: pages }, (_, index) =>
      fetchRankPage(date, index + 1, categoryId),
    ),
  )
  return results.flat()
}

/**
 * Ranking diário de produtos por vendas (product_rank_field=1, rank_type=1).
 * O ranking é offline T+1, então o de "ontem" pode ainda não existir — recua
 * até 3 dias e devolve o primeiro dia com dados (a "âncora") junto da sua data.
 */
async function fetchDailyRank(
  daysAgo: number,
  pages = RANK_PAGES,
  categoryId?: string,
): Promise<{
  date: string
  items: RankItem[]
}> {
  for (let attempt = daysAgo; attempt <= daysAgo + 2; attempt++) {
    const date = toRankDate(attempt)
    const items = await fetchRankForDate(date, pages, categoryId)
    if (items.length > 0) return { date, items }
  }
  return { date: toRankDate(daysAgo), items: [] }
}

// Sort da UI → video_rank_field do EchoTik (1 = views/em alta, 2 = vendas/GMV).
const VIDEO_RANK_FIELD: Record<VideoSort, number> = {
  trending: 1,
  "top-selling": 2,
}

// Período da UI → rank_type do EchoTik (1 = dia, 2 = semana, 3 = mês).
const VIDEO_RANK_TYPE: Record<VideoPeriod, number> = {
  day: 1,
  week: 2,
  month: 3,
}

/**
 * Datas-candidatas do ranking de vídeos (mais recente primeiro). O ranking é
 * offline T+1, então a mais recente pode ainda não existir — geramos 3 recuos.
 * A cadência exige data alinhada: semana = segunda-feira; mês = dia 1.
 */
function videoRankDates(period: VideoPeriod): string[] {
  const today = new Date()
  const fmt = (date: Date) => format(date, "yyyy-MM-dd")
  if (period === "week") {
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    return [0, 1, 2].map((n) => fmt(subWeeks(monday, n)))
  }
  if (period === "month") {
    const first = startOfMonth(today)
    return [0, 1, 2].map((n) => fmt(subMonths(first, n)))
  }
  // dia: ontem e recuo de até 2 dias (mantém o comportamento T+1 anterior).
  return [1, 2, 3].map((n) => fmt(subDays(today, n)))
}

type VideoRankParams = {
  rankField: number
  rankType: number
  category?: string
  ai?: boolean
}

async function fetchVideoRankPage(
  date: string,
  page: number,
  params: VideoRankParams,
): Promise<VideoItem[]> {
  const query: Record<string, string | number> = {
    region: REGION,
    page_num: page,
    page_size: VIDEO_PAGE_SIZE,
    video_rank_field: params.rankField,
    rank_type: params.rankType,
    date,
  }
  // product_category_id só faz sentido no ranking de vendas (doc EchoTik).
  if (params.category) query.product_category_id = params.category
  if (params.ai !== undefined) query.created_by_ai = String(params.ai)
  const data = await echotikFetch("/echotik/video/ranklist", query)
  return videoItemSchema.array().parse(data ?? [])
}

/** Ranking de vídeos de UMA data específica (sem recuo), paginado (10/pág). */
async function fetchVideoRankForDate(
  date: string,
  params: VideoRankParams,
): Promise<VideoItem[]> {
  const pages = await Promise.all(
    Array.from({ length: VIDEO_PAGES }, (_, index) =>
      fetchVideoRankPage(date, index + 1, params),
    ),
  )
  return pages.flat()
}

/**
 * Ranking de vídeos já ordenado pelo servidor, paginado (trial limita a 10/pág).
 * Percorre as datas-candidatas e devolve a primeira com dados (cadência T+1),
 * junto da data que resolveu — necessária para ancorar o delta vs. ontem.
 */
async function fetchVideoRankWithDate(
  period: VideoPeriod,
  params: VideoRankParams,
): Promise<{ date: string; items: VideoItem[] }> {
  const dates = videoRankDates(period)
  for (const date of dates) {
    const items = await fetchVideoRankForDate(date, params)
    if (items.length > 0) return { date, items }
  }
  return { date: dates[0]!, items: [] }
}

/** Só os itens do ranking de vídeos (descarta a data que resolveu). */
async function fetchVideoRank(
  period: VideoPeriod,
  params: VideoRankParams,
): Promise<VideoItem[]> {
  return (await fetchVideoRankWithDate(period, params)).items
}

/**
 * Detalhe (janelas 1d/7d/30d + flag de tendência) de vários produtos — `product
 * _ids` aceita IDs por vírgula, mas no MÁXIMO 10 por chamada (a API rejeita
 * acima disso). Fatia em blocos de 10 e funde os mapas. Enriquece o top-N do
 * ranklist, que não tem essas janelas.
 */
async function fetchProductDetails(
  ids: string[],
): Promise<Map<string, ProductDetailItem>> {
  const result = new Map<string, ProductDetailItem>()
  for (let start = 0; start < ids.length; start += 10) {
    const data = await echotikFetch("/echotik/product/detail", {
      product_ids: ids.slice(start, start + 10).join(","),
    })
    for (const item of productDetailItemSchema.array().parse(data ?? [])) {
      result.set(item.product_id, item)
    }
  }
  return result
}

/**
 * As URLs de capa do EchoTik (host echosell-images...) dão 403 direto — exigem
 * assinatura. Este endpoint troca até 10 capas por URLs assinadas (válidas ~3
 * dias) e, segundo a doc, NÃO consome cota. Retorna mapa original → assinada.
 */
async function signCoverUrls(urls: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  // batch aceita no máx. 10 por chamada → fatia em blocos de 10.
  for (let start = 0; start < urls.length; start += 10) {
    const data = await echotikFetch("/echotik/batch/cover/download", {
      cover_urls: urls.slice(start, start + 10).join(","),
    })
    for (const entry of (data ?? []) as Array<Record<string, string>>) {
      for (const [original, signed] of Object.entries(entry)) {
        result.set(original, signed)
      }
    }
  }
  return result
}

/**
 * Ranking de vídeos com filtros → MarketCreative[] com capa assinada. Base do
 * /videos e das cards de criativos do dashboard (que passam só o `sort`).
 */
async function getVideos(options?: VideoListOptions): Promise<MarketCreative[]> {
  const sort = options?.sort ?? "trending"
  const period = options?.period ?? "day"
  const limit = options?.limit ?? 10
  const videos = (
    await fetchVideoRank(period, {
      rankField: VIDEO_RANK_FIELD[sort],
      rankType: VIDEO_RANK_TYPE[period],
      category: options?.category,
      ai: options?.ai,
    })
  ).slice(0, limit)
  const covers = await signCoverUrls(
    videos
      .map((video) => video.reflow_cover)
      .filter((url): url is string => Boolean(url)),
  )
  return toMarketCreatives(videos, covers)
}

/**
 * Catálogo L1 (estático, T+1) com nomes localizados pt-BR (overlay sobre o
 * en-US da EchoTik). Base do filtro de vídeos e do nome das categorias em
 * /categorias. Cacheado por URL no client — barato rebater.
 */
async function fetchCategoryCatalog(): Promise<MarketCategory[]> {
  const data = await echotikFetch("/echotik/category/l1", {
    language: CATEGORY_LANGUAGE,
  })
  const items = categoryItemSchema.array().parse(data ?? [])
  return items.map((item) => ({
    id: item.category_id,
    name: localizeCategory(item.category_id, item.category_name),
  }))
}

/** Mapa category_id → nome localizado, pra resolver nomes na agregação/detalhe. */
async function fetchCategoryNameMap(): Promise<Map<string, string>> {
  const catalog = await fetchCategoryCatalog()
  return new Map(catalog.map((category) => [category.id, category.name]))
}

/**
 * Lista de /categorias: agrega o ranking diário GLOBAL por categoria e resolve
 * os nomes pelo catálogo. Varre fundo (CATEGORY_RANK_PAGES) pra cobrir várias
 * categorias; as páginas 1-2 reusam o cache do dashboard.
 *
 * Sem delta aqui de propósito: a composição do top global oscila muito de um dia
 * pro outro (uma categoria pode ter 9 produtos no top hoje e 1 ontem), então o
 * GMV/categoria vs. ontem daria variações absurdas. O delta confiável fica no
 * DETALHE, que compara o ranking JÁ filtrado pela categoria (base estável).
 */
async function getMarketCategories(
  options?: ListOptions,
): Promise<MarketCategoryStats[]> {
  const limit = options?.limit ?? 12
  const [nameById, today] = await Promise.all([
    fetchCategoryNameMap(),
    fetchDailyRank(1, CATEGORY_RANK_PAGES),
  ])
  return aggregateCategories(today.items, [], nameById, limit)
}

/**
 * Detalhe de /categorias/[id]: ranking JÁ filtrado pela categoria (hoje + ontem
 * pro delta) → métricas agregadas + produtos em alta enriquecidos (janelas,
 * capas, score). 404 quando o id não está no catálogo L1.
 */
async function getMarketCategory(id: string): Promise<MarketCategoryDetail> {
  const nameById = await fetchCategoryNameMap()
  if (!nameById.has(id)) {
    throw new EchotikApiError(404, "/echotik/category/l1", `categoria ${id} inexistente`)
  }
  const name = nameById.get(id)!

  const today = await fetchDailyRank(1, CATEGORY_DETAIL_PAGES, id)
  const yesterday = today.items.length
    ? await fetchRankForDate(previousDay(today.date), CATEGORY_DETAIL_PAGES, id)
    : []
  const category = buildCategoryStats(id, name, today.items, yesterday)

  // Enriquece só o topo (limita detail + assinatura de capas).
  const top = today.items.slice(0, CATEGORY_DETAIL_PRODUCTS)
  const details = await fetchProductDetails(top.map((item) => item.product_id))
  const covers = await signCoverUrls(
    top
      .map((item) => firstCoverUrl(details.get(item.product_id)?.cover_url))
      .filter((url): url is string => Boolean(url)),
  )
  const products = toMarketProducts(top, details, covers, nameById)
  return { category, products }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Endpoints realtime topam risk control intermitente (a doc manda: code≠0 →
 * retry). echotikFetch já cobre o 429; aqui re-tentamos o erro de risk control
 * com backoff curto, pra a página não piscar vazia por um tropeço da gateway.
 * Roda em modo `parallel` (sem a fila/gap): lives disparam buscas e detalhes
 * juntos — em série seria ~13s.
 */
async function realtimeFetch(
  path: string,
  params: Record<string, string | number>,
  retries = 3,
): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await echotikFetch(path, params, { parallel: true })
    } catch (error) {
      if (attempt >= retries) throw error
      await sleep(400 * (attempt + 1))
    }
  }
}

/** Uma busca de lives ao vivo por palavra-chave (realtime). */
async function fetchLiveSearch(keyword: string): Promise<LiveSearchItem[]> {
  const data = await realtimeFetch("/realtime/live/search", {
    keyword,
    region: REGION,
    offset: 0,
  })
  const parsed = liveSearchEnvelopeSchema.parse(data ?? {})
  return (parsed.data ?? [])
    .map((entry) => entry.lives)
    .filter((live): live is LiveSearchItem => Boolean(live))
}

/** Audiência atual de uma live (live/detail) — exige a live no ar. 1 retry só. */
async function fetchLiveAudience(
  roomId: string,
  userId: string,
): Promise<LiveAudience> {
  const data = await realtimeFetch(
    "/realtime/live/detail",
    { room_id: roomId, user_id: userId },
    1,
  )
  const parsed = liveDetailSchema.parse(data ?? {})
  return {
    viewers: parsed.data?.user_count ?? null,
    totalViewers: parsed.data?.total_user ?? null,
  }
}

/** room_id (string) de uma live, pra deduplicar e enriquecer. */
function liveRoomId(item: LiveSearchItem): string | null {
  return item.author?.room_id_str ?? item.aweme_id ?? null
}

/** Live com vitrine de produto ativa — prioriza lives de venda na ordenação. */
function hasShowcase(item: LiveSearchItem): boolean {
  return Boolean(item.is_live_has_products || (item.products_count ?? 0) > 0)
}

/**
 * Lives BR ao vivo AGORA. A EchoTik não tem lives BR na biblioteca offline — só
 * em tempo-real, por palavra-chave. Buscamos por termos de intenção de compra
 * (LIVE_KEYWORDS), deduplicamos por room_id, priorizamos quem tem vitrine de
 * produto e enriquecemos o topo com a audiência atual (live/detail). Cada chamada
 * é best-effort: risk control (code≠0) ou live encerrada só descarta aquele item,
 * nunca derruba a página. Sem GMV/duração — não existem em tempo-real.
 */
async function getLives(options?: ListOptions): Promise<MarketLive[]> {
  const limit = options?.limit ?? 12

  // Busca em paralelo; uma keyword que falhe (risk control) vira [].
  const batches = await Promise.all(
    LIVE_KEYWORDS.map((keyword) =>
      fetchLiveSearch(keyword).catch(() => [] as LiveSearchItem[]),
    ),
  )

  // Dedup por room_id, preservando a 1ª ocorrência (só lives com host).
  const byRoom = new Map<string, LiveSearchItem>()
  for (const item of batches.flat()) {
    const id = liveRoomId(item)
    if (id && item.author?.unique_id && !byRoom.has(id)) byRoom.set(id, item)
  }

  // Lives de venda (com vitrine) primeiro; corta no limite.
  const top = [...byRoom.values()]
    .sort((a, b) => Number(hasShowcase(b)) - Number(hasShowcase(a)))
    .slice(0, limit)

  // Enriquece o topo com a audiência atual, EM PARALELO (modo parallel do client):
  // as live/detail disparam juntas, não em série. Best-effort — falha de uma live
  // (encerrou / risk control) só deixa aquela sem viewers, não derruba a página.
  const audienceByRoom = new Map<string, LiveAudience>()
  await Promise.all(
    top.slice(0, LIVE_ENRICH_LIMIT).map(async (item) => {
      const id = liveRoomId(item)
      const userId = item.author?.uid
      if (!id || !userId) return
      const audience = await fetchLiveAudience(id, userId).catch(() => null)
      if (audience) audienceByRoom.set(id, audience)
    }),
  )

  return toMarketLives(top, audienceByRoom)
}

// Sort da UI → influencer_sort_field_v2 (1=seguidores, 3=vídeos publicados,
// 5=taxa de interação). "gmv" não tem campo de sort na list → ordenado pós-fetch.
const INFLUENCER_SORT_FIELD: Record<Exclude<CreatorSort, "gmv">, number> = {
  followers: 1,
  videos: 3,
  efficiency: 5,
}

/** Uma página da influencer/list com os filtros (server-side) já aplicados. */
async function fetchInfluencerPage(
  page: number,
  options: CreatorListOptions,
): Promise<InfluencerListItem[]> {
  const sort = options.sort ?? "followers"
  const query: Record<string, string | number> = {
    region: REGION,
    page_num: page,
    page_size: INFLUENCER_PAGE_SIZE,
    sort_type: options.sortDir === "asc" ? 0 : 1,
  }
  // gmv ordena pós-fetch (a list não tem esse campo de sort); os demais no servidor.
  if (sort !== "gmv") query.influencer_sort_field_v2 = INFLUENCER_SORT_FIELD[sort]
  if (options.niche) query.influencer_category_name = options.niche
  if (options.minFollowers !== undefined)
    query.min_total_followers_cnt = options.minFollowers
  if (options.maxFollowers !== undefined)
    query.max_total_followers_cnt = options.maxFollowers
  const data = await echotikFetch("/echotik/influencer/list", query)
  return influencerListItemSchema.array().parse(data ?? [])
}

/**
 * Criadores BR via influencer/list (offline T+1, filtros server-side ricos).
 * page_size travado em 10 → pagina INFLUENCER_PAGES. Ordenação por seguidores/
 * vídeos/eficiência é do servidor; gmv não tem campo de sort, então é ordenado
 * pós-fetch sobre a janela trazida (limitação documentada — ranking real de GMV
 * exigiria influencer/ranklist).
 */
async function getCreators(
  options?: CreatorListOptions,
): Promise<MarketCreator[]> {
  const opts = options ?? {}
  const limit = opts.limit ?? 12
  const pages = await Promise.all(
    Array.from({ length: INFLUENCER_PAGES }, (_, index) =>
      fetchInfluencerPage(index + 1, opts),
    ),
  )
  let creators = toMarketCreators(pages.flat())
  if ((opts.sort ?? "followers") === "gmv") {
    const dir = opts.sortDir === "asc" ? 1 : -1
    creators = [...creators].sort(
      (a, b) => (a.estimatedGmv - b.estimatedGmv) * dir,
    )
  }
  return creators.slice(0, limit)
}

/**
 * Resolve user_id → @handle (unique_id) dos autores dos vídeos do produto via
 * influencer/detail (batch, máx. 10). O product/video/list só traz user_id.
 * Best-effort: erro ou autor fora da base → vídeo fica sem handle (sem quebrar).
 */
async function fetchVideoHandles(
  videos: ProductVideoItem[],
): Promise<Map<string, string>> {
  const ids = [
    ...new Set(
      videos
        .map((video) => video.user_id)
        .filter((userId): userId is string => Boolean(userId)),
    ),
  ].slice(0, 10)
  if (ids.length === 0) return new Map()
  try {
    const data = await echotikFetch("/echotik/influencer/detail", {
      user_ids: ids.join(","),
    })
    return new Map(
      influencerHandleItemSchema
        .array()
        .parse(data ?? [])
        .filter((item) => item.unique_id)
        .map((item) => [item.user_id, item.unique_id!]),
    )
  } catch {
    return new Map()
  }
}

// Sort da UI → product_sort_field do product/list (1=vendas totais, 3=preço,
// 4=vendas 7d, 5=vendas 30d). "score" é derivado → ordena pós-fetch.
const PRODUCT_SORT_FIELD: Record<Exclude<ProductSort, "score">, number> = {
  sales: 1,
  sales7d: 4,
  sales30d: 5,
  price: 3,
}

/** yyyyMMdd (int) de N dias atrás — alimenta min_first_crawl_dt (frescor). */
function crawlDateNDaysAgo(days: number): number {
  return Number(format(subDays(new Date(), days), "yyyyMMdd"))
}

/** Uma página do product/list com filtros + preset de momento já aplicados. */
async function fetchProductListPage(
  page: number,
  options: ProductListOptions,
): Promise<ProductListItem[]> {
  const sort = options.sort ?? "sales30d"
  const query: Record<string, string | number> = {
    region: REGION,
    page_num: page,
    page_size: PRODUCT_LIST_PAGE_SIZE,
    off_mark: 0, // exclui produtos descontinuados
    sort_type: options.sortDir === "asc" ? 0 : 1,
    // score não tem campo server-side → ranqueia por 30d e reordena pós-fetch.
    product_sort_field:
      sort === "score" ? PRODUCT_SORT_FIELD.sales30d : PRODUCT_SORT_FIELD[sort],
  }
  if (options.category) query.category_id = options.category
  if (options.minPrice !== undefined) query.min_spu_avg_price = options.minPrice
  if (options.maxPrice !== undefined) query.max_spu_avg_price = options.maxPrice
  if (options.minCommission !== undefined)
    query.min_product_commission_rate = options.minCommission

  // Presets de "momento" (tendência + idade/volume). Ambos exigem alta (flag=1).
  const momentum = options.momentum ?? "todos"
  if (momentum === "emergente") {
    query.sales_trend_flag = 1 // subindo
    query.min_first_crawl_dt = crawlDateNDaysAgo(EMERGENTE_MAX_AGE_DAYS) // novo
  } else if (momentum === "consolidado") {
    query.sales_trend_flag = 1 // subindo
    query.min_total_sale_cnt = CONSOLIDADO_MIN_TOTAL_SALES // estabelecido
  }

  const data = await echotikFetch("/echotik/product/list", query)
  return productListItemSchema.array().parse(data ?? [])
}

// Sort da UI → sortType do search/items (só válido em type=2). 0=relevância,
// 1=preço, 2=vendas 7d (default), 4=vendas totais. Sem 30d e sem direção → o
// score reordena pós-fetch e o resto aceita a ordem do servidor.
const SEARCH_SORT_TYPE: Record<ProductSort, number> = {
  price: 1,
  sales: 4,
  sales7d: 2,
  sales30d: 2,
  score: 2,
}

/**
 * cover_url do search/items vem MALFORMADO (não-JSON: `[{index=1, url=https://
 * ...}]`). Extrai a 1ª URL por regex e a re-embrulha como JSON pra reusar o
 * firstCoverUrl/assinatura de capas do fluxo normal.
 */
function searchCoverUrl(raw?: string | null): string | null {
  if (!raw) return null
  const match = raw.match(/url=([^,}\]]+)/)
  return match ? match[1]!.trim() : null
}

/**
 * Item da busca → shape do product/list (sintético), pra reusar o mapper. Os
 * campos que a busca NÃO traz (comissão, rating, frescor, tendência, janela 30d)
 * viram null/0; 30d cai no 7d como proxy. Honesto: a busca é "achar por nome",
 * com card mais magro (a doc manda chamar o detalhe pra ficha completa).
 */
function searchToListItem(item: SearchProductItem): ProductListItem {
  const cover = searchCoverUrl(item.cover_url)
  return {
    product_id: item.product_id,
    product_name: item.product_name,
    category_id: item.category_id,
    cover_url: cover ? JSON.stringify([{ url: cover, index: 0 }]) : null,
    min_price: item.spu_avg_price,
    max_price: item.spu_avg_price,
    spu_avg_price: item.spu_avg_price,
    product_commission_rate: null,
    product_rating: null,
    review_count: null,
    first_crawl_dt: null,
    sales_trend_flag: 0,
    total_sale_cnt: item.total_sale_cnt,
    total_sale_1d_cnt: 0,
    total_sale_7d_cnt: item.total_sale_7d_cnt,
    total_sale_30d_cnt: item.total_sale_7d_cnt,
    total_sale_gmv_30d_amt: item.total_sale_gmv_7d_amt,
    total_video_cnt: item.total_video_cnt,
    total_ifl_cnt: item.total_ifl_cnt,
  }
}

/**
 * Busca de produto por nome via search/items (type=2). Teto de 30, sem
 * paginação. Os demais filtros não existem nesse endpoint: a categoria é
 * pós-filtrada (a busca devolve category_id); comissão/momento não se aplicam.
 */
async function searchProducts(
  options: ProductListOptions,
): Promise<MarketProductListItem[]> {
  const limit = options.limit ?? 24
  const sort = options.sort ?? "sales30d"
  const [data, nameById] = await Promise.all([
    echotikFetch("/echotik/search/items", {
      sk: options.query!,
      region: REGION,
      type: 2,
      size: PRODUCT_SEARCH_SIZE,
      searchType: 0,
      sortType: SEARCH_SORT_TYPE[sort],
    }),
    fetchCategoryNameMap(),
  ])
  let items = searchProductItemSchema.array().parse(data ?? [])
  if (options.category)
    items = items.filter((item) => item.category_id === options.category)

  const listItems = items.map(searchToListItem)
  const covers = await signCoverUrls(
    listItems
      .map((item) => firstCoverUrl(item.cover_url))
      .filter((url): url is string => Boolean(url)),
  )
  let products = toMarketProductListItems(listItems, covers, nameById)
  if (sort === "score") {
    const dir = options.sortDir === "asc" ? 1 : -1
    products = [...products].sort((a, b) => (a.score - b.score) * dir)
  }
  return products.slice(0, limit)
}

/**
 * Descoberta de produtos via product/list (offline T+1, filtros server-side).
 * page_size travado em 10 → pagina PRODUCT_LIST_PAGES. O product/list é
 * auto-suficiente (preço/comissão/janelas/tendência), então não há enrich por
 * detalhe — só assinamos as capas. `score` é derivado, então sort=score é
 * aplicado pós-fetch sobre a janela trazida (o resto é server-side). Com busca
 * por nome (`query`), roteia pro search/items (filtros server-side não existem lá).
 */
async function getProducts(
  options?: ProductListOptions,
): Promise<MarketProductListItem[]> {
  const opts = options ?? {}
  if (opts.query) return searchProducts(opts)
  const limit = opts.limit ?? 24
  const [pages, nameById] = await Promise.all([
    Promise.all(
      Array.from({ length: PRODUCT_LIST_PAGES }, (_, index) =>
        fetchProductListPage(index + 1, opts),
      ),
    ),
    fetchCategoryNameMap(),
  ])
  const items = pages.flat()

  // Assina as capas (echosell → 403 direto) — lotes de 10, sem custo de cota.
  const covers = await signCoverUrls(
    items
      .map((item) => firstCoverUrl(item.cover_url))
      .filter((url): url is string => Boolean(url)),
  )
  let products = toMarketProductListItems(items, covers, nameById)

  // Score não tem campo de sort no product/list → ordena pós-fetch.
  if ((opts.sort ?? "sales30d") === "score") {
    const dir = opts.sortDir === "asc" ? 1 : -1
    products = [...products].sort((a, b) => (a.score - b.score) * dir)
  }
  return products.slice(0, limit)
}

export const echotikSource: MarketDataSource = {
  async getTopProducts(options?: ListOptions) {
    const limit = options?.limit ?? 10
    // Ranking de 24h: ranklist diário (rank_type=1), recuando até o dia mais
    // recente disponível (T+1). O total_sale_cnt aqui = vendas do dia.
    const [{ items }, nameById] = await Promise.all([
      fetchDailyRank(1),
      fetchCategoryNameMap(),
    ])
    const top = items.slice(0, limit)
    // 1 chamada batcheada traz as janelas 1d/7d/30d de todos pra Tendência/Variação.
    const details = await fetchProductDetails(top.map((item) => item.product_id))
    // Assina as capas (403 direto) — 1 chamada, sem custo de cota.
    const covers = await signCoverUrls(
      top
        .map((item) => firstCoverUrl(details.get(item.product_id)?.cover_url))
        .filter((url): url is string => Boolean(url)),
    )
    return toMarketProducts(top, details, covers, nameById)
  },

  getProducts,

  async getProductDetail(id: string): Promise<MarketProductDetail> {
    // 3 chamadas (a fila do client serializa com gap): ficha + criadores (por
    // vendas do produto) + vídeos (por views). O catálogo resolve o nome da
    // categoria (cacheado — o dashboard já costuma tê-lo aquecido).
    const [detailRaw, creatorsRaw, videosRaw, nameById] = await Promise.all([
      echotikFetch("/echotik/product/detail", { product_ids: id }),
      echotikFetch("/echotik/product/influencer/list", {
        product_id: id,
        page_num: 1,
        page_size: PRODUCT_DETAIL_CREATORS,
        product_influencer_sort_field: 3, // per_product_ifl_sale_cnt (vendas do produto)
        sort_type: 1,
      }),
      echotikFetch("/echotik/product/video/list", {
        product_id: id,
        page_num: 1,
        page_size: PRODUCT_DETAIL_VIDEOS,
        product_video_sort_field: 1, // total_views_cnt
        sort_type: 1,
      }),
      fetchCategoryNameMap(),
    ])

    const detail = productDetailFullSchema.array().parse(detailRaw ?? [])[0]
    if (!detail) {
      throw new EchotikApiError(
        404,
        "/echotik/product/detail",
        `produto ${id} sem ficha`,
      )
    }

    const creators = toProductCreators(
      productInfluencerItemSchema.array().parse(creatorsRaw ?? []),
    )
    const videoItems = productVideoItemSchema.array().parse(videosRaw ?? [])

    // Assina num lote só: capa do produto + capas dos vídeos (echosell → 403).
    const productCover = firstCoverUrl(detail.cover_url)
    const covers = await signCoverUrls(
      [productCover, ...videoItems.map((video) => video.reflow_cover ?? null)]
        .filter((url): url is string => Boolean(url)),
    )

    const image = productCover ? (covers.get(productCover) ?? null) : null
    const categoryName =
      (detail.category_id && nameById.get(detail.category_id)) || "—"

    // O video/list só traz user_id — resolve o @handle num batch best-effort.
    const handleByUserId = await fetchVideoHandles(videoItems)

    return toProductDetail(
      detail,
      image,
      categoryName,
      creators,
      toProductVideos(videoItems, covers, handleByUserId),
    )
  },

  getCreators,

  getVideos,

  getVideoCategories: fetchCategoryCatalog,

  getMarketCategories,

  getMarketCategory,

  getLives,

  async getTrendingCreatives(options?: ListOptions) {
    // Em alta = ranking diário por views (sort=trending).
    return getVideos({ sort: "trending", limit: options?.limit })
  },

  async getTopSellingCreatives(options?: ListOptions) {
    // Mais venderam = ranking diário por vendas/GMV (sort=top-selling).
    return getVideos({ sort: "top-selling", limit: options?.limit })
  },

  async getMarketSummary() {
    const topSellingParams = {
      rankField: VIDEO_RANK_FIELD["top-selling"],
      rankType: 1,
    }
    const [today, trendingVideos, topSelling] = await Promise.all([
      fetchDailyRank(1),
      // Contagem de "criativos em alta" do dia (rank por views).
      fetchVideoRank("day", { rankField: VIDEO_RANK_FIELD.trending, rankType: 1 }),
      // "Top criativos" = ranking de vídeos por GMV/vendas; guardamos a data
      // que resolveu para ancorar o delta vs. ontem.
      fetchVideoRankWithDate("day", topSellingParams),
    ])
    // "Ontem" é ancorado no dia que cada ranking resolveu (a âncora), não
    // recuado de forma independente: como os rankings são T+1, recuos separados
    // colidiriam no mesmo dia e zerariam o delta. Sem âncora → sem comparação.
    const [productsYesterday, creativesYesterday] = await Promise.all([
      today.items.length
        ? fetchRankForDate(previousDay(today.date))
        : Promise.resolve<RankItem[]>([]),
      topSelling.items.length
        ? fetchVideoRankForDate(previousDay(topSelling.date), topSellingParams)
        : Promise.resolve<VideoItem[]>([]),
    ])

    const sumGmv = (items: RankItem[]) =>
      items.reduce((total, item) => total + item.total_sale_gmv_amt, 0)
    const sumCreativeGmv = (items: VideoItem[]) =>
      items.reduce((total, item) => total + item.total_video_sale_gmv_amt, 0)
    // Variação % do dia vs. ontem; null quando não há base de comparação.
    const deltaPct = (now: number, before: number) =>
      before > 0 ? now / before - 1 : null

    const topGmvToday = sumGmv(today.items)
    const creativesGmvToday = sumCreativeGmv(topSelling.items)

    return {
      creativesGmv24h: {
        amount: creativesGmvToday,
        deltaPct: deltaPct(creativesGmvToday, sumCreativeGmv(creativesYesterday)),
      },
      trendingCreatives: {
        count: trendingVideos.filter(
          (video) => video.total_views_cnt >= VIRAL_MIN_VIEWS_24H,
        ).length,
        delta: null,
      },
      topGmv24h: {
        amount: topGmvToday,
        deltaPct: deltaPct(topGmvToday, sumGmv(productsYesterday)),
      },
    }
  },

  async getMarketTrend() {
    // Série diária de mercado exige endpoint de trends/categoria ainda não
    // mapeado na opendoc — o composite cai no mock para este bloco.
    throw new EchotikApiError(
      501,
      "/api/v2/market/trend",
      "série de mercado ainda não mapeada na EchoTik",
    )
  },
}
