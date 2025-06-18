import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@/testUtilities"
import ChartContainer from "./chartContainer"

describe("ChartContainer", () => {
  it("renders container with data-testid", () => {
    renderWithChart(<ChartContainer uiName="default" />)
    
    expect(screen.getByTestId("chartContent")).toBeInTheDocument()
  })

  it("passes additional props to Flex container", () => {
    renderWithChart(
      <ChartContainer uiName="default" className="custom-class" data-custom="value" />
    )
    
    const container = screen.getByTestId("chartContent")
    expect(container).toHaveClass("custom-class")
    expect(container).toHaveAttribute("data-custom", "value")
  })

  it("sets correct default styles", () => {
    renderWithChart(<ChartContainer uiName="default" />)
    
    const container = screen.getByTestId("chartContent")
    expect(container).toHaveStyle({ height: "100%", width: "100%", overflow: "hidden" })
  })

  it("renders with custom dimensions", () => {
    renderWithChart(
      <ChartContainer uiName="default" width="200px" height="300px" />
    )
    
    const container = screen.getByTestId("chartContent")
    expect(container).toHaveStyle({ width: "200px", height: "300px" })
  })

  it("renders children when provided", () => {
    renderWithChart(
      <ChartContainer uiName="default">
        <div data-testid="child-element">Child content</div>
      </ChartContainer>
    )
    
    expect(screen.getByTestId("child-element")).toBeInTheDocument()
    expect(screen.getByText("Child content")).toBeInTheDocument()
  })

  it("applies flex properties", () => {
    renderWithChart(
      <ChartContainer 
        uiName="default" 
        alignItems="center" 
        justifyContent="center"
        column
      />
    )
    
    const container = screen.getByTestId("chartContent")
    expect(container).toHaveStyle({ 
      alignItems: "center", 
      justifyContent: "center",
      flexDirection: "column" 
    })
  })
})