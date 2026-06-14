import { PageHeader, PageShell } from "@/shared"

import { LivesTab } from "./tabs/lives-tab"

export function LivesPage() {
  return (
    <PageShell>
      <PageHeader
        title="Lives"
        description="Lives de venda no ar agora no Brasil — o motor do TikTok Shop, em tempo-real."
      />
      <LivesTab />
    </PageShell>
  )
}
