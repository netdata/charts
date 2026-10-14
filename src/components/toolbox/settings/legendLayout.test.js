import React from "react"
import { fireEvent, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import LegendLayout from "./legendLayout"

describe("chart legend layout setting", () => {
  it("lets the chart pick its layout while the global one is automatic", () => {
    renderWithChart(<LegendLayout />, {
      attributes: { designFlavour: "modern", legendLayout: "auto", chartLegendLayout: "live" },
    })

    expect(screen.getByText("Live edge")).toBeInTheDocument()
    expect(screen.queryByTestId("chartSettings-legendLayout-locked")).not.toBeInTheDocument()
  })

  it("shows the global layout, locked, when the personal setting fixes it", () => {
    renderWithChart(<LegendLayout />, {
      attributes: { designFlavour: "modern", legendLayout: "below", chartLegendLayout: "live" },
    })

    expect(screen.getByTestId("chartSettings-legendLayout-locked")).toBeInTheDocument()
    expect(screen.getByText("Below the chart")).toBeInTheDocument()
    expect(screen.queryByText("Live edge")).not.toBeInTheDocument()
  })

  it("explains when the chart cannot draw a live edge", () => {
    renderWithChart(<LegendLayout />, {
      attributes: {
        designFlavour: "modern",
        legendLayout: "auto",
        chartLegendLayout: "live",
        chartType: "stacked",
      },
    })

    expect(screen.getByTestId("chartSettings-legendLayout-hint")).toHaveTextContent(
      "Live edge needs a line or area chart with up to 8 series"
    )
  })

  it("disables live edge in the list on charts that cannot draw it", () => {
    renderWithChart(<LegendLayout />, {
      attributes: { designFlavour: "modern", legendLayout: "auto", chartType: "stacked" },
    })

    fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" })

    const live = screen.getByText("Live edge").closest("[aria-disabled]")
    expect(live).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByText("Below the chart").closest("[aria-disabled]")).toHaveAttribute(
      "aria-disabled",
      "false"
    )
  })

  it("stays quiet when the chart can draw a live edge", () => {
    renderWithChart(<LegendLayout />, {
      attributes: {
        designFlavour: "modern",
        legendLayout: "auto",
        chartLegendLayout: "live",
        chartType: "line",
      },
    })

    expect(screen.queryByTestId("chartSettings-legendLayout-hint")).not.toBeInTheDocument()
  })

  it("stays out of the default design, which has no legend layouts", () => {
    renderWithChart(<LegendLayout />, { attributes: { legendLayout: "auto" } })

    expect(screen.queryByText("Legend")).not.toBeInTheDocument()
  })
})
