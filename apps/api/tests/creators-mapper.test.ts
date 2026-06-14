import { describe, expect, test } from "bun:test"

import { toMarketCreators } from "../src/data-source/adapters/echotik/mappers"
import type { InfluencerListItem } from "../src/data-source/adapters/echotik/schemas"

function makeItem(over: Partial<InfluencerListItem> = {}): InfluencerListItem {
  return {
    user_id: "u1",
    unique_id: "camila",
    nick_name: "Camila",
    avatar: null,
    category: "Beauty & Personal Care",
    ec_score: 7,
    interaction_rate: 0.05,
    total_followers_cnt: 1000,
    total_followers_1d_cnt: 10,
    total_followers_7d_cnt: 70,
    total_followers_30d_cnt: 300,
    total_followers_90d_cnt: 900,
    total_post_video_cnt: 40,
    total_product_cnt: 12,
    total_sale_gmv_amt: 500,
    total_sale_gmv_30d_amt: 200,
    ...over,
  }
}

describe("toMarketCreators", () => {
  test("mapeia identidade, handle e nicho", () => {
    const [c] = toMarketCreators([makeItem()])
    expect(c).toBeDefined()
    expect(c!.id).toBe("u1")
    expect(c!.handle).toBe("@camila")
    expect(c!.name).toBe("Camila")
    expect(c!.niche).toBe("Beauty & Personal Care")
    expect(c!.followers).toBe(1000)
    expect(c!.videos).toBe(40)
    expect(c!.products).toBe(12)
  })

  test("efficiency fica em 0–100 (ec_score×10, com piso de engajamento)", () => {
    // ec_score 7 × 10 = 70 (engajamento 0 não levanta)
    expect(
      toMarketCreators([makeItem({ ec_score: 7, interaction_rate: 0 })])[0]!
        .efficiency
    ).toBe(70)
    // engajamento alto (0.9 → 90) domina ec_score baixo (1 → 10)
    expect(
      toMarketCreators([makeItem({ ec_score: 1, interaction_rate: 0.9 })])[0]!
        .efficiency
    ).toBe(90)
    // clamp em 100 mesmo com ec_score absurdo
    expect(toMarketCreators([makeItem({ ec_score: 50 })])[0]!.efficiency).toBe(
      100
    )
  })

  test("trend é cronológico (mais antigo → hoje) e termina no total atual", () => {
    const [c] = toMarketCreators([makeItem()])
    // now - 90d, now - 30d, now - 7d, now - 1d, now
    expect(c!.trend).toEqual([100, 700, 930, 990, 1000])
    // reconstrução por incrementos é monótona → up sempre verdadeiro (v1)
    expect(c!.up).toBe(true)
  })

  test("estimatedGmv usa 30d quando houver, senão o acumulado", () => {
    expect(
      toMarketCreators([
        makeItem({ total_sale_gmv_30d_amt: 200, total_sale_gmv_amt: 500 }),
      ])[0]!.estimatedGmv
    ).toBe(200)
    expect(
      toMarketCreators([
        makeItem({ total_sale_gmv_30d_amt: 0, total_sale_gmv_amt: 500 }),
      ])[0]!.estimatedGmv
    ).toBe(500)
  })

  test("descarta criador sem handle e aplica fallback de nome/nicho", () => {
    const result = toMarketCreators([
      makeItem({ unique_id: null }),
      makeItem({
        user_id: "u2",
        unique_id: "joao",
        category: null,
        nick_name: null,
      }),
    ])
    expect(result).toHaveLength(1)
    expect(result[0]!.handle).toBe("@joao")
    expect(result[0]!.name).toBe("@joao")
    expect(result[0]!.niche).toBe("—")
  })
})
