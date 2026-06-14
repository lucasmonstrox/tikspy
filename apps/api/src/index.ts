import { cors } from "@elysiajs/cors"
import { Elysia, t } from "elysia"
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker"

import { EchotikApiError, fromMarketSource } from "./data-source"
import type { MarketDataSource } from "./data-source"
import { notifications } from "./notifications"
import { webhooks } from "./webhooks"

const PORT = Number(process.env.PORT ?? 3333)
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000"

/** Header que indica a procedência do dado ("echotik" | "mock"). */
export const DATA_SOURCE_HEADER = "x-data-source"

const listQuery = t.Object({
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
})

const videosQuery = t.Object({
  sort: t.Optional(
    t.Union([t.Literal("trending"), t.Literal("top-selling")]),
  ),
  period: t.Optional(
    t.Union([t.Literal("day"), t.Literal("week"), t.Literal("month")]),
  ),
  category: t.Optional(t.String()),
  ai: t.Optional(t.Boolean()),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
})

const creatorsQuery = t.Object({
  niche: t.Optional(t.String()),
  minFollowers: t.Optional(t.Numeric({ minimum: 0 })),
  maxFollowers: t.Optional(t.Numeric({ minimum: 0 })),
  sort: t.Optional(
    t.Union([
      t.Literal("followers"),
      t.Literal("videos"),
      t.Literal("efficiency"),
      t.Literal("gmv"),
    ]),
  ),
  sortDir: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
})

const productsQuery = t.Object({
  query: t.Optional(t.String()),
  category: t.Optional(t.String()),
  minPrice: t.Optional(t.Numeric({ minimum: 0 })),
  maxPrice: t.Optional(t.Numeric({ minimum: 0 })),
  minCommission: t.Optional(t.Numeric({ minimum: 0, maximum: 1 })),
  momentum: t.Optional(
    t.Union([
      t.Literal("todos"),
      t.Literal("emergente"),
      t.Literal("consolidado"),
    ]),
  ),
  sort: t.Optional(
    t.Union([
      t.Literal("sales"),
      t.Literal("sales7d"),
      t.Literal("sales30d"),
      t.Literal("price"),
      t.Literal("score"),
    ]),
  ),
  sortDir: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
})

const trendQuery = t.Object({
  days: t.Optional(t.Numeric({ minimum: 7, maximum: 90 })),
})

type SetHeaders = Record<string, string | number>

async function respond<T>(
  headers: SetHeaders,
  call: (source: MarketDataSource) => Promise<T>,
): Promise<T> {
  const { source, data } = await fromMarketSource(call)
  headers[DATA_SOURCE_HEADER] = source
  return data
}

