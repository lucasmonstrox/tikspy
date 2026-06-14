export const REGION = "BR"

// Cache lazy por URL (client.ts): refaz a chamada no 1º request após expirar,
// nunca em background — protege a cota. Default 5min para poupar o trial de
// 100 chamadas; sobreponha via env (ver docs/fornecedores.md §1.1).
export const CACHE_TTL_MS = Number(
  process.env.ECHOTIK_CACHE_TTL_MS ?? 5 * 60 * 1000,
)

/** Trial da EchoTik limita page_size a 10 — profundidade vem de mais páginas. */
export const RANK_PAGE_SIZE = 10
export const RANK_PAGES = 2
export const VIDEO_PAGE_SIZE = 10
export const VIDEO_PAGES = 2
/** Criadores (influencer/list, offline T+1): page_size travado em 10 igual aos demais. */
export const INFLUENCER_PAGE_SIZE = 10
export const INFLUENCER_PAGES = 2

// /categorias agrega o ranking diário por category_id. A lista varre o ranking
// GLOBAL fundo o bastante p/ cobrir várias categorias; o detalhe varre o ranking
// já filtrado por categoria. Cada página é +1 chamada (page_size travado em 10).
export const CATEGORY_RANK_PAGES = 5
export const CATEGORY_DETAIL_PAGES = 3
/** Quantos produtos enriquecer/exibir no detalhe da categoria (limita detail+capas). */
export const CATEGORY_DETAIL_PRODUCTS = 15
/** Idioma do catálogo de categorias (EchoTik não tem pt-BR — overlay local). */
export const CATEGORY_LANGUAGE = "en-US"

// Lives BR: só existem em tempo-real (realtime/live/search por palavra-chave; a
// biblioteca offline não cobre lives do Brasil). Buscamos por termos de intenção
// de compra, deduplicamos por room_id e enriquecemos o topo com live/detail
// (espectadores atuais). Cada keyword e cada enrich é +1 chamada — mantém enxuto.
export const LIVE_KEYWORDS = ["promoção", "oferta", "desconto", "ao vivo"]
/**
 * Quantas lives enriquecer com live/detail (audiência atual). live/detail é
 * pesada (payload gigante da sala) — roda em PARALELO (modo parallel do client)
 * e limitada a este teto; o resto fica sem viewers (mostra "—"), sem quebrar.
 */
export const LIVE_ENRICH_LIMIT = 8

// Limiares de negócio (provisórios — revisar com dados reais acumulados)
export const BESTSELLER_MIN_SALES_24H = 500
export const VIRAL_MIN_VIEWS_24H = 500_000
