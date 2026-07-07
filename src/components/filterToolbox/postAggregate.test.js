import React from "react"
import { fireEvent, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import PostAggregate from "./postAggregate"

describe("PostAggregate", () => {
  it("offers percentage post aggregation", () => {
    renderWithChart(<PostAggregate />, {
      attributes: {
        postAggregationMethod: "avg",
      },
    })

    fireEvent.click(screen.getByRole("button"))

    expect(screen.getByText("Average")).toBeInTheDocument()
    expect(screen.getByText("Sum")).toBeInTheDocument()
    expect(screen.getByText("Percentage")).toBeInTheDocument()
    expect(screen.getByText("Minimum")).toBeInTheDocument()
  })

  it("selects percentage post aggregation", () => {
    const { chart } = renderWithChart(<PostAggregate />, {
      attributes: {
        postAggregationMethod: "avg",
      },
    })

    fireEvent.click(screen.getByRole("button"))
    fireEvent.click(screen.getByText("Percentage"))

    expect(chart.getAttribute("postAggregationMethod")).toBe("percentage")
  })

  it("shows percentage as selected", () => {
    const { chart } = makeTestChart()
    chart.updateAttribute("postAggregationMethod", "percentage")

    renderWithChart(<PostAggregate />, { chart })

    expect(screen.getByRole("button")).toHaveAttribute("data-value", "percentage")
    expect(screen.getByText("PCT()")).toBeInTheDocument()
  })
})
