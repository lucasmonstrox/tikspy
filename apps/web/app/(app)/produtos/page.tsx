import type { Metadata } from "next"

import { ProdutosPage } from "@/features/descoberta"

export const metadata: Metadata = { title: "Buscar produtos" }

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return <ProdutosPage searchParams={await searchParams} />
}
