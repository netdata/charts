import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import ValueWithUnit, { ValueUnitGrid, ValueUnitHeader } from "./valueWithUnit"

describe("ValueWithUnit", () => {
  it("renders one header for the value and unit subcolumns", () => {
    renderWithChart(<ValueUnitHeader label="Value" />)

    expect(screen.getByText("Value")).toHaveStyle("grid-column: 1/-1; text-align: center")
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

    const grids = screen.getAllByTestId("value-unit-grid")
    const units = screen.getAllByTestId("value-unit-cell")

    expect(grids[0]).toHaveTextContent("1B")
    expect(units[0]).toHaveTextContent("B")
    expect(grids[1]).toHaveTextContent("1KiB")
    expect(units[1]).toHaveTextContent("KiB")
    expect(grids[1]).toHaveStyle(
      "grid-template-columns: minmax(auto,1fr) minmax(40px,max-content)"
    )
    expect(units[1]).toHaveStyle({
      minWidth: "0px",
      padding: "0px 0px 0px 8px",
    })
  })

  it("supports units that belong to a derived value instead of the chart", () => {
    renderWithChart(<ValueWithUnit value={25.4} valueKey="percent" unit="%" />)

    expect(screen.getByTestId("value-unit-grid")).toHaveTextContent("25.40%")
    expect(screen.getByTestId("value-unit-cell")).toHaveTextContent("%")
  })

  it("renders details beneath the value subcolumn", () => {
    renderWithChart(<ValueUnitGrid value="99.5" unit="%" detail="Strong" />)

    const grid = screen.getByTestId("value-unit-grid")
    const detail = screen.getByTestId("value-unit-detail")

    expect(grid).toContainElement(detail)
    expect(grid).toHaveStyle(
      "grid-template-columns: minmax(auto,1fr) minmax(40px,max-content)"
    )
    expect(detail).toHaveStyle({
      margin: "4px 0px 0px",
      textAlign: "right",
    })
    expect(detail).toHaveTextContent("Strong")
  })
})
