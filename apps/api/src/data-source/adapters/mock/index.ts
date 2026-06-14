import type {
  MarketCategory,
  MarketCategoryStats,
  MarketCreative,
  MarketDataSource,
  MarketLive,
  MarketProduct,
  MarketSummary,
  MarketTrendPoint,
} from "../../types"

const MOCK_SUMMARY: MarketSummary = {
  bestsellers: { count: 132, delta: 18 },
  trendingCreatives: { count: 48, delta: 15 },
  topGmv24h: { amount: 4_800_000, deltaPct: 0.182 },
}

const MOCK_PRODUCTS: MarketProduct[] = [
  {
    id: "mock-p1",
    name: "Fone Bluetooth ANC X12",
    category: "Eletrônicos",
    sales24h: 12_400,
    salesTrend: [20, 24, 31, 38, 52, 70, 92],
    salesDelta24h: 2.12,
    score: 88,
  },
  {
    id: "mock-p2",
    name: "Sérum Vitamina C 30ml",
    category: "Beleza",
    sales24h: 9_800,
    salesTrend: [35, 38, 44, 51, 63, 72, 84],
    salesDelta24h: 1.4,
    score: 82,
  },
  {
    id: "mock-p3",
    name: "Luminária LED Galaxy",
    category: "Casa & decoração",
    sales24h: 7_100,
    salesTrend: [12, 15, 14, 22, 31, 44, 58],
    salesDelta24h: 1.28,
    score: 79,
  },
  {
    id: "mock-p4",
    name: "Escova Alisadora 5 em 1",
    category: "Beleza",
    sales24h: 6_300,
    salesTrend: [40, 44, 49, 47, 58, 66, 71],
    salesDelta24h: 0.64,
    score: 74,
  },
  {
    id: "mock-p5",
    name: "Mini Liquidificador Portátil",
    category: "Cozinha",
    sales24h: 5_200,
    salesTrend: [28, 31, 30, 36, 41, 39, 47],
    salesDelta24h: 0.48,
    score: 68,
  },
  {
    id: "mock-p6",
    name: "Película Hidrogel HD",
    category: "Acessórios",
    sales24h: 4_900,
    salesTrend: [55, 52, 49, 47, 44, 40, 38],
    salesDelta24h: -0.22,
    score: 41,
  },
]

const MOCK_CREATIVES: MarketCreative[] = [
  {
    id: "mock-c1",
    title: "Testei o fone que tá viralizando",
    creatorHandle: "@achadinhosdaduda",
    views: 2_100_000,
    likes: 312_000,
    comments: 8_400,
    shares: 21_000,
    favorites: 45_000,
    estimatedGmv: 184_000,
  },
  {
    id: "mock-c2",
    title: "Pele de vidro com 1 produto",
    creatorHandle: "@belezadareal",
    views: 1_600_000,
    likes: 245_000,
    comments: 6_100,
    shares: 17_500,
    favorites: 38_000,
    estimatedGmv: 142_000,
  },
  {
    id: "mock-c3",
    title: "Quarto aesthetic gastando pouco",
    creatorHandle: "@casa.da.bia",
    views: 1_200_000,
    likes: 180_000,
    comments: 4_900,
    shares: 12_000,
    favorites: 27_000,
    estimatedGmv: 98_000,
  },
  {
    id: "mock-c4",
    title: "Alisei o cabelo em 5 minutos",
    creatorHandle: "@cabelosdarê",
    views: 940_000,
    likes: 132_000,
    comments: 3_700,
    shares: 9_300,
    favorites: 19_500,
    estimatedGmv: 76_000,
  },
  {
    id: "mock-c5",
    title: "Shake fit em 30 segundos",
    creatorHandle: "@vidafitsemneura",
    views: 720_000,
    likes: 98_000,
    comments: 2_600,
    shares: 6_800,
    favorites: 14_200,
    estimatedGmv: 54_000,
  },
  {
    id: "mock-c6",
    title: "Unboxing achados de cozinha",
    creatorHandle: "@cozinhadalulu",
    views: 610_000,
    likes: 76_000,
    comments: 2_100,
    shares: 5_400,
    favorites: 11_800,
    estimatedGmv: 47_000,
  },
]

const MOCK_CATEGORIES: MarketCategory[] = [
  { id: "601450", name: "Beauty & Personal Care" },
  { id: "601352", name: "Womenswear & Underwear" },
  { id: "600001", name: "Home Supplies" },
  { id: "601739", name: "Phones & Electronics" },
  { id: "824328", name: "Health" },
  { id: "856890", name: "Sports & Outdoor" },
]