const market = new Elysia({ prefix: "/v1/market" })
  .get("/summary", ({ set }) =>
    respond(set.headers, (source) => source.getMarketSummary()),
  )
  // Descoberta de produtos com filtros (product/list) — base do /produtos.
  .get(
    "/products",
    ({ query, set }) =>
      respond(set.headers, (source) =>
        source.getProducts({
          query: query.query,
          category: query.category,
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
          minCommission: query.minCommission,
          momentum: query.momentum,
          sort: query.sort,
          sortDir: query.sortDir,
          limit: query.limit,
        }),
      ),
    { query: productsQuery },
  )
  .get(
    "/products/top",
    ({ query, set }) =>
      respond(set.headers, (source) =>
        source.getTopProducts({ limit: query.limit }),
      ),
    { query: listQuery },
  )
  // Estático antes do dinâmico (:id) — "/products/top" não pode cair no :id.
  .get(
    "/products/:id",
    async ({ params, set, status }) => {
      try {
        return await respond(set.headers, (source) =>
          source.getProductDetail(params.id),
        )
      } catch (error) {
        // product_id sem ficha no EchoTik → 404 tipado (não polui o tipo do 200).
        if (error instanceof EchotikApiError && error.status === 404) {
          return status(404, { error: "product_not_found" })
        }
        throw error
      }
    },
    { params: t.Object({ id: t.String() }) },
  )
  .get(
    "/creatives/trending",
    ({ query, set }) =>
      respond(set.headers, (source) =>
        source.getTrendingCreatives({ limit: query.limit }),
      ),
    { query: listQuery },
  )
  .get(
    "/creatives/top-selling",
    ({ query, set }) =>
      respond(set.headers, (source) =>
        source.getTopSellingCreatives({ limit: query.limit }),
      ),
    { query: listQuery },
  )
  .get(
    "/creators",
    ({ query, set }) =>
      respond(set.headers, (source) =>
        source.getCreators({
          niche: query.niche,
          minFollowers: query.minFollowers,
          maxFollowers: query.maxFollowers,
          sort: query.sort,
          sortDir: query.sortDir,
          limit: query.limit,
        }),
      ),
    { query: creatorsQuery },
  )
  .get(
    "/videos",
    ({ query, set }) =>
      respond(set.headers, (source) =>
        source.getVideos({
          sort: query.sort,
          period: query.period,
          category: query.category,
          ai: query.ai,
          limit: query.limit,
        }),
      ),
    { query: videosQuery },
  )
  .get("/categories", ({ set }) =>
    respond(set.headers, (source) => source.getVideoCategories()),
  )
  // Estático antes do dinâmico (:id) — "/categories/overview" não pode cair no :id.
  .get(
    "/categories/overview",
    ({ query, set }) =>
      respond(set.headers, (source) =>
        source.getMarketCategories({ limit: query.limit }),
      ),
    { query: listQuery },
  )
  .get(
    "/categories/:id",
    async ({ params, set, status }) => {
      try {
        return await respond(set.headers, (source) =>
          source.getMarketCategory(params.id),
        )
      } catch (error) {
        // category_id fora do catálogo L1 → 404 tipado (não polui o tipo do 200);
        // o resto propaga normal.
        if (error instanceof EchotikApiError && error.status === 404) {
          return status(404, { error: "category_not_found" })
        }
        throw error
      }
    },
    { params: t.Object({ id: t.String() }) },
  )
  .get(
    "/lives",
    ({ query, set }) =>
      respond(set.headers, (source) => source.getLives({ limit: query.limit })),
    { query: listQuery },
  )
  .get(
    "/trend",
    ({ query, set }) =>
      respond(set.headers, (source) =>
        source.getMarketTrend({ days: query.days }),
      ),
    { query: trendQuery },
  )

// No workerd usa o adapter oficial (Elysia ≥1.4.7) com aot:false: o compile()
// (new Function) é proibido em request no workerd, e rodá-lo no startup estoura
// o limite de CPU do deploy (10021). Modo dinâmico resolve. No Bun, adapter padrão.
const isWorkerd =
  typeof navigator !== "undefined" &&
  navigator.userAgent === "Cloudflare-Workers"

export const app = new Elysia(
  isWorkerd ? { adapter: CloudflareAdapter, aot: false } : {},
)
  .use(cors({ origin: CORS_ORIGIN }))
  .get("/health", () => ({ status: "ok" }))
  .use(market)
  .use(webhooks)
  .use(notifications)

// Só sobe o servidor Bun quando executado direto (`bun run src/index.ts`); ao ser
// importado pelo worker.ts (workerd) ou pelo Eden (tipos), não escuta porta.
if (import.meta.main) {
  app.listen(PORT)
  console.log(`[api] TIKSPY API rodando em http://localhost:${PORT}`)
}

export type App = typeof app

export type {
  CreatorSort,
  MarketCategory,
  MarketCategoryDetail,
  MarketCategoryStats,
  MarketCreative,
  MarketCreator,
  MarketLive,
  MarketProduct,
  MarketProductCreator,
  MarketProductDetail,
  MarketProductListItem,
  MarketProductVideo,
  MarketSummary,
  MarketTrendPoint,
  ProductListOptions,
  ProductMomentum,
  ProductSort,
  SourceName,
  VideoPeriod,
  VideoSort,
} from "./data-source"
