import { describe, expect, test } from "bun:test"

import { parseCreatorFilters } from "../features/concorrencia/schemas/criadores-filtros"

describe("parseCreatorFilters", () => {
  test("vazio → defaults (sort=followers, sem niche/minFollowers)", () => {
    expect(parseCreatorFilters({})).toEqual({
      sort: "followers",
      niche: undefined,
      minFollowers: undefined,
    })
  })

  test("sort válido passa; inválido cai no default", () => {
    expect(parseCreatorFilters({ sort: "gmv" }).sort).toBe("gmv")
    expect(parseCreatorFilters({ sort: "banana" }).sort).toBe("followers")
  })

  test("minFollowers: coage string→number; inválido/negativo → undefined", () => {
    expect(parseCreatorFilters({ minFollowers: "10000" }).minFollowers).toBe(
      10000
    )
    expect(
      parseCreatorFilters({ minFollowers: "abc" }).minFollowers
    ).toBeUndefined()
    expect(
      parseCreatorFilters({ minFollowers: "-5" }).minFollowers
    ).toBeUndefined()
  })

  test("niche passa como string", () => {
    expect(parseCreatorFilters({ niche: "Beauty & Personal Care" }).niche).toBe(
      "Beauty & Personal Care"
    )
  })

  test("param repetido (array) cai no default", () => {
    expect(parseCreatorFilters({ sort: ["gmv", "followers"] }).sort).toBe(
      "followers"
    )
  })
})
