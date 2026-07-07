import React from "react"
import { fireEvent, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import Aggregate from "./aggregate"

describe("Aggregate", () => {
  it("offers percentage aggregation", () => {
    renderWithChart(<Aggregate />, {
      attributes: {
        aggregationMethod: "avg",
      },
    })

    fireEvent.click(screen.getByRole("button"))

    expect(screen.getByText("Average")).toBeInTheDocument()
    expect(screen.getByText("Sum")).toBeInTheDocument()
    expect(screen.getByText("Percentage")).toBeInTheDocument()
    expect(screen.getByText("Minimum")).toBeInTheDocument()
  })

  it("selects percentage aggregation", () => {
    const { chart } = renderWithChart(<Aggregate />, {
      attributes: {
        aggregationMethod: "avg",
      },
    })

    fireEvent.click(screen.getByRole("button"))
    fireEvent.click(screen.getByText("Percentage"))

    expect(chart.getAttribute("aggregationMethod")).toBe("percentage")
  })

  it("shows percentage as selected", () => {
    const { chart } = makeTestChart()
    chart.updateAttribute("aggregationMethod", "percentage")

    renderWithChart(<Aggregate />, { chart })

    expect(screen.getByRole("button")).toHaveAttribute("data-value", "percentage")
    expect(screen.getByText("PCT()")).toBeInTheDocument()
  })
})
