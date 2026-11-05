import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import {
  loadHeatmapPayload,
  makeHeatmapPayload,
  makeTestChart,
  renderWithChart,
} from "@jest/testUtilities"
import Dimensions, { rowFlavours } from "./dimensions"
import {
  getPopoverDimensionColumnWidth,
  getPopoverWidth,
  popoverGridColumns,
} from "./layout"

const getExpectedLayout = (names, infoColumn) => {
  const dimensionColumnWidth = getPopoverDimensionColumnWidth(names, { infoColumn })

  return {
    dimensionColumnWidth,
    gridColumns: `${dimensionColumnWidth}px ${popoverGridColumns.value} ${popoverGridColumns.unit} ${popoverGridColumns.anomaly} ${infoColumn}`,
    popoverWidth: getPopoverWidth(dimensionColumnWidth, infoColumn),
  }
}

const loadLinePayload = async (chart, ids, rows, { units = "requests/s" } = {}) => {
  const payload = makeHeatmapPayload(ids, rows)

  payload.view.chart_type = "line"
  payload.view.units = units
  payload.view.dimensions.grouped_by = []
  payload.view.dimensions.units = ids.map(() => units)

  chart.doneFetch(payload)
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe("line popover Dimensions", () => {
  it("shows all cropped heatmap buckets without generic more-values windowing", async () => {
    const ids = Array.from({ length: 14 }, (_, index) => String(index))
    const row = ids.map((_, index) => (index > 1 && index < 12 ? 1 : 0))
    const { chart } = makeTestChart({
      attributes: {
        chartType: "heatmap",
        groupBy: ["dimension"],
        selectedDimensions: [],
        selectedLegendDimensions: [],
      },
    })

    await loadHeatmapPayload(chart, ids, [row])
    chart.updateAttribute("hoverX", [1000, "6"])

    renderWithChart(<Dimensions />, { chart })

    expect(chart.getVisibleHeatmapIds()).toEqual(ids.slice(1, 13))
    expect(screen.queryByText(/more values/)).not.toBeInTheDocument()
    expect(screen.getAllByTestId("chartPopover-dimension")).toHaveLength(12)
    expect(screen.getAllByTestId("chartDimensions-name").map(node => node.textContent)).toEqual(
      ids.slice(1, 13)
    )
  })

  it("keeps generic more-values windowing for non-heatmap popovers", async () => {
    const ids = Array.from({ length: 12 }, (_, index) => `dim${index}`)
    const { chart } = makeTestChart({
      attributes: {
        chartType: "line",
        groupBy: [],
        selectedDimensions: [],
        selectedLegendDimensions: [],
      },
    })

    await loadLinePayload(
      chart,
      ids,
      [ids.map((_, index) => index)]
    )
    chart.updateAttribute("hoverX", [1000, "not-a-dimension"])

    renderWithChart(<Dimensions />, { chart })

    expect(screen.getByText(/more values/)).toBeInTheDocument()
    expect(screen.getAllByTestId("chartPopover-dimension")).toHaveLength(10)
  })

  it("keeps the complete list when the highlighted row is in the lower half", async () => {
    const ids = Array.from({ length: 10 }, (_, index) => `dim${index}`)
    const { chart } = makeTestChart({
      attributes: {
        chartType: "line",
        groupBy: [],
        selectedDimensions: [],
        selectedLegendDimensions: [],
      },
    })

    await loadLinePayload(
      chart,
      ids,
      [ids.map((_, index) => index)]
    )
    chart.updateAttribute("hoverX", [1000, "dim2"])

    renderWithChart(<Dimensions />, { chart })

    expect(screen.queryByText(/more values/)).not.toBeInTheDocument()
    expect(screen.getAllByTestId("chartDimensions-name").map(node => node.textContent)).toEqual(
      [...ids].reverse()
    )
  })

  it("uses fixed compact side columns for regular value popovers", async () => {
    const ids = ["very-long-dimension-name-that-should-not-expand-the-popover"]
    const { chart } = makeTestChart({
      attributes: {
        chartType: "line",
        groupBy: [],
        selectedDimensions: [],
        selectedLegendDimensions: [],
      },
    })

    await loadLinePayload(chart, ids, [[1]])
    chart.updateAttribute("hoverX", [1000, ids[0]])

    renderWithChart(<Dimensions />, { chart })

    const layout = getExpectedLayout(ids, popoverGridColumns.info)

    expect(screen.getByTestId("chartPopover-grid")).toHaveStyle(
      `grid-template-columns: ${layout.gridColumns}`
    )
    expect(screen.getByTestId("chartPopover-dimensions")).toHaveStyle(
      `width: ${layout.popoverWidth}px`
    )
    expect(screen.getByTestId("chartPopover-dimensionNameCell")).toHaveStyle(
      `min-width: ${popoverGridColumns.dimensionMin}`
    )
  })

  it("renders the formatted value and unit in separate popover cells", async () => {
    const ids = ["bytes"]
    const { chart } = makeTestChart({
      attributes: {
        chartType: "line",
        groupBy: [],
        selectedDimensions: [],
        selectedLegendDimensions: [],
      },
    })

    await loadLinePayload(chart, ids, [[1024]], { units: "By" })
    chart.updateAttribute("hoverX", [1000, ids[0]])

    renderWithChart(<Dimensions />, { chart })

    const valueCell = screen.getAllByTestId("chartDimensions-value")[0]
    const unitCell = screen.getByTestId("chartPopover-dimensionUnitCell")
    const unit = screen.getByTestId("chartDimensions-units")

    expect(valueCell).toHaveTextContent("1")
    expect(unit).toHaveTextContent("KiB")
    expect(unitCell).toContainElement(unit)
    expect(screen.queryByText("Unit", { exact: true })).not.toBeInTheDocument()
  })

  it("preserves the sign while scaling a popover value by magnitude", async () => {
    const ids = ["bytes"]
    const { chart } = makeTestChart({
      attributes: {
        chartType: "line",
        groupBy: [],
        selectedDimensions: [],
        selectedLegendDimensions: [],
      },
    })

    await loadLinePayload(chart, ids, [[-1536]], { units: "By" })
    chart.updateAttribute("hoverX", [1000, ids[0]])

    renderWithChart(<Dimensions />, { chart })

    expect(screen.getAllByTestId("chartDimensions-value")[0]).toHaveTextContent("-1.5")
    expect(screen.getByTestId("chartDimensions-units")).toHaveTextContent("KiB")
  })

  it("renders context, source units, timestamp, and both granularities in the header", async () => {
    const ids = ["latency"]
    const context = "storybook.units_scaling.really.long.context"
    const { chart } = makeTestChart({
      attributes: {
        chartType: "line",
        contextScope: [context],
        groupingMethod: "avg",
        groupBy: [],
        selectedDimensions: [],
        selectedLegendDimensions: [],
      },
    })
    const payload = makeHeatmapPayload(ids, [[1]], { timestamp: 1000 })

    payload.db.update_every = 5
    payload.view.chart_type = "line"
    payload.view.update_every = 60
    payload.view.units = "KiB"
    payload.view.dimensions.grouped_by = []
    payload.view.dimensions.units = ids.map(() => "KiB")

    chart.doneFetch(payload)
    await new Promise(resolve => setTimeout(resolve, 0))
    chart.updateAttribute("hoverX", [1000, ids[0]])

    renderWithChart(<Dimensions />, { chart })

    expect(screen.getByTestId("chartPopover-context")).toHaveTextContent(context)
    expect(screen.getByTestId("chartPopover-sourceUnits")).toHaveTextContent("[bytes]")
    expect(screen.getByTestId("chartPopover-timestamp")).not.toBeEmptyDOMElement()
    expect(screen.getByText("Granularity:")).toBeInTheDocument()
    expect(screen.getByText("5s")).toBeInTheDocument()
    expect(screen.getByText("View point:")).toBeInTheDocument()
    expect(screen.getByText("avg 60s")).toBeInTheDocument()
  })

  it("uses the wider fixed info column for annotation popovers", async () => {
    const ids = ["dim0"]
    const { chart } = makeTestChart({
      attributes: {
        chartType: "line",
        groupBy: [],
        selectedDimensions: [],
        selectedLegendDimensions: [],
      },
    })

    await loadLinePayload(chart, ids, [[1]])
    chart.updateAttribute("hoverX", [1000, rowFlavours.ANNOTATIONS])

    renderWithChart(<Dimensions />, { chart })

    const layout = getExpectedLayout(ids, popoverGridColumns.annotationsInfo)

    expect(screen.getByTestId("chartPopover-grid")).toHaveStyle(
      `grid-template-columns: ${layout.gridColumns}`
    )
    expect(screen.getByTestId("chartPopover-dimensions")).toHaveStyle(
      `width: ${layout.popoverWidth}px`
    )
  })
})
