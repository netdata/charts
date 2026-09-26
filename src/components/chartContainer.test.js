import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import ChartContainer from "./chartContainer"

describe("ChartContainer", () => {
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
    renderWithChart(<ChartContainer uiName="default" />)

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

  it("does not unmount a UI that moved to a newer container", () => {
    const { chart, unmount } = renderWithChart(<ChartContainer uiName="default" />)
    const chartUI = chart.getUI()
    const nextContainer = document.createElement("div")
    document.body.appendChild(nextContainer)

    act(() => {
      chartUI.unmount()
      chartUI.mount(nextContainer)
    })
    unmount()

    expect(chartUI.getElement()).toBe(nextContainer)

    chartUI.unmount()
    nextContainer.remove()
  })

  it("keeps the mounted element when the chart UI is replaced", () => {
    const { chart } = renderWithChart(<ChartContainer uiName="default" />)
    const container = screen.getByTestId("chartContent")

    expect(container.querySelector("canvas")).toBeInTheDocument()

    act(() => {
      chart.updateAttribute("chartLibrary", "number")
      chart.reconcileRenderer("number")
    })

    expect(chart.getUI().getElement()).toBe(container)
    expect(container.querySelector("canvas")).not.toBeInTheDocument()

    act(() => {
      chart.updateAttributes({ chartLibrary: "dygraph", chartType: "line" })
      chart.reconcileRenderer("line")
    })

    expect(chart.getUI().getElement()).toBe(container)
    expect(container.querySelector("canvas")).toBeInTheDocument()
  })
})
