import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import StatValue from "./statValue"

const makeUnitChart = unit => {
  const { chart } = makeTestChart({
    attributes: {
      units: [unit],
      desiredUnits: ["auto"],
      viewDimensions: {
        ids: ["value"],
        names: ["value"],
        units: [unit],
        contexts: ["test.value"],
      },
      dimensionIds: ["value"],
      visibleDimensionIds: ["value"],
    },
  })

  chart.updateDimensions()
  return chart
}

describe("Comparison StatValue", () => {
  it("scales every value independently and renders its unit", () => {
    const chart = makeUnitChart("By")

    renderWithChart(
      <>
        <StatValue value={1} valueKey="avg" />
        <StatValue value={1024} valueKey="max" />
      </>,
      { chart }
    )

    const values = screen.getAllByTestId("comparison-stat-value")
    const units = screen.getAllByTestId("comparison-stat-unit")

    expect(values[0]).toHaveTextContent("1B")
    expect(units[0]).toHaveTextContent("B")
    expect(values[1]).toHaveTextContent("1KiB")
    expect(units[1]).toHaveTextContent("KiB")
  })

  it("renders integrated rate values without the per-second denominator", () => {
    const chart = makeUnitChart("By/s")

    renderWithChart(<StatValue value={1048576} valueKey="volume" />, { chart })

    expect(screen.getByTestId("comparison-stat-value")).toHaveTextContent("1MiB")
    expect(screen.getByTestId("comparison-stat-unit")).toHaveTextContent("MiB")
    expect(screen.queryByText("MiB/s")).not.toBeInTheDocument()
  })
})
