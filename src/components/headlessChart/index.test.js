import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import HeadlessChart from "./index"
import makeDefaultSDK from "../../makeDefaultSDK"

describe("HeadlessChart", () => {
  it("renders children components", () => {
    const sdk = makeDefaultSDK()
    
    render(
      <HeadlessChart sdk={sdk} contextScope={["system.load"]} agent>
        <div data-testid="child">Child Component</div>
      </HeadlessChart>
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  it("provides chart data via render prop", () => {
    const sdk = makeDefaultSDK()
    
    render(
      <HeadlessChart sdk={sdk} contextScope={["system.load"]} agent>
        {({ data, helpers, chart, state }) => (
          <div data-testid="render-prop">
            <div data-testid="helpers">{typeof helpers.getDimensionIds === "function" ? "has helpers" : "no helpers"}</div>
            <div data-testid="chart">{chart ? "has chart" : "no chart"}</div>
            <div data-testid="data">{Array.isArray(data) ? "has data" : "no data"}</div>
            <div data-testid="state">{typeof state === "object" ? "has state" : "no state"}</div>
          </div>
        )}
      </HeadlessChart>
    )

    expect(screen.getByTestId("render-prop")).toBeInTheDocument()
    expect(screen.getByTestId("helpers")).toHaveTextContent("has helpers")
    expect(screen.getByTestId("chart")).toHaveTextContent("has chart")
    expect(screen.getByTestId("data")).toHaveTextContent("has data")
    expect(screen.getByTestId("state")).toHaveTextContent("has state")
  })

  it("creates chart with provided SDK", () => {
    const sdk = makeDefaultSDK()
    const createChartSpy = jest.spyOn(sdk, "makeChart")
    
    render(
      <HeadlessChart 
        sdk={sdk} 
        contextScope={["system.load"]} 
        agent
        host="http://localhost:19999/api/v3"
      >
        <div>Test</div>
      </HeadlessChart>
    )

    expect(createChartSpy).toHaveBeenCalledWith({
      attributes: {
        contextScope: ["system.load"],
        agent: true,
        host: "http://localhost:19999/api/v3",
      }
    })
  })

  it("creates default SDK when none provided", () => {
    render(
      <HeadlessChart contextScope={["system.load"]} agent>
        <div data-testid="default-sdk">Default SDK</div>
      </HeadlessChart>
    )

    expect(screen.getByTestId("default-sdk")).toBeInTheDocument()
  })

  it("provides helper functions in render prop", () => {
    const sdk = makeDefaultSDK()
    
    render(
      <HeadlessChart sdk={sdk} contextScope={["system.load"]} agent>
        {({ helpers }) => (
          <div>
            <div data-testid="update-attribute">{typeof helpers.updateAttribute === "function" ? "function" : "not function"}</div>
            <div data-testid="get-attribute">{typeof helpers.getAttribute === "function" ? "function" : "not function"}</div>
            <div data-testid="get-dimension-ids">{typeof helpers.getDimensionIds === "function" ? "function" : "not function"}</div>
            <div data-testid="format-time">{typeof helpers.formatTime === "function" ? "function" : "not function"}</div>
          </div>
        )}
      </HeadlessChart>
    )

    expect(screen.getByTestId("update-attribute")).toHaveTextContent("function")
    expect(screen.getByTestId("get-attribute")).toHaveTextContent("function")
    expect(screen.getByTestId("get-dimension-ids")).toHaveTextContent("function")
    expect(screen.getByTestId("format-time")).toHaveTextContent("function")
  })
})