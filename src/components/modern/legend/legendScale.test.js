import React from "react"
import { act, fireEvent, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import { makePayload, makeWave } from "@/helpers/makeWavePayload"
import { Line } from "@/components/line"
import Popover from "@/components/line/popover"
import { formatReadout } from "@/components/modern/format"
import { useLegendRows } from "./useLegendRows"
import { lineEntryCap } from "./legendLine"
import { tableRowHeight } from "./legendTable"

const tick = () => new Promise(resolve => setTimeout(resolve, 0))
const waitForFrame = () => new Promise(resolve => window.requestAnimationFrame(() => resolve()))

const manyPayload = count =>
  makePayload({
    context: "test.many",
    title: "Many",
    unit: "percentage",
    dimensions: Array.from({ length: count }, (_, index) => ({
      id: `dim${index}`,
      values: makeWave({ center: 10 + (index % 50) * 1.37, amplitude: 2, phase: index }),
    })),
  })

const loadChart = async (attributes = {}, payload) => {
  const { chart, sdk } = makeTestChart({ attributes })
  await act(async () => {
    chart.doneFetch(payload)
    await tick()
  })
  return { chart, sdk }
}

const renderLine = async (attributes, payload) => {
  const { chart } = await loadChart(attributes, payload)
  const result = renderWithChart(<Line />, { chart })
  await act(tick)
  return { ...result, chart }
}

const hoverRow = async (chart, row, id) => {
  const [timestamp] = chart.getPayload().all[row]
  await act(async () => chart.updateAttribute("hoverX", [timestamp, id]))
}

const count = 2000
const bigPayload = manyPayload(count)
const latestValue = (chart, id) =>
  chart.getDimensionValue(id, chart.getPayload().data.length - 1, { abs: false, allowNull: true })

const defaultValue = (chart, value, dimensionId) =>
  chart.getConvertedValue(value, {
    dimensionId,
    unitAttributes: chart.getUnitAttributesForValue(value, { dimensionId }),
  })

const defaultUnit = (chart, value, dimensionId) =>
  chart.getUnitSign({
    dimensionId,
    unitAttributes: chart.getUnitAttributesForValue(value, { dimensionId }),
  })

describe("modern legend at scale", () => {
  it("renders a bounded window of side table rows for thousands of dimensions", async () => {
    const { chart } = await renderLine(
      { designFlavour: "modern", legendLayout: "table" },
      bigPayload
    )
    expect(chart.getDimensionIds()).toHaveLength(count)

    const table = screen.getByTestId("modernLegend-table")
    const rendered = within(table).getAllByTestId("modernLegend-row").length
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThanOrEqual(50)

    const [spacer] = within(table).getAllByTestId("modernLegend-spacer")
    expect(parseFloat(spacer.style.height)).toBe((count - rendered) * tableRowHeight)

    await hoverRow(chart, 20, "dim0")
    expect(within(table).getAllByTestId("modernLegend-row").length).toBe(rendered)
    expect(screen.getByText("At cursor")).toBeInTheDocument()
  })

  it("caps the one-line legend and opens the drawer values for the rest", async () => {
    const { chart } = await renderLine(
      { designFlavour: "modern", legendLayout: "below", expandable: true },
      bigPayload
    )

    const line = screen.getByTestId("modernLegend-line")
    expect(within(line).getAllByTestId("modernLegend-entry")).toHaveLength(lineEntryCap)
    const more = within(line).getByTestId("modernLegend-more")
    expect(more).toHaveTextContent(`+${count - lineEntryCap} more`)

    fireEvent.click(more)
    expect(chart.getAttribute("expanded")).toBe(true)
    expect(chart.getAttribute("drawer.action")).toBe("values")
  })

  it("switches to the side table when there is no drawer", async () => {
    const { chart } = await renderLine(
      { designFlavour: "modern", legendLayout: "below", expandable: false },
      bigPayload
    )

    fireEvent.click(screen.getByTestId("modernLegend-more"))
    expect(chart.getAttribute("legendLayout")).toBe("table")
    expect(screen.getByTestId("modernLegend-table")).toBeInTheDocument()
  })

  it("shows no more button when every entry fits", async () => {
    await renderLine({ designFlavour: "modern", legendLayout: "below" }, manyPayload(5))

    expect(screen.getAllByTestId("modernLegend-entry")).toHaveLength(5)
    expect(screen.queryByTestId("modernLegend-more")).not.toBeInTheDocument()
  })

  it("keeps the compact tooltip to six formatted rows", async () => {
    const { chart } = await loadChart({ designFlavour: "modern", legendMode: "hidden" }, bigPayload)
    const [timestamp] = chart.getPayload().all[10]
    chart.updateAttribute("hoverX", [timestamp, "dim0"])
    renderWithChart(<Popover />, { chart })

    await act(async () => {
      chart.getUI().trigger("mousemove", { clientX: 100, clientY: 80 })
      await waitForFrame()
    })

    const tooltip = screen.getByTestId("modernTooltip")
    expect(within(tooltip).getAllByTestId("modernTooltip-name")).toHaveLength(6)
    expect(within(tooltip).getByTestId("modernTooltip-more")).toHaveTextContent(`${count - 6} more`)
  })
})

describe("window stats cache", () => {
  const Probe = ({ seen }) => {
    const { stats, getRow, ids } = useLegendRows({ withStats: true, withRows: false })
    seen.push({ stats, row: getRow(ids[0]) })
    return null
  }

  it("keeps the window stats across hover moves and rebuilds them with a new payload", async () => {
    const { chart } = await loadChart({ designFlavour: "modern" }, manyPayload(3))
    const seen = []
    renderWithChart(<Probe seen={seen} />, { chart })

    const first = seen[seen.length - 1]
    await hoverRow(chart, 10, "dim0")
    const hovered = seen[seen.length - 1]

    expect(seen.length).toBeGreaterThan(1)
    expect(hovered.stats).toBe(first.stats)
    expect(hovered.row.mean).toBe(first.row.mean)
    expect(hovered.row.value).not.toBe(first.row.value)

    await act(async () => {
      chart.doneFetch(manyPayload(3))
      await tick()
    })
    expect(seen[seen.length - 1].stats).not.toBe(first.stats)
  })
})

describe("modern readout formatting", () => {
  it("formats table means and maxes per value, each with its own unit", async () => {
    const { chart } = await renderLine(
      { designFlavour: "modern", legendLayout: "table" },
      manyPayload(3)
    )
    const stats = chart.getAttribute("viewDimensions").sts
    const row = screen
      .getAllByTestId("modernLegend-row")
      .find(node => node.getAttribute("data-dimension") === "dim1")
    const index = chart.getDimensionIndex("dim1")

    expect(row).toHaveTextContent(formatReadout(chart, stats.avg[index], { dimensionId: "dim1" }))
    expect(row).toHaveTextContent(formatReadout(chart, stats.max[index], { dimensionId: "dim1" }))
    expect(row).toHaveTextContent(defaultUnit(chart, stats.max[index], "dim1"))
  })

  it("formats the one-line legend like the default per-value readout", async () => {
    const { chart } = await renderLine(
      { designFlavour: "modern", legendLayout: "below" },
      manyPayload(3)
    )
    screen.getAllByTestId("modernLegend-entry").forEach(entry => {
      const id = entry.getAttribute("data-dimension")
      const value = latestValue(chart, id)
      expect(entry).toHaveTextContent(defaultValue(chart, value, id))
      expect(entry).toHaveTextContent(defaultUnit(chart, value, id))
    })
  })

  it("formats the direct labels like the default per-value readout", async () => {
    const { chart } = await renderLine(
      { designFlavour: "modern", legendLayout: "direct", chartLibrary: "uplot" },
      manyPayload(3)
    )
    await act(async () => {
      chart.getUI().trigger("rendered")
      await tick()
    })

    const labels = screen.getAllByTestId("modernLegend-label")
    expect(labels).toHaveLength(3)
    labels.forEach(label => {
      const id = label.getAttribute("data-dimension")
      const value = latestValue(chart, id)
      expect(label).toHaveTextContent(defaultValue(chart, value, id))
    })
  })
})

describe("side table columns", () => {
  it("labels the anomaly column in full and lets the name column give way", async () => {
    await renderLine({ designFlavour: "modern", legendLayout: "table" }, manyPayload(3))

    const header = screen.getByTestId("modernLegend-sort-anomaly")
    expect(header).toHaveTextContent(/^Anomaly$/)
    expect(header).toHaveAttribute("title", "Anomaly rate")

    const [nameCell] = screen.getAllByTestId("modernLegend-row")[0].children
    expect(window.getComputedStyle(nameCell).maxWidth).toBe("0")
    expect(window.getComputedStyle(nameCell).width).toBe("100%")
    expect(window.getComputedStyle(screen.getByTestId("modernLegend-scroller")).overflowX).toBe(
      "hidden"
    )
    expect(window.getComputedStyle(screen.getByTestId("modernLegend-table")).overflow).toBe(
      "hidden"
    )
  })
})
