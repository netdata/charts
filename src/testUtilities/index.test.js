import * as testUtilities from "./index"
import { renderWithChart, renderWithProviders } from "./renderUtils"
import { makeTestChart } from "./makeTestChart"

describe("testUtilities index", () => {
  it("exports renderWithChart function", () => {
    expect(testUtilities.renderWithChart).toBeDefined()
    expect(typeof testUtilities.renderWithChart).toBe("function")
    expect(testUtilities.renderWithChart).toBe(renderWithChart)
  })

  it("exports renderWithProviders function", () => {
    expect(testUtilities.renderWithProviders).toBeDefined()
    expect(typeof testUtilities.renderWithProviders).toBe("function")
    expect(testUtilities.renderWithProviders).toBe(renderWithProviders)
  })

  it("exports makeTestChart function", () => {
    expect(testUtilities.makeTestChart).toBeDefined()
    expect(typeof testUtilities.makeTestChart).toBe("function")
    expect(testUtilities.makeTestChart).toBe(makeTestChart)
  })

  it("exports all expected utilities", () => {
    const expectedExports = ["renderWithChart", "renderWithProviders", "makeTestChart"]
    
    expectedExports.forEach(exportName => {
      expect(testUtilities).toHaveProperty(exportName)
      expect(typeof testUtilities[exportName]).toBe("function")
    })
  })
})