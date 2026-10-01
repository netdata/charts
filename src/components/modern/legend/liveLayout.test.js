import React from "react"
import { act, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import { makePayload, makeWave } from "@/helpers/makeWavePayload"
import { Line } from "@/components/line"
import { getDateDiff } from "@/components/line/indicators"
import systemLoadLine from "../../../../fixtures/systemLoadLine"
import { maxLabelledSeries, resolveLegendMode } from "./mode"
import { formatCompactRange, formatShortDate } from "./compactRange"

const tick = () => new Promise(resolve => setTimeout(resolve, 0))

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

const renderLine = async (attributes, payload = systemLoadLine[0]) => {
  const { chart } = makeTestChart({ attributes })
  await act(async () => {
    chart.doneFetch(payload)
    await tick()
  })
  const result = renderWithChart(<Line />, { chart })
  await act(tick)
  return { ...result, chart }
}

const setHighlight = (chart, after, before) =>
  act(async () =>
    chart.updateAttribute("overlays", {
      ...chart.getAttribute("overlays"),
      highlight: { type: "highlight", range: [after, before], moveX: { after, before } },
    })
  )

describe("legend layout resolution", () => {
  it("treats auto like no choice", () => {
    ;[
      [300, 3],
      [640, 3],
      [640, 5],
      [1000, 3],
    ].forEach(([width, count]) =>
      expect(resolveLegendMode({ width, count, legendLayout: "auto" })).toBe(
        resolveLegendMode({ width, count })
      )
    )
  })

  it("accepts every named layout", () => {
    expect(resolveLegendMode({ width: 640, count: 3, legendLayout: "below" })).toBe("below")
    expect(resolveLegendMode({ width: 640, count: 3, legendLayout: "table" })).toBe("table")
    expect(resolveLegendMode({ width: 640, count: 3, legendLayout: "direct" })).toBe("direct")
    expect(resolveLegendMode({ width: 640, count: 3, legendLayout: "live" })).toBe("live")
  })

  it("falls back to the side table above the labelled series cap", () => {
    const over = maxLabelledSeries + 1

    expect(maxLabelledSeries).toBe(8)
    expect(resolveLegendMode({ width: 640, count: 8, legendLayout: "live" })).toBe("live")
    expect(resolveLegendMode({ width: 640, count: over, legendLayout: "live" })).toBe("table")
    expect(resolveLegendMode({ width: 640, count: over, legendLayout: "direct" })).toBe("table")
    expect(resolveLegendMode({ width: 640, count: 2000, legendLayout: "live" })).toBe("table")
  })

  it("counts visible series for the cap", () => {
    expect(
      resolveLegendMode({ width: 640, count: 2000, visibleCount: 3, legendLayout: "live" })
    ).toBe("live")
    expect(
      resolveLegendMode({ width: 640, count: 20, visibleCount: 9, legendLayout: "live" })
    ).toBe("table")
  })

  it("falls back like direct labels where line ends cannot be placed", () => {
    expect(
      resolveLegendMode({ width: 640, count: 3, legendLayout: "live", chartType: "stacked" })
    ).toBe("below")
    expect(
      resolveLegendMode({ width: 640, count: 3, legendLayout: "live", canPlaceDirect: false })
    ).toBe("below")
    expect(resolveLegendMode({ width: 640, count: 3, legendLayout: "live", heatmap: true })).toBe(
      "below"
    )
    expect(resolveLegendMode({ width: 640, count: 3, legendLayout: "live", sparkline: true })).toBe(
      "hidden"
    )
  })
})

describe("live legend layout", () => {
  it("renders the line-end labels on uPlot", async () => {
    const { chart } = await renderLine({
      designFlavour: "modern",
      legendLayout: "live",
      chartLibrary: "uplot",
    })

    expect(chart.getAttribute("legendMode")).toBe("live")
    expect(screen.getByTestId("modernBody")).toHaveAttribute("data-legend", "live")
    expect(screen.getByTestId("modernLegend-direct")).toBeInTheDocument()
    expect(screen.queryByTestId("modernLegend-line")).not.toBeInTheDocument()
  })

  it("renders the labels on dygraph too", async () => {
    const { chart } = await renderLine({
      designFlavour: "modern",
      legendLayout: "live",
      chartLibrary: "dygraph",
    })

    expect(chart.getAttribute("legendMode")).toBe("live")
    expect(screen.getByTestId("modernLegend-direct")).toBeInTheDocument()
  })

  it("switches to the side table above 8 visible series", async () => {
    const { chart } = await renderLine(
      { designFlavour: "modern", legendLayout: "live", chartLibrary: "uplot" },
      manyPayload(9)
    )

    expect(chart.getAttribute("legendMode")).toBe("table")
    expect(screen.getByTestId("modernLegend-table")).toBeInTheDocument()
    expect(screen.queryByTestId("modernLegend-direct")).not.toBeInTheDocument()
  })

  it("comes back to the labels once few enough series are visible", async () => {
    const payload = manyPayload(60)
    const { chart } = await renderLine(
      { designFlavour: "modern", legendLayout: "live", chartLibrary: "uplot" },
      payload
    )
    expect(chart.getAttribute("legendMode")).toBe("table")

    await act(async () => {
      chart.updateAttribute("selectedLegendDimensions", ["dim0", "dim1", "dim2"])
      await tick()
    })

    expect(chart.getAttribute("legendMode")).toBe("live")
    const column = screen.getByTestId("modernLegend-direct")
    const shown = within(column).queryAllByTestId("modernLegend-label")
    const area = chart.getUI().getPlotArea()
    const hiddenSlots = Math.max(0, Math.floor((area.top + area.height) / 16) - 3)
    // hidden series only get a row when it fits under the column
    expect(hiddenSlots).toBeLessThan(57)
    expect(shown).toHaveLength(3 + hiddenSlots)
    shown
      .filter(label => ["dim0", "dim1", "dim2"].includes(label.getAttribute("data-dimension")))
      .forEach(label => expect(label).toHaveStyle({ opacity: "1" }))
  })

  it("leaves the default flavour on the classic legend", async () => {
    const { chart } = await renderLine({ designFlavour: "default", legendLayout: "live" })

    expect(screen.queryByTestId("modernBody")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernLegend-direct")).not.toBeInTheDocument()
    expect(chart.getAttribute("legendMode")).toBeFalsy()
  })
})

describe("compact highlight range", () => {
  const sameDay = (chart, now) => {
    const after = Math.floor(now / 1000) - 7200
    return [after, after + 5]
  }

  it("drops the date when the range is today", async () => {
    const { chart } = makeTestChart({ attributes: { timezone: "UTC" } })
    const now = Date.UTC(2026, 8, 30, 12, 0, 0)
    const [after, before] = sameDay(chart, now)

    expect(formatCompactRange(chart, after, before, now)).toBe(
      `${chart.formatTime(after * 1000)}–${chart.formatTime(before * 1000)} 5s`
    )
  })

  it("names the day when the range is not today", async () => {
    const { chart } = makeTestChart({ attributes: { timezone: "UTC", locale: "en-US" } })
    const now = Date.UTC(2026, 9, 1, 12, 0, 0)
    const after = Date.UTC(2026, 8, 30, 6, 35, 2) / 1000
    const before = after + 5

    expect(formatShortDate(chart, after * 1000)).toBe("Wed Sep 30")
    expect(formatCompactRange(chart, after, before, now)).toBe("Wed Sep 30, 06:35:02–06:35:07 5s")
  })

  it("names both days when the range crosses midnight", async () => {
    const { chart } = makeTestChart({ attributes: { timezone: "UTC", locale: "en-US" } })
    const now = Date.UTC(2026, 9, 1, 12, 0, 0)
    const after = Date.UTC(2026, 8, 30, 23, 59, 0) / 1000
    const before = after + 120

    expect(formatCompactRange(chart, after, before, now)).toBe(
      `Wed Sep 30, 23:59:00–Thu Oct 01, 00:01:00 ${getDateDiff(after, before).join("")}`
    )
  })

  it("renders the modern chip on one line", async () => {
    const { chart } = await renderLine({ designFlavour: "modern", legendLayout: "below" })
    const after = Math.floor(Date.now() / 1000) - 60
    const before = after + 5

    await setHighlight(chart, after, before)

    const chip = screen.getByTestId("modernFooter-highlight")
    const range = within(chip).getByTestId("modernFooter-highlightRange")
    expect(chip).toHaveTextContent(
      `Highlight${chart.formatTime(after * 1000)}–${chart.formatTime(before * 1000)} 5s`
    )
    expect(range).toHaveTextContent(formatCompactRange(chart, after, before))
    expect(window.getComputedStyle(chip).whiteSpace).toBe("nowrap")
    expect(window.getComputedStyle(range).whiteSpace).toBe("nowrap")
    expect(window.getComputedStyle(range).textOverflow).toBe("ellipsis")
  })

  it("keeps the classic highlight range in the default footer", async () => {
    const { chart } = await renderLine({ designFlavour: "default" })
    const after = Math.floor(Date.now() / 1000) - 60
    const before = after + 5

    await setHighlight(chart, after, before)

    expect(screen.queryByTestId("modernFooter-highlight")).not.toBeInTheDocument()
    expect(screen.getByText("Highlight:")).toBeInTheDocument()
    expect(
      screen.getByText(`${chart.formatTime(after * 1000)} → ${chart.formatTime(before * 1000)}`)
    ).toBeInTheDocument()
    expect(screen.getByText(`${chart.formatDate(after * 1000)} •`)).toBeInTheDocument()
  })
})