const MOCK_LIVES: MarketLive[] = [
  {
    id: "mock-l1",
    title: "MEGA liquidação de beleza 🔥",
    host: "@belezaglow",
    hostName: "Beleza Glow Store",
    cover: null,
    viewers: 3_400,
    totalViewers: 52_800,
    productCount: 28,
    hasProducts: true,
    tiktokUrl: "https://www.tiktok.com/@belezaglow/live",
    region: "BR",
  },
  {
    id: "mock-l2",
    title: "Show de ofertas eletrônicos",
    host: "@topeletricobr",
    hostName: "Top Elétrico BR",
    cover: null,
    viewers: 3_100,
    totalViewers: 48_200,
    productCount: 22,
    hasProducts: true,
    tiktokUrl: "https://www.tiktok.com/@topeletricobr/live",
    region: "BR",
  },
  {
    id: "mock-l3",
    title: "Esquenta fim de semana",
    host: "@modabella",
    hostName: "Moda Bella Oficial",
    cover: null,
    viewers: 2_700,
    totalViewers: 39_500,
    productCount: 41,
    hasProducts: true,
    tiktokUrl: "https://www.tiktok.com/@modabella/live",
    region: "BR",
  },
  {
    id: "mock-l4",
    title: "Tech week: até 50% off",
    host: "@techmaxbr",
    hostName: "TechMax Brasil",
    cover: null,
    viewers: 2_300,
    totalViewers: 31_900,
    productCount: 19,
    hasProducts: true,
    tiktokUrl: "https://www.tiktok.com/@techmaxbr/live",
    region: "BR",
  },
  {
    id: "mock-l5",
    title: "Achados de casa ao vivo",
    host: "@casaeciadecor",
    hostName: "Casa & Cia Decor",
    cover: null,
    viewers: 1_500,
    totalViewers: 22_100,
    productCount: 33,
    hasProducts: true,
    tiktokUrl: "https://www.tiktok.com/@casaeciadecor/live",
    region: "BR",
  },
  {
    id: "mock-l6",
    title: "Beleza na sexta: kits exclusivos",
    host: "@dudacosmeticos",
    hostName: "Duda Cosméticos",
    cover: null,
    viewers: 1_400,
    totalViewers: 18_700,
    productCount: 17,
    hasProducts: true,
    tiktokUrl: "https://www.tiktok.com/@dudacosmeticos/live",
    region: "BR",
  },
]

const MOCK_CATEGORY_STATS: MarketCategoryStats[] = [
  { id: "601450", name: "Beleza & cuidados pessoais", gmv: 1_900_000, sales: 38_200, productCount: 41, gmvDelta: 0.21, gmvTrend: [40, 52, 58, 66, 78, 92] },
  { id: "601152", name: "Moda feminina & lingerie", gmv: 1_400_000, sales: 29_700, productCount: 33, gmvDelta: 0.14, gmvTrend: [48, 55, 61, 64, 70, 76] },
  { id: "600001", name: "Casa & utilidades", gmv: 980_000, sales: 21_400, productCount: 27, gmvDelta: 0.18, gmvTrend: [30, 36, 42, 51, 58, 67] },
  { id: "601739", name: "Celulares & eletrônicos", gmv: 870_000, sales: 14_800, productCount: 24, gmvDelta: 0.32, gmvTrend: [22, 35, 44, 56, 71, 88] },
  { id: "600024", name: "Cozinha", gmv: 540_000, sales: 12_100, productCount: 18, gmvDelta: 0.09, gmvTrend: [38, 41, 45, 48, 52, 55] },
  { id: "700645", name: "Saúde", gmv: 350_000, sales: 7_800, productCount: 9, gmvDelta: -0.03, gmvTrend: [55, 52, 50, 48, 47, 45] },
]

const GMV_SERIES = [
  12, 14, 13, 17, 19, 18, 22, 26, 24, 29, 33, 31, 38, 42, 40, 47, 52, 49, 55,
  61, 58, 66, 71, 69, 76, 83, 80, 88, 95, 92,
]

const VIDEOS_SERIES = [
  8, 9, 11, 10, 14, 16, 15, 19, 22, 20, 26, 24, 30, 28, 35, 33, 38, 44, 41,
  48, 45, 52, 58, 55, 61, 59, 67, 72, 70, 78,
]

function buildMockTrend(days: number): MarketTrendPoint[] {
  const today = new Date()
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (days - 1 - index))
    const seriesIndex =
      GMV_SERIES.length - days + index < 0
        ? index % GMV_SERIES.length
        : GMV_SERIES.length - days + index
    return {
      date: date.toISOString().slice(0, 10),
      estimatedGmv: GMV_SERIES[seriesIndex]! * 10_000,
      videosPublished: VIDEOS_SERIES[seriesIndex]! * 100,
    }
  })
}

export const mockSource: MarketDataSource = {
  async getMarketSummary() {
    return MOCK_SUMMARY
  },

  async getTopProducts(options) {
    return MOCK_PRODUCTS.slice(0, options?.limit ?? MOCK_PRODUCTS.length)
  },

  async getTrendingCreatives(options) {
    return MOCK_CREATIVES.slice(0, options?.limit ?? MOCK_CREATIVES.length)
  },

  async getTopSellingCreatives(options) {
    return [...MOCK_CREATIVES]
      .sort((a, b) => b.estimatedGmv - a.estimatedGmv)
      .slice(0, options?.limit ?? MOCK_CREATIVES.length)
  },

  async getCreators() {
    // Decisão de produto: /criadores NÃO usa mock — dado de criador só vem do
    // EchoTik real (rode com MARKET_DATA_SOURCE=echotik). Aqui devolve vazio só
    // pra satisfazer o contrato uniforme.
    return []
  },

  async getVideos(options) {
    // Mock só honra o sort; período/categoria/IA não têm dimensão no mock.
    const list =
      options?.sort === "top-selling"
        ? [...MOCK_CREATIVES].sort((a, b) => b.estimatedGmv - a.estimatedGmv)
        : MOCK_CREATIVES
    return list.slice(0, options?.limit ?? list.length)
  },

  async getVideoCategories() {
    return MOCK_CATEGORIES
  },

  async getMarketCategories(options) {
    return MOCK_CATEGORY_STATS.slice(0, options?.limit ?? MOCK_CATEGORY_STATS.length)
  },

  async getMarketCategory(id) {
    // Mock: casa pelo id quando possível, senão usa a 1ª categoria; produtos fixos.
    const category =
      MOCK_CATEGORY_STATS.find((item) => item.id === id) ?? MOCK_CATEGORY_STATS[0]!
    return { category, products: MOCK_PRODUCTS }
  },

  async getLives(options) {
    return MOCK_LIVES.slice(0, options?.limit ?? MOCK_LIVES.length)
  },

  async getMarketTrend(options) {
    return buildMockTrend(options?.days ?? 30)
  },
}
