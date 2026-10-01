import React from "react"
import { act, fireEvent, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import { makePayload, makeWave } from "@/helpers/makeWavePayload"
import { Line } from "@/components/line"
import Popover from "@/components/line/popover"
import { formatReadout } from "@/components/modern/format"
import systemLoadLine from "../../../../fixtures/systemLoadLine"
import { resolveLegendMode } from "./mode"
import { getWindowStats } from "./useLegendRows"
import { layoutLabels } from "./directLabels"
import { nextSort } from "./legendTable"
import { pickShown } from "./tooltip"

const tick = () => new Promise(resolve => setTimeout(resolve, 0))
const waitForFrame = () => new Promise(resolve => window.requestAnimationFrame(() => resolve()))

const manyPayload = count =>
  makePayload({
    context: "test.many",
    title: "Many",
    unit: "percentage",
    dimensions: Array.from({ length: count }, (_, index) => ({
      id: `dim${index}`,
      values: makeWave({ center: 10 + index * 5, amplitude: 2, phase: index }),
    })),
  })

const loadChart = async (attributes = {}, payload = systemLoadLine[0]) => {
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

describe("resolveLegendMode", () => {
  it("follows pickLegend by width and count", () => {
    expect(resolveLegendMode({ width: 300, count: 3 })).toBe("hidden")
    expect(resolveLegendMode({ width: 640, count: 3 })).toBe("direct")
    expect(resolveLegendMode({ width: 640, count: 5 })).toBe("below")
    expect(resolveLegendMode({ width: 1000, count: 3 })).toBe("table")
  })

  it("honours a forced layout and ignores unknown values", () => {
    expect(resolveLegendMode({ width: 300, count: 3, legendLayout: "table" })).toBe("table")
    expect(resolveLegendMode({ width: 640, count: 5, legendLayout: "nope" })).toBe("below")
  })

  it("hides the legend when the legend attribute is off or on sparklines", () => {
    expect(resolveLegendMode({ width: 1000, count: 3, legend: false })).toBe("hidden")
    expect(resolveLegendMode({ width: 1000, count: 3, sparkline: true })).toBe("hidden")
  })

  it("falls back to the one-line legend where direct labels cannot be placed", () => {
    expect(resolveLegendMode({ width: 640, count: 3, chartType: "stacked" })).toBe("below")
    expect(resolveLegendMode({ width: 640, count: 3, canPlaceDirect: false })).toBe("below")
    expect(resolveLegendMode({ width: 1000, count: 3, heatmap: true })).toBe("below")
  })

  it("has no one-line legend without a footer", () => {
    expect(resolveLegendMode({ width: 640, count: 5, hasFooter: false })).toBe("hidden")
  })
})

describe("legend helpers", () => {
  it("cycles each sortable column between its two directions", () => {
    expect(nextSort("name", "default")).toBe("nameAsc")
    expect(nextSort("name", "nameAsc")).toBe("nameDesc")
    expect(nextSort("value", "valueDesc")).toBe("valueAsc")
    expect(nextSort("anomaly", "valueAsc")).toBe("anomalyDesc")
  })

  it("keeps direct labels apart and inside the plot", () => {
    const placed = layoutLabels(
      [
        { id: "a", y: 50 },
        { id: "b", y: 52 },
        { id: "c", y: 99 },
      ],
      100
    )

    expect(placed.map(label => label.id)).toEqual(["a", "b", "c"])
    expect(placed[1].top - placed[0].top).toBeGreaterThanOrEqual(16)
    expect(placed[2].top + 16).toBeLessThanOrEqual(100)
  })

  it("keeps the hovered row visible past the cut", () => {
    const rows = Array.from({ length: 9 }, (_, index) => ({ id: `r${index}` }))

    expect(pickShown(rows, "r2").map(row => row.id)).toEqual(["r0", "r1", "r2", "r3", "r4", "r5"])
    expect(pickShown(rows, "r8").map(row => row.id)).toEqual(["r0", "r1", "r2", "r3", "r4", "r8"])
  })

  it("reads window mean and max from the query stats", async () => {
    const payload = manyPayload(2)
    const { chart } = await loadChart({}, payload)
    const stats = getWindowStats(chart)
    const [first] = payload.summary.dimensions

    expect(stats.dim0.mean).toBeCloseTo(first.sts.avg)
    expect(stats.dim0.max).toBeCloseTo(first.sts.max)
  })
})

describe("modern line legend", () => {
  it("leaves the default flavour without any modern element", async () => {
    await renderLine({ designFlavour: "default" })

    expect(screen.queryByTestId("modernBody")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernFooter-actions")).not.toBeInTheDocument()
    expect(screen.getAllByTestId("chartLegend").length).toBeGreaterThan(0)
    expect(screen.getByTestId("chartDimensionSort")).toBeInTheDocument()
    expect(screen.getByTestId("chartExpander")).toHaveTextContent("Expand - Compare Periods")
  })

  it("leaves the minimal flavour without any modern element", async () => {
    await renderLine({ designFlavour: "minimal" })

    expect(screen.queryByTestId("modernBody")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernLegend-line")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartDimensionSort")).not.toBeInTheDocument()
  })

  it("renders the side table with every dimension and the window stats", async () => {
    const { chart } = await renderLine({ designFlavour: "modern", legendLayout: "table" })

    expect(chart.getAttribute("legendMode")).toBe("table")
    const table = screen.getByTestId("modernLegend-table")
    expect(within(table).getAllByTestId("modernLegend-row")).toHaveLength(3)
    expect(within(table).getByText("Last")).toBeInTheDocument()
    expect(within(table).getByText("Mean")).toBeInTheDocument()
    expect(within(table).getByText("Max")).toBeInTheDocument()
    expect(within(table).getByText("Anomaly")).toHaveAttribute("title", "Anomaly rate")
    expect(screen.queryByTestId("chartLegendDimension")).not.toBeInTheDocument()
  })

  it("turns the table into the readout while hovering", async () => {
    const { chart } = await renderLine({ designFlavour: "modern", legendLayout: "table" })
    const { all } = chart.getPayload()
    const row = 5
    const [timestamp] = all[row]

    await act(async () => chart.updateAttribute("hoverX", [timestamp, "load1"]))

    expect(screen.getByText("At cursor")).toBeInTheDocument()
    expect(screen.getByTestId("modernLegend-time")).toHaveTextContent(chart.formatTime(timestamp))
    const load1 = screen
      .getAllByTestId("modernLegend-row")
      .find(node => node.getAttribute("data-dimension") === "load1")
    const hovered = formatReadout(
      chart,
      chart.getDimensionValue("load1", row, { abs: false, allowNull: true }),
      { dimensionId: "load1" }
    )
    expect(load1).toHaveTextContent(hovered)
  })

  it("sorts from the table headers", async () => {
    const { chart } = await renderLine({ designFlavour: "modern", legendLayout: "table" })

    fireEvent.click(screen.getByTestId("modernLegend-sort-name"))
    expect(chart.getAttribute("dimensionsSort")).toBe("nameAsc")
    fireEvent.click(screen.getByTestId("modernLegend-sort-value"))
    expect(chart.getAttribute("dimensionsSort")).toBe("valueDesc")
  })

  it("renders the one-line legend in the footer and toggles dimensions", async () => {
    const { chart } = await renderLine({ designFlavour: "modern", legendLayout: "below" })

    const entries = within(screen.getByTestId("modernLegend-line")).getAllByTestId(
      "modernLegend-entry"
    )
    expect(entries).toHaveLength(3)

    fireEvent.click(entries[0])
    const [first] = chart.getDimensionIds()
    expect(chart.getAttribute("selectedLegendDimensions")).toEqual([first])

    const second = chart.getDimensionIds()[1]
    const secondEntry = screen
      .getAllByTestId("modernLegend-entry")
      .find(node => node.getAttribute("data-dimension") === second)
    fireEvent.click(secondEntry, { shiftKey: true })
    expect(chart.getAttribute("selectedLegendDimensions")).toEqual([first, second])
  })

  it("dims the other series while a legend entry is hovered", async () => {
    const { chart } = await renderLine({ designFlavour: "modern", legendLayout: "below" })
    const [entry] = screen.getAllByTestId("modernLegend-entry")

    fireEvent.mouseEnter(entry)
    expect(chart.getAttribute("focusedDimensionId")).toBe(entry.getAttribute("data-dimension"))
    fireEvent.mouseLeave(entry)
    expect(chart.getAttribute("focusedDimensionId")).toBeNull()
  })

  it("renders direct labels beside the plot", async () => {
    await renderLine({ designFlavour: "modern", legendLayout: "direct" })

    expect(screen.getByTestId("modernLegend-direct")).toBeInTheDocument()
    expect(screen.queryByTestId("modernLegend-line")).not.toBeInTheDocument()
  })

  it("places direct labels at the uPlot line ends", async () => {
    const { chart } = await renderLine({
      designFlavour: "modern",
      legendLayout: "direct",
      chartLibrary: "uplot",
    })
    await act(async () => {
      chart.getUI().trigger("rendered")
      await tick()
    })

    const labels = within(screen.getByTestId("modernLegend-direct")).getAllByTestId(
      "modernLegend-label"
    )
    expect(labels).toHaveLength(3)
    labels.forEach(label => expect(label.style.top).toMatch(/px$/))
  })

  it("shows no legend on tiles but keeps the drawer action", async () => {
    await renderLine({ designFlavour: "modern", legendLayout: "hidden" })

    expect(screen.queryByTestId("modernLegend-line")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernLegend-table")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernLegend-direct")).not.toBeInTheDocument()
    expect(screen.getByTestId("chartExpander")).toHaveTextContent("Compare, drill down, correlate")
  })

  it("opens the drawer from the modern expander", async () => {
    const { chart } = await renderLine({ designFlavour: "modern", legendLayout: "below" })

    fireEvent.click(screen.getByTestId("chartExpander"))
    expect(chart.getAttribute("expanded")).toBe(true)
    expect(screen.getByTestId("chartExpander")).toHaveTextContent("Collapse")
  })

  it("keeps the highlight range and its zoom action", async () => {
    const { chart } = await renderLine({ designFlavour: "modern", legendLayout: "below" })
    const after = Math.floor(Date.now() / 1000) - 600
    const before = after + 120

    await act(async () =>
      chart.updateAttribute("overlays", {
        ...chart.getAttribute("overlays"),
        highlight: { type: "highlight", range: [after, before], moveX: { after, before } },
      })
    )

    fireEvent.click(screen.getByTestId("modernFooter-highlight"))
    expect(chart.getAttribute("after")).toBe(after)
    expect(chart.getAttribute("before")).toBe(before)
  })

  it("shows the latest and hovered time in the footer", async () => {
    const { chart } = await renderLine({ designFlavour: "modern", legendLayout: "below" })
    expect(screen.getByTestId("modernFooter-time")).toHaveTextContent(/^Latest/)

    const [timestamp] = chart.getPayload().all[3]
    await act(async () => chart.updateAttribute("hoverX", [timestamp, "load1"]))
    expect(screen.getByTestId("modernFooter-time")).toHaveTextContent(/^Hovering/)
  })
})

describe("modern hover", () => {
  const hover = async chart => {
    await act(async () => {
      chart.getUI().trigger("mousemove", { clientX: 100, clientY: 80 })
      await waitForFrame()
    })
  }

  it("does not open the popover while a modern legend is the readout", async () => {
    const { chart } = await loadChart({ designFlavour: "modern", legendMode: "table" })
    renderWithChart(<Popover />, { chart })

    await hover(chart)
    expect(screen.queryByTestId("drop")).not.toBeInTheDocument()
  })

  it("shows the compact tooltip when the legend is hidden", async () => {
    const { chart } = await loadChart(
      { designFlavour: "modern", legendMode: "hidden" },
      manyPayload(9)
    )
    const [timestamp] = chart.getPayload().all[10]
    chart.updateAttribute("hoverX", [timestamp, "dim0"])
    renderWithChart(<Popover />, { chart })

    await hover(chart)
    const tooltip = screen.getByTestId("modernTooltip")
    expect(within(tooltip).getAllByTestId("modernTooltip-name")).toHaveLength(6)
    expect(within(tooltip).getByTestId("modernTooltip-more")).toHaveTextContent("3 more")
    expect(within(tooltip).getByTestId("modernTooltip-granularity")).toHaveTextContent(
      "Granularity"
    )
    expect(within(tooltip).getByTestId("modernTooltip-time")).toHaveTextContent(
      chart.formatTime(timestamp)
    )
    expect(screen.queryByTestId("chartPopover-dimensions")).not.toBeInTheDocument()
  })

  it("keeps the classic popover for the default flavour", async () => {
    const { chart } = await loadChart({ designFlavour: "default", legendMode: "table" })
    renderWithChart(<Popover />, { chart })

    await hover(chart)
    expect(screen.getByTestId("chartPopover-dimensions")).toBeInTheDocument()
    expect(screen.queryByTestId("modernTooltip")).not.toBeInTheDocument()
  })
})

describe("legend layout chosen at runtime", () => {
  it("follows a legendLayout change on a mounted chart, like a user setting", async () => {
    const { chart } = await renderLine({ designFlavour: "modern", legendLayout: "below" })
    expect(await screen.findByTestId("modernLegend-line")).toBeInTheDocument()

    act(() => chart.updateAttribute("legendLayout", "table"))
    expect(await screen.findByTestId("modernLegend-table")).toBeInTheDocument()
    expect(screen.queryByTestId("modernLegend-line")).not.toBeInTheDocument()

    act(() => chart.updateAttribute("legendLayout", "below"))
    expect(await screen.findByTestId("modernLegend-line")).toBeInTheDocument()
  })

  it("follows a change set on the SDK root, which is how the app applies settings", async () => {
    const { chart } = await renderLine({ designFlavour: "modern", legendLayout: "below" })
    expect(await screen.findByTestId("modernLegend-line")).toBeInTheDocument()

    act(() => chart.sdk.getNodes().forEach(node => node.updateAttribute("legendLayout", "table")))
    expect(await screen.findByTestId("modernLegend-table")).toBeInTheDocument()
  })
})
