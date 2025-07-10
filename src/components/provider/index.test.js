import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import ChartProvider, { withChartProvider } from "./index"
import { useChart } from "./selectors"

describe("ChartProvider", () => {
  it("provides chart context to children", () => {
    const TestComponent = () => {
      const chart = useChart()
      return <div data-testid="chart-id">{chart.getId()}</div>
    }

    renderWithChart(<TestComponent />)

    expect(screen.getByTestId("chart-id")).toHaveTextContent(/^[a-f0-9-]+$/)
  })

  it("renders children components", () => {
    renderWithChart(<div data-testid="child">Child Component</div>)

    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  it("handles null chart gracefully", () => {
    const TestComponent = () => {
      const chart = useChart()
      return <div data-testid="chart-value">{chart ? "has chart" : "no chart"}</div>
    }

    render(
      <ChartProvider chart={null}>
        <TestComponent />
      </ChartProvider>
    )

    expect(screen.getByTestId("chart-value")).toHaveTextContent("no chart")
  })
})

describe("withChartProvider", () => {
  it("wraps component with chart provider", () => {
    const { chart } = makeTestChart()

    const TestComponent = () => {
      const contextChart = useChart()
      return <div data-testid="wrapped-chart-id">{contextChart.getId()}</div>
    }

    const WrappedComponent = withChartProvider(TestComponent)

    render(<WrappedComponent chart={chart} />)

    expect(screen.getByTestId("wrapped-chart-id")).toHaveTextContent(chart.getId())
  })

  it("passes through other props to wrapped component", () => {
    const { chart } = makeTestChart()

    const TestComponent = ({ testProp }) => <div data-testid="test-prop">{testProp}</div>

    const WrappedComponent = withChartProvider(TestComponent)

    render(<WrappedComponent chart={chart} testProp="passed through" />)

    expect(screen.getByTestId("test-prop")).toHaveTextContent("passed through")
  })

  it("excludes chart prop from passed props", () => {
    const { chart } = makeTestChart()

    const TestComponent = ({ chart: propChart, ...props }) => {
      const contextChart = useChart()
      return (
        <div>
          <div data-testid="context-chart">{contextChart.getId()}</div>
          <div data-testid="prop-chart">{propChart ? "has prop chart" : "no prop chart"}</div>
        </div>
      )
    }

    const WrappedComponent = withChartProvider(TestComponent)

    render(<WrappedComponent chart={chart} />)

    expect(screen.getByTestId("context-chart")).toHaveTextContent(chart.getId())
    expect(screen.getByTestId("prop-chart")).toHaveTextContent("no prop chart")
  })
})
