import type { Metadata } from "next"

import { ProdutoDetalhePage } from "@/features/descoberta"

export const metadata: Metadata = { title: "Produto" }

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProdutoDetalhePage id={id} />
}
