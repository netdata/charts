import React from "react"
import { screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { render } from "@testing-library/react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme } from "@netdata/netdata-ui"
import makeMockPayload from "@/helpers/makeMockPayload"
import groupedGauge from "../../../fixtures/groupedGauge"
import HeadlessChart from "."
import useGroupedChart from "./useGroupedChart"

const TestWrapper = ({ children }) => <ThemeProvider theme={DefaultTheme}>{children}</ThemeProvider>

const TestGroupedComponent = ({ sharedMinMax }) => {
  const { groups, chart, helpers, state } = useGroupedChart({ sharedMinMax })

  return (
    <div>
      <div data-testid="groups-count">{groups.length}</div>
      <div data-testid="group-keys">
        {groups.map(g => g.key).join(",")}
      </div>
      <div data-testid="group-labels">
        {groups.map(g => g.label).join(",")}
      </div>
      <div data-testid="group-values">
        {groups.map(g => g.value).join(",")}
      </div>
      <div data-testid="group-dimension-counts">
        {groups.map(g => g.dimensionIds.length).join(",")}
      </div>
      <div data-testid="has-min-max">
        {groups.length > 0 && groups[0].min !== undefined ? "yes" : "no"}
      </div>
      <div data-testid="has-chart">{chart ? "yes" : "no"}</div>
      <div data-testid="has-helpers">{helpers ? "yes" : "no"}</div>
      <div data-testid="has-state">{state ? "yes" : "no"}</div>
      <div data-testid="shared-min-max">
        {groups.length > 1 && groups[0].min === groups[1].min && groups[0].max === groups[1].max
          ? "yes"
          : "no"}
      </div>
    </div>
  )
}

describe("useGroupedChart", () => {
  it("splits payload tree into groups", async () => {
    render(
      <HeadlessChart
        getChart={makeMockPayload(groupedGauge[0], { delay: 0 })}
        contextScope={["httpcheck.responsetime"]}
        chartLibrary="gauge"
      >
        <TestGroupedComponent />
      </HeadlessChart>,
      { wrapper: TestWrapper }
    )

    await waitFor(() => {
      expect(screen.getByTestId("groups-count")).toHaveTextContent("3")
    })

    expect(screen.getByTestId("has-chart")).toHaveTextContent("yes")
    expect(screen.getByTestId("has-helpers")).toHaveTextContent("yes")
  })

  it("provides dimension ids per group", async () => {
    render(
      <HeadlessChart
        getChart={makeMockPayload(groupedGauge[0], { delay: 0 })}
        contextScope={["httpcheck.responsetime"]}
        chartLibrary="gauge"
      >
        <TestGroupedComponent />
      </HeadlessChart>,
      { wrapper: TestWrapper }
    )

    await waitFor(() => {
      expect(screen.getByTestId("group-dimension-counts")).toHaveTextContent(/^\d+(,\d+)*$/)
      expect(screen.getByTestId("group-dimension-counts")).not.toHaveTextContent("0")
    })
  })

  it("provides chart and helpers passthrough", async () => {
    render(
      <HeadlessChart
        getChart={makeMockPayload(groupedGauge[0], { delay: 0 })}
        contextScope={["httpcheck.responsetime"]}
        chartLibrary="gauge"
      >
        <TestGroupedComponent />
      </HeadlessChart>,
      { wrapper: TestWrapper }
    )

    expect(screen.getByTestId("has-chart")).toHaveTextContent("yes")
    expect(screen.getByTestId("has-helpers")).toHaveTextContent("yes")
  })

  it("provides min and max per group", async () => {
    render(
      <HeadlessChart
        getChart={makeMockPayload(groupedGauge[0], { delay: 0 })}
        contextScope={["httpcheck.responsetime"]}
        chartLibrary="gauge"
      >
        <TestGroupedComponent />
      </HeadlessChart>,
      { wrapper: TestWrapper }
    )

    await waitFor(() => {
      expect(screen.getByTestId("has-min-max")).toHaveTextContent("yes")
    })
  })

  it("provides state passthrough", async () => {
    render(
      <HeadlessChart
        getChart={makeMockPayload(groupedGauge[0], { delay: 0 })}
        contextScope={["httpcheck.responsetime"]}
        chartLibrary="gauge"
      >
        <TestGroupedComponent />
      </HeadlessChart>,
      { wrapper: TestWrapper }
    )

    await waitFor(() => {
      expect(screen.getByTestId("has-state")).toHaveTextContent("yes")
    })
  })

  it("shares min/max across groups when sharedMinMax is true", async () => {
    render(
      <HeadlessChart
        getChart={makeMockPayload(groupedGauge[0], { delay: 0 })}
        contextScope={["httpcheck.responsetime"]}
        chartLibrary="gauge"
      >
        <TestGroupedComponent sharedMinMax />
      </HeadlessChart>,
      { wrapper: TestWrapper }
    )

    await waitFor(() => {
      expect(screen.getByTestId("groups-count")).toHaveTextContent("3")
    })

    expect(screen.getByTestId("shared-min-max")).toHaveTextContent("yes")
  })
})
