"use server"

import { getProductDetail } from "../services/dashboard"

/**
 * Carrega a ficha completa de um produto sob demanda (clique no sheet do
 * dashboard). Server action pra a tabela poder ser client sem expor o Eden no
 * browser. Devolve `null` quando o produto não tem ficha (404).
 */
export async function fetchProductDetail(id: string) {
  return getProductDetail(id)
}
