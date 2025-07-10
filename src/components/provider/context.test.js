import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import ChartContext from "./context"

describe("ChartContext", () => {
  it("creates React context with null default value", () => {
    expect(ChartContext).toBeDefined()
    expect(ChartContext.Provider).toBeDefined()
    expect(ChartContext.Consumer).toBeDefined()
  })

  it("provides context value to children", () => {
    const testValue = { test: "data" }
    const TestComponent = () => {
      return (
        <ChartContext.Consumer>
          {value => <div data-testid="context-value">{JSON.stringify(value)}</div>}
        </ChartContext.Consumer>
      )
    }

    render(
      <ChartContext.Provider value={testValue}>
        <TestComponent />
      </ChartContext.Provider>
    )

    expect(screen.getByTestId("context-value")).toHaveTextContent('{"test":"data"}')
  })

  it("provides null by default when no provider", () => {
    const TestComponent = () => {
      return (
        <ChartContext.Consumer>
          {value => <div data-testid="context-value">{String(value)}</div>}
        </ChartContext.Consumer>
      )
    }

    render(<TestComponent />)

    expect(screen.getByTestId("context-value")).toHaveTextContent("null")
  })
})
