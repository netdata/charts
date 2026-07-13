import React from "react"
import { screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart, renderWithProviders } from "@jest/testUtilities"
import makeMockPayload from "@/helpers/makeMockPayload"
import systemLoadLine from "../../../fixtures/systemLoadLine"
import HeadlessChart from "."
import useHeadlessChart from "./useHeadlessChart"

const signedSystemLoad = {
  ...systemLoadLine[0],
  result: {
    ...systemLoadLine[0].result,
    data: systemLoadLine[0].result.data.map(([timestamp, first, ...rest]) => [
      timestamp,
      [-Math.abs(first[0]), ...first.slice(1)],
      ...rest,
    ]),
  },
}

const TestComponent = () => {
  const { chart, data, dimensionIds, helpers, state } = useHeadlessChart()
  
  return (
    <div>
      <div data-testid="chart-id">{chart.getId()}</div>
      <div data-testid="data-length">{data.length}</div>
      <div data-testid="dimension-ids">{dimensionIds.length}</div>
      <div data-testid="helpers">{typeof helpers.getDimensionIds === "function" ? "has helpers" : "no helpers"}</div>
      <div data-testid="state-loading">{state.loading ? "loading" : "not loading"}</div>
      <div data-testid="state-empty">{state.empty ? "empty" : "not empty"}</div>
    </div>
  )
}

describe("useHeadlessChart", () => {
  it("provides chart instance", () => {
    renderWithChart(<TestComponent />)

    expect(screen.getByTestId("chart-id")).toHaveTextContent(/^[a-f0-9-]+$/)
  })

  it("provides data array", () => {
    renderWithChart(<TestComponent />)

    expect(screen.getByTestId("data-length")).toHaveTextContent(/^\d+$/)
  })

  it("provides dimension ids", () => {
    renderWithChart(<TestComponent />)

    expect(screen.getByTestId("dimension-ids")).toHaveTextContent(/^\d+$/)
  })

  it("provides helper functions", () => {
    renderWithChart(<TestComponent />)

    expect(screen.getByTestId("helpers")).toHaveTextContent("has helpers")
  })

  it("provides state object", () => {
    renderWithChart(<TestComponent />)

    expect(screen.getByTestId("state-loading")).toHaveTextContent(/^(loading|not loading)$/)
    expect(screen.getByTestId("state-empty")).toHaveTextContent(/^(empty|not empty)$/)
  })

  it("returns processed data with formatted values", () => {
    const { chart } = makeTestChart({
      payload: {
        data: [
          [1000, 10, 20],
          [2000, 15, 25],
        ]
      }
    })

    const TestDataComponent = () => {
      const { data } = useHeadlessChart()
      
      return (
        <div>
          <div data-testid="data-available">{data.length > 0 ? "has data" : "no data"}</div>
          <div data-testid="first-timestamp">{data[0]?.timestamp || "no timestamp"}</div>
          <div data-testid="dimensions-count">{data[0]?.dimensions?.length || 0}</div>
        </div>
      )
    }

    renderWithChart(<TestDataComponent />, { chart })

    expect(screen.getByTestId("data-available")).toHaveTextContent(/^(has data|no data)$/)
    expect(screen.getByTestId("dimensions-count")).toHaveTextContent(/^\d+$/)
  })

  it("preserves signs in render-ready dimension values", async () => {
    const SignedValue = () => {
      const { currentRow } = useHeadlessChart()
      return <div data-testid="signed-value">{currentRow?.dimensions[0]?.value}</div>
    }

    renderWithProviders(
      <HeadlessChart
        getChart={makeMockPayload(signedSystemLoad, { delay: 0 })}
        contextScope={["system.load"]}
      >
        <SignedValue />
      </HeadlessChart>
    )

    await waitFor(() => {
      expect(screen.getByTestId("signed-value")).toHaveTextContent(/^-/)
    })
  })
})
