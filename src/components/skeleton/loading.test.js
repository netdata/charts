import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import { BarsChart } from "@/components/bars"
import { NumberChart } from "@/components/number"
import { TableChart } from "@/components/table"
import LegendTable from "@/components/modern/legend/legendTable"
import systemLoadLine from "../../../fixtures/systemLoadLine"

const cases = [
  ["bars", BarsChart, "barsSkeleton"],
  ["number", NumberChart, "numberSkeleton"],
  ["table", TableChart, "tableRowsSkeleton"],
]

const loadChart = async chart => {
  await act(async () => {
    await chart.fetch()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

describe("loading skeletons", () => {
  it.each(cases)(
    "shows the %s skeleton until the first data arrives",
    async (chartLibrary, Component, testId) => {
      const { chart } = makeTestChart({
        mockData: systemLoadLine[0],
        attributes: { chartLibrary, designFlavour: "modern" },
      })
      renderWithChart(<Component />, { chart })

      expect(screen.getByTestId(testId)).toBeInTheDocument()

      await loadChart(chart)
      expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
    }
  )

  it.each(cases)(
    "keeps the default flavour %s chart without a skeleton",
    (chartLibrary, Component, testId) => {
      const { chart } = makeTestChart({
        mockData: systemLoadLine[0],
        attributes: { chartLibrary, designFlavour: "default" },
      })
      renderWithChart(<Component />, { chart })

      expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
    }
  )

  it("shows placeholder rows in the side legend until the first data arrives", async () => {
    const { chart } = makeTestChart({
      mockData: systemLoadLine[0],
      attributes: { designFlavour: "modern" },
    })
    renderWithChart(<LegendTable />, { chart })

    expect(screen.getByTestId("legendTableSkeleton")).toBeInTheDocument()
    expect(screen.getByText("Mean")).toBeInTheDocument()

    await loadChart(chart)
    expect(screen.queryByTestId("legendTableSkeleton")).not.toBeInTheDocument()
  })
})
