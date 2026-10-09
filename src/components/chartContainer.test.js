import React from "react"
import { act, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import ChartContainer from "./chartContainer"

describe("ChartContainer", () => {
  it("remounts the current renderer in the same container and cleans up its own UI", async () => {
    const { sdk, chart } = makeTestChart({ attributes: { autoPlay: false } })
    await chart.fetch()
    await waitFor(() => expect(chart.getAttribute("loaded")).toBe(true))
    const { unmount } = renderWithChart(<ChartContainer />, { chart })
    const element = screen.getByTestId("chartContent")
    const dygraph = chart.getUI()
    expect(dygraph.getElement()).toBe(element)
    act(() => sdk.getRoot().updateAttribute("timeSeriesRenderer", "uplot"))
    const uplot = chart.getUI()
    await waitFor(() => expect(uplot.getElement()).toBe(element))
    expect(uplot.getUPlot()).not.toBeNull()
    expect(dygraph.getElement()).toBeNull()
    act(() => sdk.getRoot().updateAttribute("timeSeriesRenderer", null))
    const restored = chart.getUI()
    await waitFor(() => expect(restored.getElement()).toBe(element))
    expect(restored.getDygraph()).not.toBeNull()
    expect(uplot.getElement()).toBeNull()
    unmount()
    expect(restored.getElement()).toBeNull()
    chart.destroy()
  })

  it("renders container with data-testid", () => {
    renderWithChart(<ChartContainer uiName="default" />)

    expect(screen.getByTestId("chartContent")).toBeInTheDocument()
  })

  it("passes additional props to Flex container", () => {
    renderWithChart(
      <ChartContainer uiName="default" className="custom-class" data-custom="value" />
    )

    const container = screen.getByTestId("chartContent")
    expect(container).toHaveClass("custom-class")
    expect(container).toHaveAttribute("data-custom", "value")
  })

  it("sets correct default styles", () => {
    renderWithChart(<ChartContainer uiName="default" />)

    const container = screen.getByTestId("chartContent")
    expect(container).toHaveStyle({ overflow: "hidden" })
    expect(container).toHaveAttribute("height", "100%")
    expect(container).toHaveAttribute("width", "100%")
  })

  it("renders with custom dimensions", () => {
    renderWithChart(<ChartContainer uiName="default" width="200px" height="300px" />)

    const container = screen.getByTestId("chartContent")
    expect(container).toHaveAttribute("width", "200px")
    expect(container).toHaveAttribute("height", "300px")
  })

  it("renders chart canvas when mounted", () => {
    renderWithChart(<ChartContainer uiName="default" />, { attributes: { loaded: true } })

    const container = screen.getByTestId("chartContent")
    const canvas = container.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
  })

  it("applies flex properties", () => {
    renderWithChart(
      <ChartContainer uiName="default" alignItems="center" justifyContent="center" column />
    )

    const container = screen.getByTestId("chartContent")
    expect(container).toHaveStyle({
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
    })
  })
})
