import Dygraph from "dygraphs"
import { makeHeatmapPayload, makeTestChart } from "@jest/testUtilities"
import {
  findDivergingStackedPoint,
  getDivergingStackBounds,
  makeDivergingStackedDataHandler,
} from "./divergingStack"

const loadStackedPayload = async (chart, ids, rows, labels = ids) => {
  const payload = makeHeatmapPayload(ids, rows)

  payload.view.chart_type = "stacked"
  payload.view.dimensions.grouped_by = []
  payload.view.dimensions.names = labels
  payload.result.labels = ["time", ...labels]

  chart.doneFetch(payload)
  await new Promise(resolve => setTimeout(resolve, 0))
}

const makeDygraph = chart => {
  const element = document.createElement("div")
  Object.defineProperties(element, {
    clientWidth: { value: 800 },
    clientHeight: { value: 400 },
  })
  element.style.padding = "0px"
  document.body.appendChild(element)

  const dimensionIds = chart.getPayloadDimensionIds()
  const selectedDimensions = chart.getAttribute("selectedLegendDimensions")
  const visibility = [
    ...dimensionIds.map(selectedDimensions.length ? chart.isDimensionVisible : () => true),
    true,
    true,
  ]

  return new Dygraph(element, chart.getPayload().data, {
    labels: chart.getPayload().labels,
    visibility,
    dataHandler: makeDivergingStackedDataHandler(chart),
  })
}

const gather = dygraph => dygraph.gatherDatasets_(dygraph.rolledSeries_, null)

describe("diverging stacked data handler", () => {
  const dygraphs = []

  afterEach(() => {
    dygraphs.forEach(dygraph => dygraph.destroy())
    dygraphs.length = 0
    document.body.innerHTML = ""
  })

  const createChart = async (ids, rows, attributes = {}, labels = ids) => {
    const { chart } = makeTestChart({
      attributes: {
        chartType: "stacked",
        groupBy: [],
        selectedLegendDimensions: [],
        ...attributes,
      },
    })

    await loadStackedPayload(chart, ids, rows, labels)

    const dygraph = makeDygraph(chart)
    dygraphs.push(dygraph)

    return { chart, dygraph }
  }

  it("stacks positive and negative values independently at every point", async () => {
    const { chart, dygraph } = await createChart(
      ["positive", "negative", "crossing"],
      [
        [2, -1, 0.5],
        [-2, 1, -0.25],
      ]
    )
    const rawData = chart.getPayload().data.map(row => [...row])
    const { points, extremes } = gather(dygraph)

    expect(points[1].map(getDivergingStackBounds)).toEqual([
      { base: 0.5, end: 2.5 },
      { base: -0.25, end: -2.25 },
    ])
    expect(points[2].map(getDivergingStackBounds)).toEqual([
      { base: 0, end: -1 },
      { base: 0, end: 1 },
    ])
    expect(points[3].map(getDivergingStackBounds)).toEqual([
      { base: 0, end: 0.5 },
      { base: 0, end: -0.25 },
    ])
    expect(extremes.positive).toEqual([-2.25, 2.5])
    expect(extremes.negative).toEqual([-1, 1])
    expect(extremes.crossing).toEqual([-0.25, 0.5])
    expect(chart.getPayload().data).toEqual(rawData)
  })

  it("preserves the existing reverse series order for positive stacks", async () => {
    const { dygraph } = await createChart(["top", "middle", "bottom"], [[2, 3, 4]])
    const { points } = gather(dygraph)

    expect(getDivergingStackBounds(points[3][0])).toEqual({ base: 0, end: 4 })
    expect(getDivergingStackBounds(points[2][0])).toEqual({ base: 4, end: 7 })
    expect(getDivergingStackBounds(points[1][0])).toEqual({ base: 7, end: 9 })
  })

  it("preserves the existing reverse series order for negative stacks", async () => {
    const { dygraph } = await createChart(["top", "middle", "bottom"], [[-2, -3, -4]])
    const { points } = gather(dygraph)

    expect(getDivergingStackBounds(points[3][0])).toEqual({ base: 0, end: -4 })
    expect(getDivergingStackBounds(points[2][0])).toEqual({ base: -4, end: -7 })
    expect(getDivergingStackBounds(points[1][0])).toEqual({ base: -7, end: -9 })
  })

  it("maps display labels to dimension ids by column", async () => {
    const ids = ['{"PROTOCOL":"6"}', '{"PROTOCOL":"17"}']
    const labels = ["Protocol=TCP", "Protocol=UDP"]
    const { dygraph } = await createChart(ids, [[2, 4]], {}, labels)
    const { points } = gather(dygraph)

    expect(getDivergingStackBounds(points[2][0])).toEqual({ base: 0, end: 4 })
    expect(getDivergingStackBounds(points[1][0])).toEqual({ base: 4, end: 6 })
  })

  it("maps a tile sparkline label to its synthetic dimension", async () => {
    const { dygraph } = await createChart(
      ["source dimension"],
      [[5]],
      { sparkline: true },
      ["selected"]
    )
    const { points } = gather(dygraph)

    expect(getDivergingStackBounds(points[1][0])).toEqual({ base: 0, end: 5 })
  })

  it("leaves null values as gaps without changing adjacent stack totals", async () => {
    const { dygraph } = await createChart(["top", "gap", "bottom"], [[2, null, 4]])
    const { points } = gather(dygraph)

    expect(getDivergingStackBounds(points[3][0])).toEqual({ base: 0, end: 4 })
    expect(getDivergingStackBounds(points[2][0])).toBeNull()
    expect(getDivergingStackBounds(points[1][0])).toEqual({ base: 4, end: 6 })
  })

  it("rebases a selected dimension at zero", async () => {
    const ids = ["top-id", "middle-id", "bottom-id"]
    const labels = ["top", "middle", "bottom"]
    const { chart, dygraph } = await createChart(ids, [[2, 3, 4]], {}, labels)
    chart.updateAttribute("selectedLegendDimensions", ["middle"])
    await new Promise(resolve => setTimeout(resolve, 0))

    dygraph.updateOptions({
      visibility: [...ids.map(chart.isDimensionVisible), true, true],
      dataHandler: makeDivergingStackedDataHandler(chart),
    })

    const { points } = gather(dygraph)
    expect(points[1]).toBeUndefined()
    expect(getDivergingStackBounds(points[2][0])).toEqual({ base: 0, end: 3 })
    expect(points[3]).toBeUndefined()
  })

  it("resets accumulators for every zoom-range gather", async () => {
    const { dygraph } = await createChart(["top", "bottom"], [[2, 4]])

    const first = gather(dygraph)
    const second = gather(dygraph)

    expect(getDivergingStackBounds(first.points[1][0])).toEqual({ base: 4, end: 6 })
    expect(getDivergingStackBounds(second.points[1][0])).toEqual({ base: 4, end: 6 })
  })

  it("finds the signed band under the cursor", async () => {
    const { dygraph } = await createChart(
      ["positive", "negative", "crossing"],
      [[2, -1, 0.5]]
    )
    const { points } = gather(dygraph)
    const rowPoints = points.slice(1, 4).map(series => series[0])
    const toDomYCoord = value => 100 - value * 10

    expect(findDivergingStackedPoint(rowPoints, 105, toDomYCoord).seriesName).toBe("negative")
    expect(findDivergingStackedPoint(rowPoints, 98, toDomYCoord).seriesName).toBe("crossing")
  })
})
