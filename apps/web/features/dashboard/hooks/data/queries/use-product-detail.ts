"use client"

import { useEffect, useState } from "react"

import type { MarketProductDetail } from "api"

import { fetchProductDetail } from "../../../actions/product-detail"

type ProductDetailState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; detail: MarketProductDetail | null }

/**
 * Carrega a ficha do produto via server action quando o sheet abre. `id` null
 * (sheet fechado) não dispara nada. Cancela em troca de id pra evitar corrida.
 */
export function useProductDetail(id: string | null): ProductDetailState {
  const [state, setState] = useState<ProductDetailState>({ status: "loading" })

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setState({ status: "loading" })
    fetchProductDetail(id)
      .then((detail) => {
        if (!cancelled) setState({ status: "success", detail })
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return state
}
