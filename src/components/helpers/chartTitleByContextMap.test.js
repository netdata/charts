import chartTitleByContextMap from "./chartTitleByContextMap"

describe("chartTitleByContextMap", () => {
  it("exports an object with chart title mappings", () => {
    expect(typeof chartTitleByContextMap).toBe("object")
    expect(chartTitleByContextMap).not.toBe(null)
  })

  it("contains fping context mappings", () => {
    expect(chartTitleByContextMap["fping.latency"]).toBeDefined()
    expect(chartTitleByContextMap["fping.packets"]).toBeDefined()
    expect(chartTitleByContextMap["fping.quality"]).toBeDefined()
  })

  it("has string values for all mappings", () => {
    Object.values(chartTitleByContextMap).forEach(value => {
      expect(typeof value).toBe("string")
      expect(value.length).toBeGreaterThan(0)
    })
  })
})
