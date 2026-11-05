import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { ThemeProvider } from "styled-components"
import { DefaultTheme } from "@netdata/netdata-ui"
import makeMockPayload from "@/helpers/makeMockPayload"
import groupedGauge from "../../../fixtures/groupedGauge"
import BreakdownChart from "./breakdownChart"

const TestWrapper = ({ children }) => <ThemeProvider theme={DefaultTheme}>{children}</ThemeProvider>

describe("BreakdownChart", () => {
  it("renders with renderFunction", async () => {
    render(
      <BreakdownChart
        getChart={makeMockPayload(groupedGauge[0], { delay: 0 })}
        contextScope={["httpcheck.responsetime"]}
        chartLibrary="gauge"
        renderFunction={(groups) => (
          <div data-testid="custom-render">
            {groups.map(g => (
              <div key={g.key} data-testid={`group-${g.key}`}>
                {g.label}: {g.value}
              </div>
            ))}
          </div>
        )}
      />,
      { wrapper: TestWrapper }
    )

    await waitFor(() => {
      expect(screen.getByTestId("custom-render")).toBeInTheDocument()
    })
  })

  it("passes groups to renderFunction", async () => {
    const renderFunction = jest.fn(() => <div data-testid="rendered" />)

    render(
      <BreakdownChart
        getChart={makeMockPayload(groupedGauge[0], { delay: 0 })}
        contextScope={["httpcheck.responsetime"]}
        chartLibrary="gauge"
        renderFunction={renderFunction}
      />,
      { wrapper: TestWrapper }
    )

    await waitFor(() => {
      expect(screen.getByTestId("rendered")).toBeInTheDocument()
    })

    expect(renderFunction).toHaveBeenCalled()
    const lastCall = renderFunction.mock.calls[renderFunction.mock.calls.length - 1]
    expect(Array.isArray(lastCall[0])).toBe(true)
    expect(lastCall[1]).toHaveProperty("chart")
    expect(lastCall[1]).toHaveProperty("helpers")
    expect(lastCall[1]).toHaveProperty("state")
  })

  it("renders default grid when no renderFunction", async () => {
    render(
      <BreakdownChart
        getChart={makeMockPayload(groupedGauge[0], { delay: 0 })}
        contextScope={["httpcheck.responsetime"]}
        chartLibrary="gauge"
      />,
      { wrapper: TestWrapper }
    )

    await waitFor(() => {
      expect(screen.getByText(/httpcheck_website-a/)).toBeInTheDocument()
    })

    expect(screen.getByText(/httpcheck_website-b/)).toBeInTheDocument()
    expect(screen.getByText(/httpcheck_website-c/)).toBeInTheDocument()
  })
})
