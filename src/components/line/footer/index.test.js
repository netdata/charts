import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeHeatmapPayload, makeTestChart, renderWithChart } from "@jest/testUtilities"
import Footer from "./index"

const ids = ["1", "2", "3"]

const renderFooter = async attributes => {
  const { chart } = makeTestChart({
    attributes: {
      chartType: "heatmap",
      groupBy: ["dimension"],
      selectedDimensions: [],
      selectedLegendDimensions: [],
      legend: true,
      legendMode: "below",
      ...attributes,
    },
  })
  await act(async () => {
    chart.doneFetch(makeHeatmapPayload(ids, [[1, 2, 3]]))
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  renderWithChart(<Footer />, { chart })
}

describe("heatmap footer legend", () => {
  it("lists the rows under the colour bar in the modern design by default", async () => {
    await renderFooter({ designFlavour: "modern" })

    expect(screen.getByTestId("heatmap-legend")).toBeInTheDocument()
    expect(screen.queryAllByTestId("modernLegend-entry").length).toBeGreaterThan(0)
  })

  it("keeps only the colour bar and the time with heatmapLegend colors, modern", async () => {
    await renderFooter({ designFlavour: "modern", heatmapLegend: "colors" })

    expect(screen.getByTestId("heatmap-legend")).toBeInTheDocument()
    expect(screen.queryAllByTestId("modernLegend-entry")).toHaveLength(0)
    expect(screen.getByTestId("modernFooter-time")).toBeInTheDocument()
  })

  it("lists the rows under the colour bar in the classic design by default", async () => {
    await renderFooter({ designFlavour: "default" })

    expect(screen.getByTestId("heatmap-legend")).toBeInTheDocument()
    expect(screen.getByTestId("chartLegend")).toBeInTheDocument()
  })

  it("keeps only the colour bar with heatmapLegend colors, classic", async () => {
    await renderFooter({ designFlavour: "default", heatmapLegend: "colors" })

    expect(screen.getByTestId("heatmap-legend")).toBeInTheDocument()
    expect(screen.queryByTestId("chartLegend")).not.toBeInTheDocument()
  })

  it("keeps legend entries out of text selection in both designs", async () => {
    await renderFooter({ designFlavour: "default" })
    screen
      .getAllByTestId("chartLegendDimension")
      .forEach(entry => expect(window.getComputedStyle(entry).userSelect).toBe("none"))

    await renderFooter({ designFlavour: "modern" })
    screen
      .getAllByTestId("modernLegend-entry")
      .forEach(entry => expect(window.getComputedStyle(entry).userSelect).toBe("none"))
  })
})
