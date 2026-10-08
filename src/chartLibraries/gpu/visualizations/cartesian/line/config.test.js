import { shouldIncludeZero } from "./config"

describe("GPU Cartesian series range policy", () => {
  it("honors an explicit include-zero request", () => {
    expect(
      shouldIncludeZero({
        includeZero: true,
        forceIncludeZero: false,
        dimensionCount: 1,
        selectedDimensionCount: 0,
      })
    ).toBe(true)
  })

  it("matches Dygraphs multi-series forced include-zero behavior", () => {
    expect(
      shouldIncludeZero({
        includeZero: false,
        forceIncludeZero: true,
        dimensionCount: 3,
        selectedDimensionCount: 2,
      })
    ).toBe(true)
    expect(
      shouldIncludeZero({
        includeZero: false,
        forceIncludeZero: true,
        dimensionCount: 3,
        selectedDimensionCount: 1,
      })
    ).toBe(false)
    expect(
      shouldIncludeZero({
        includeZero: false,
        forceIncludeZero: true,
        dimensionCount: 1,
        selectedDimensionCount: 3,
      })
    ).toBe(false)
  })
})
