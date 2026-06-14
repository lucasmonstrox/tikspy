import { afterAll, beforeAll, describe, expect, test } from "bun:test"

import { app } from "../src/index"

// Fixa a fonte em mock (getPrimary lê MARKET_DATA_SOURCE por request) p/ o teste
// ser determinístico e OFFLINE — sem isso, um .env com echotik faria o teste
// bater na API paga. getCreators do mock devolve [] (decisão "nada mockado" p/
// criadores). Valida o WIRING do endpoint + a validação de query.
const base = "http://localhost"
const previousSource = process.env.MARKET_DATA_SOURCE

beforeAll(() => {
  process.env.MARKET_DATA_SOURCE = "mock"
})

afterAll(() => {
  if (previousSource === undefined) delete process.env.MARKET_DATA_SOURCE
  else process.env.MARKET_DATA_SOURCE = previousSource
})

describe("GET /v1/market/creators", () => {
  test("200, body [] no mock, com header x-data-source", async () => {
    const res = await app.handle(
      new Request(`${base}/v1/market/creators?limit=5`)
    )
    expect(res.status).toBe(200)
    expect(res.headers.get("x-data-source")).toBe("mock")
    expect(await res.json()).toEqual([])
  })

  test("limit fora do range (max 100) → 422", async () => {
    const res = await app.handle(
      new Request(`${base}/v1/market/creators?limit=999`)
    )
    expect(res.status).toBe(422)
  })

  test("sort fora do enum → 422", async () => {
    const res = await app.handle(
      new Request(`${base}/v1/market/creators?sort=banana`)
    )
    expect(res.status).toBe(422)
  })

  test("sort + niche válidos → 200", async () => {
    const res = await app.handle(
      new Request(
        `${base}/v1/market/creators?sort=gmv&niche=Beleza&sortDir=desc`
      )
    )
    expect(res.status).toBe(200)
  })
})
