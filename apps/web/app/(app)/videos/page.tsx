import type { Metadata } from "next"

import { VideosPage } from "@/features/concorrencia"

export const metadata: Metadata = { title: "Vídeos & criativos" }

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return <VideosPage searchParams={await searchParams} />
}
