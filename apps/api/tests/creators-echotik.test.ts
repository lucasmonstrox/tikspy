import { afterAll, beforeAll, describe, expect, test } from "bun:test"

import { echotikSource } from "../src/data-source/adapters/echotik"

// Stuba o limite HTTP do EchoTik (não é "mock no produto" — é fixture de teste).
// Cada chamada devolve 2 criadores com GMV diferente p/ validar o pós-sort.
const realFetch = globalThis.fetch

function envelope(data: unknown): Response {
  return new Response(JSON.stringify({ code: 0, message: "success", data }), {
    headers: { "content-type": "application/json" },
  })
}

function item(over: Record<string, unknown> = {}) {
  return {
    user_id: "u1",
    unique_id: "camila",
    nick_name: "Camila",
    category: "Beauty",
    ec_score: 7,
    interaction_rate: 0.05,
    total_followers_cnt: 1000,
    total_sale_gmv_30d_amt: 100,
    ...over,
  }
}

let urls: string[] = []

describe("echotikSource.getCreators (influencer/list)", () => {
  beforeAll(() => {
    globalThis.fetch = (async (input: URL | RequestInfo) => {
      urls.push(typeof input === "string" ? input : input.toString())
      return envelope([
        item({ user_id: "low", unique_id: "low", total_sale_gmv_30d_amt: 50 }),
        item({
          user_id: "high",
          unique_id: "high",
          total_sale_gmv_30d_amt: 900,
        }),
      ])
    }) as typeof fetch
  })

  afterAll(() => {
    globalThis.fetch = realFetch
  })

  test("monta a query com os filtros server-side", async () => {
    urls = []
    await echotikSource.getCreators({
      niche: "Beleza",
      minFollowers: 1000,
      sort: "followers",
      sortDir: "desc",
      limit: 5,
    })
    const url = urls.find((u) => u.includes("/influencer/list"))
    expect(url).toBeDefined()
    expect(url).toContain("region=BR")
    expect(url).toContain("influencer_category_name=Beleza")
    expect(url).toContain("min_total_followers_cnt=1000")
    expect(url).toContain("influencer_sort_field_v2=1") // followers
    expect(url).toContain("sort_type=1") // desc
  })

  test("sort=gmv NÃO manda campo de sort e ordena pós-fetch (desc)", async () => {
    urls = []
    const creators = await echotikSource.getCreators({
      sort: "gmv",
      niche: "GmvNiche", // chave de cache distinta da do teste anterior
      limit: 5,
    })
    const url = urls.find((u) => u.includes("GmvNiche"))!
    expect(url).not.toContain("influencer_sort_field_v2")
    expect(creators[0]!.estimatedGmv).toBeGreaterThanOrEqual(
      creators[1]!.estimatedGmv
    )
    expect(creators[0]!.handle).toBe("@high")
  })
})
