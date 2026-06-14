import {
  echotikSource,
  EchotikApiError,
  isEchotikConfigured,
} from "./adapters/echotik"
import { mockSource } from "./adapters/mock"
import type { MarketDataSource, SourceName } from "./types"

export type {
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
  TrendOptions,
  VideoListOptions,
  VideoPeriod,
  VideoSort,
} from "./types"
export { EchotikApiError, isEchotikConfigured } from "./adapters/echotik"

export type SourcedResult<T> = {
  source: SourceName
  data: T
}

type Primary = {
  name: SourceName
  source: MarketDataSource
}

/**
 * Seleção explícita via MARKET_DATA_SOURCE ("echotik" | "mock").
 * Default mock — ninguém liga o fornecedor pago por acidente e o
 * produto continua demonstrável sem credencial.
 */
function getPrimary(): Primary {
  const selected = process.env.MARKET_DATA_SOURCE ?? "mock"

  if (selected === "echotik") {
    if (!isEchotikConfigured()) {
      throw new Error(
        "MARKET_DATA_SOURCE=echotik exige ECHOTIK_RAPIDAPI_KEY " +
          "(chave do gateway RapidAPI tiktok-ultra-api1)",
      )
    }
    return { name: "echotik", source: echotikSource }
  }

  return { name: "mock", source: mockSource }
}

/**
 * Executa no fornecedor primário. Fallback para mock SÓ no 501 (endpoint que
 * o EchoTik ainda não mapeou — ex.: série de mercado): aí mock é a única
 * opção legítima. Falha real (cota, 429, 500) PROPAGA — nada de mascarar dado
 * que existe e só não conseguimos. A resposta carrega `source` para a UI
 * poder sinalizar a procedência.
 */
export async function fromMarketSource<T>(
  call: (source: MarketDataSource) => Promise<T>,
): Promise<SourcedResult<T>> {
  const primary = getPrimary()
  if (primary.name === "mock") {
    return { source: "mock", data: await call(primary.source) }
  }

  try {
    return { source: primary.name, data: await call(primary.source) }
  } catch (error) {
    if (error instanceof EchotikApiError && error.status === 501) {
      return { source: "mock", data: await call(mockSource) }
    }
    throw error
  }
}
