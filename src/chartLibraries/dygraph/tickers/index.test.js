import * as tickers from "./index"

describe("tickers index", () => {
  it("exports all ticker functions", () => {
    expect(tickers.numericTicker).toBeDefined()
    expect(tickers.heatmapTicker).toBeDefined()
  })

  it("exports functions for all tickers", () => {
    expect(typeof tickers.numericTicker).toBe("function")
    expect(typeof tickers.heatmapTicker).toBe("function")
  })

  it("exports correct number of tickers", () => {
    const exportedKeys = Object.keys(tickers)
    expect(exportedKeys).toHaveLength(2)
    expect(exportedKeys).toContain("numericTicker")
    expect(exportedKeys).toContain("heatmapTicker")
  })
})