import { makeHeatmapPayload, makeTestChart } from "@jest/testUtilities"
import makeStackedData, {
  getVisibleStackedRange,
  packDivergingStackedData,
} from "./data"

const readValue = (packed, values, seriesIndex, pointIndex) =>
  packed.yOrigin +
  values[pointIndex * packed.seriesCount + seriesIndex] * packed.yScale

const expectClose = (actual, expected) =>
  expected.forEach((value, index) => expect(actual[index]).toBeCloseTo(value, 6))

describe("GPU diverging stacked data", () => {
  it("stacks positive and negative values independently in reverse series order", () => {
    const rows = [
      [1000, 2, -1, 0.5],
      [2000, -2, 1, -0.25],
    ]
    const packed = packDivergingStackedData(rows, 3, null, [0, 1, 2])

    expectClose(
      Array.from({ length: 6 }, (_, index) =>
        readValue(packed, packed.base, Math.floor(index / 2), index % 2)
      ),
      [0.5, -0.25, 0, 0, 0, 0]
    )
    expectClose(
      Array.from({ length: 6 }, (_, index) =>
        readValue(packed, packed.y, Math.floor(index / 2), index % 2)
      ),
      [2.5, -2.25, -1, 1, 0.5, -0.25]
    )
    expect([packed.dataMin, packed.dataMax]).toEqual([-2.25, 2.5])
    expect(rows).toEqual([
      [1000, 2, -1, 0.5],
      [2000, -2, 1, -0.25],
    ])
  })

  it("rebases stacks when dimensions are hidden and preserves null gaps", () => {
    const packed = packDivergingStackedData(
      [
        [1000, 2, null, 4],
        [2000, 3, -1, null],
      ],
      3,
      null,
      [0, 1]
    )

    expectClose(
      [readValue(packed, packed.base, 0, 0), readValue(packed, packed.y, 0, 0)],
      [0, 2]
    )
    expect(Number.isNaN(packed.base[1])).toBe(true)
    expect(Number.isNaN(packed.y[1])).toBe(true)
    expect(Number.isNaN(packed.base[2])).toBe(true)
    expect(Number.isNaN(packed.y[2])).toBe(true)
    expect(packed.gapEdgeIndexes[1]).toEqual([1])
  })

  it("skips gap-edge residency for bar adapters without changing nulls", () => {
    const packed = packDivergingStackedData(
      [
        [1000, 1],
        [2000, null],
      ],
      1,
      null,
      [0],
      { trackGapEdges: false }
    )

    expect(packed.gapEdgeIndexes).toEqual([])
    expect(Number.isNaN(packed.y[1])).toBe(true)
  })

  it("keeps compact point-schema values exact", () => {
    const point = { value: 1 }
    const packed = packDivergingStackedData(
      [
        [1000, [99, 2], [99, 4]],
        [2000, [99, -3], [99, -5]],
      ],
      2,
      point,
      [0, 1]
    )

    expectClose(
      [
        readValue(packed, packed.base, 0, 0),
        readValue(packed, packed.y, 0, 0),
        readValue(packed, packed.base, 0, 1),
        readValue(packed, packed.y, 0, 1),
      ],
      [4, 6, -5, -8]
    )
  })

  it("rebuilds stack residency when visible dimensions change", async () => {
    const { chart } = makeTestChart({
      attributes: { chartType: "stacked", groupBy: [], selectedLegendDimensions: [] },
    })
    const payload = makeHeatmapPayload(["top", "middle", "bottom"], [[2, 3, 4]])
    payload.view.chart_type = "stacked"
    payload.view.dimensions.grouped_by = []
    chart.doneFetch(payload)
    await new Promise(resolve => setTimeout(resolve, 0))
    const data = makeStackedData(chart)
    const allVisible = data.get()

    expect(readValue(allVisible, allVisible.base, 0, 0)).toBeCloseTo(7)
    chart.updateAttribute("selectedLegendDimensions", ["top"])
    const topOnly = data.get()

    expect(topOnly).not.toBe(allVisible)
    expect(readValue(topOnly, topOnly.base, 0, 0)).toBeCloseTo(0)
    expect(readValue(topOnly, topOnly.y, 0, 0)).toBeCloseTo(2)
  })

  it("queries exact full and partial visible-window stack ranges", () => {
    const rows = Array.from({ length: 70 }, (_, index) => [
      1000 + index * 1000,
      index === 32 ? 100 : 2,
      index === 33 ? -80 : -1,
    ])
    const packed = packDivergingStackedData(rows, 2, null, [0, 1])

    expect(
      getVisibleStackedRange({ packed, afterMs: 1000, beforeMs: 70000 })
    ).toEqual([-80, 100])
    expect(
      getVisibleStackedRange({ packed, afterMs: 35000, beforeMs: 40000 })
    ).toEqual([-1, 2])
  })
})
