import React from "react"
import "@testing-library/jest-dom"
import {
  renderWithChart,
  makeTestChart,
  simulateTranslate,
  collectRenderErrors,
} from "@jest/testUtilities"
import Labels from "./labels"

describe("groupBoxes popover Labels", () => {
  it("survives page translation when convertedValue becomes -", () => {
    const ids = ["dimA"]
    const { chart } = makeTestChart({
      attributes: {
        viewDimensions: {
          ids,
          names: ids,
          priorities: [0],
          units: ["percentage"],
          contexts: [""],
        },
      },
    })
    chart.updateDimensions()
    chart.setUI({ getChartWidth: () => 300 })

    const { container, rerender } = renderWithChart(
      <Labels label="dimA" groupLabel="Group" data={[1700000000, 42.5]} id="dimA" />,
      { chart }
    )
    simulateTranslate(container)

    expect(
      collectRenderErrors(() =>
        rerender(<Labels label="dimA" groupLabel="Group" data={[1700000000]} id="dimA" />)
      )
    ).toEqual([])
    expect(container).toHaveTextContent("Group")
    expect(container).toHaveTextContent("-")
  })
})
