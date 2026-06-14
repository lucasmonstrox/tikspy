import type { MarketCategoryStats } from "../../types"
import type { RankItem } from "./schemas"

/**
 * Overlay pt-BR sobre os nomes en-US do catálogo L1 da EchoTik (não há pt-BR na
 * API). A lista L1 é estável; quando a EchoTik adicionar uma categoria nova, ela
 * cai no fallback (nome en-US do catálogo) até ser mapeada aqui.
 */
export const CATEGORY_LABELS_PT: Record<string, string> = {
  "2344592": "Reservas & vouchers",
  "600001": "Casa & utilidades",
  "600024": "Cozinha",
  "600154": "Cama, mesa & banho",
  "600942": "Eletrodomésticos",
  "601152": "Moda feminina & lingerie",
  "601303": "Moda muçulmana",
  "601352": "Calçados",
  "601450": "Beleza & cuidados pessoais",
  "601739": "Celulares & eletrônicos",
  "601755": "Informática & escritório",
  "602118": "Pet shop",
  "602284": "Bebê & maternidade",
  "603014": "Esportes & lazer",
  "604206": "Brinquedos & hobbies",
  "604453": "Móveis",
  "604579": "Ferramentas",
  "604968": "Reforma & construção",
  "605196": "Automotivo & moto",
  "605248": "Acessórios de moda",
  "700437": "Alimentos & bebidas",
  "700645": "Saúde",
  "801928": "Livros & mídia",
  "802184": "Moda infantil",
  "824328": "Moda masculina",
  "824584": "Malas & bolsas",
  "834312": "Produtos virtuais",
  "856720": "Usados",
  "951432": "Colecionáveis",
  "953224": "Joias & acessórios",
}

/** Nome pt-BR quando mapeado; senão o nome do catálogo (en-US). */
export function localizeCategory(id: string, fallbackName: string): string {
  return CATEGORY_LABELS_PT[id] ?? fallbackName
}

// "0" = "Other" e category_id vazio são ruído (produtos sem categoria L1) —
// fora da visão de categorias.
const EXCLUDED_CATEGORY_IDS = new Set(["", "0"])

const sumGmv = (items: RankItem[]) =>
  items.reduce((total, item) => total + item.total_sale_gmv_amt, 0)
const sumSales = (items: RankItem[]) =>
  items.reduce((total, item) => total + item.total_sale_cnt, 0)

/** GMV dos produtos-líderes em ordem crescente (cauda do array p/ o mini-gráfico). */
function gmvTrend(items: RankItem[]): number[] {
  return items
    .map((item) => item.total_sale_gmv_amt)
    .sort((a, b) => a - b)
    .slice(-7)
}

function categoryId(item: RankItem): string | null {
  const id = item.category_id
  if (!id || EXCLUDED_CATEGORY_IDS.has(id)) return null
  return id
}

function groupByCategory(items: RankItem[]): Map<string, RankItem[]> {
  const groups = new Map<string, RankItem[]>()
  for (const item of items) {
    const id = categoryId(item)
    if (!id) continue
    const bucket = groups.get(id)
    if (bucket) bucket.push(item)
    else groups.set(id, [item])
  }
  return groups
}

/**
 * Agrega o ranking diário GLOBAL por category_id → cards de /categorias. GMV/
 * vendas/contagem somam só os produtos que aparecem no ranking (não o catálogo
 * inteiro). `gmvDelta` compara o GMV da categoria com o do dia anterior.
 */
export function aggregateCategories(
  today: RankItem[],
  yesterday: RankItem[],
  nameById: Map<string, string>,
  limit: number,
): MarketCategoryStats[] {
  const groups = groupByCategory(today)
  const yesterdayGroups = groupByCategory(yesterday)

  const stats = Array.from(groups, ([id, items]) =>
    buildCategoryStats(id, nameById.get(id) ?? id, items, yesterdayGroups.get(id) ?? []),
  )
  return stats.sort((a, b) => b.gmv - a.gmv).slice(0, limit)
}

/** Métricas de UMA categoria a partir dos rankings (filtrados) de hoje e ontem. */
export function buildCategoryStats(
  id: string,
  name: string,
  today: RankItem[],
  yesterday: RankItem[],
): MarketCategoryStats {
  const gmv = sumGmv(today)
  const prevGmv = sumGmv(yesterday)
  return {
    id,
    name,
    gmv,
    sales: sumSales(today),
    productCount: today.length,
    gmvDelta: prevGmv > 0 ? gmv / prevGmv - 1 : null,
    gmvTrend: gmvTrend(today),
  }
}
