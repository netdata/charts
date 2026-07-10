import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import ValueWithUnit, { ValueUnitHeader } from "./valueWithUnit"

describe("ValueWithUnit", () => {
  it("renders one header for the value and unit subcolumns", () => {
    renderWithChart(<ValueUnitHeader label="Value" />)

    expect(screen.getByText("Value")).toBeInTheDocument()
    expect(screen.queryByText("Unit")).not.toBeInTheDocument()
  })

  it("scales each value independently and renders its unit in a separate cell", () => {
    const { chart } = makeTestChart({
      attributes: {
        units: ["By"],
        desiredUnits: ["auto"],
        viewDimensions: {
          ids: ["bytes"],
          names: ["bytes"],
          units: ["By"],
          contexts: ["test.bytes"],
        },
        dimensionIds: ["bytes"],
        visibleDimensionIds: ["bytes"],
      },
    })

    chart.updateDimensions()
    renderWithChart(
      <>
        <ValueWithUnit value={1} dimensionId="bytes" />
        <ValueWithUnit value={1024} dimensionId="bytes" />
      </>,
      { chart }
    )

    const grids = screen.getAllByTestId("drawer-value-unit-grid")
    const units = screen.getAllByTestId("drawer-value-unit-cell")

    expect(grids[0]).toHaveTextContent("1B")
    expect(units[0]).toHaveTextContent("B")
    expect(grids[1]).toHaveTextContent("1KiB")
    expect(units[1]).toHaveTextContent("KiB")
    expect(grids[1]).toHaveStyle(
      "grid-template-columns: minmax(0,1fr) 44px"
    )
  })

  it("supports units that belong to a derived value instead of the chart", () => {
    renderWithChart(<ValueWithUnit value={25.4} valueKey="percent" unit="%" />)

    expect(screen.getByTestId("drawer-value-unit-grid")).toHaveTextContent("25.40%")
    expect(screen.getByTestId("drawer-value-unit-cell")).toHaveTextContent("%")
  })
})
