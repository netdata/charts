import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@/testUtilities"
import Toolbox, { Container, Separator, ChartType, Fullscreen, Information, Download } from "./index"

describe("Toolbox exports", () => {
  it("exports all required components", () => {
    expect(Toolbox).toBeDefined()
    expect(Container).toBeDefined()
    expect(Separator).toBeDefined()
    expect(ChartType).toBeDefined()
    expect(Fullscreen).toBeDefined()
    expect(Information).toBeDefined()
    expect(Download).toBeDefined()
  })
})

describe("Container component", () => {
  it("renders container with children", () => {
    renderWithChart(<Container>Test Content</Container>)
    
    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("has correct testid attribute", () => {
    renderWithChart(<Container>Content</Container>)
    
    expect(screen.getByTestId("chartHeaderToolbox")).toBeInTheDocument()
    expect(screen.getByText("Content")).toBeInTheDocument()
  })
})

describe("Toolbox component", () => {
  it("renders toolbox with children", () => {
    const { chart } = makeTestChart({
      attributes: {
        focused: true,
        toolboxElements: []
      }
    })
    
    renderWithChart(<Toolbox>Test Content</Toolbox>, { testChartOptions: { chart } })
    
    expect(screen.getByText("Test Content")).toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderToolbox")).toBeInTheDocument()
  })

  it("renders custom toolbox elements with correct disabled state when not focused", () => {
    const CustomElement = ({ disabled }) => <button disabled={disabled}>Custom Button</button>
    
    const { chart } = makeTestChart({
      attributes: {
        focused: false,
        toolboxElements: [CustomElement]
      }
    })
    
    renderWithChart(<Toolbox>Regular Content</Toolbox>, { testChartOptions: { chart } })
    
    expect(screen.getByText("Custom Button")).toBeInTheDocument()
    expect(screen.getByText("Custom Button")).toBeDisabled()
    expect(screen.getByText("Regular Content")).toBeInTheDocument()
  })

  it("renders custom toolbox elements enabled when focused", () => {
    const CustomElement = ({ disabled }) => <button disabled={disabled}>Custom Button</button>
    
    const { chart } = makeTestChart({
      attributes: {
        focused: true,
        toolboxElements: [CustomElement]
      }
    })
    
    renderWithChart(<Toolbox>Regular Content</Toolbox>, { testChartOptions: { chart } })
    
    expect(screen.getByText("Custom Button")).toBeInTheDocument()
    expect(screen.getByText("Custom Button")).not.toBeDisabled()
  })

  it("renders multiple toolbox elements", () => {
    const Element1 = ({ disabled }) => <button disabled={disabled}>Element 1</button>
    const Element2 = ({ disabled }) => <button disabled={disabled}>Element 2</button>
    
    const { chart } = makeTestChart({
      attributes: {
        focused: true,
        toolboxElements: [Element1, Element2]
      }
    })
    
    renderWithChart(<Toolbox>Content</Toolbox>, { testChartOptions: { chart } })
    
    expect(screen.getByText("Element 1")).toBeInTheDocument()
    expect(screen.getByText("Element 2")).toBeInTheDocument()
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("passes additional props to Container", () => {
    const { chart } = makeTestChart({
      attributes: {
        focused: true,
        toolboxElements: []
      }
    })
    
    renderWithChart(
      <Toolbox className="custom-toolbox" data-test="toolbox">Content</Toolbox>,
      { testChartOptions: { chart } }
    )
    
    const container = screen.getByTestId("chartHeaderToolbox")
    expect(container).toHaveClass("custom-toolbox")
    expect(container).toHaveAttribute("data-test", "toolbox")
  })

  it("handles null toolboxElements gracefully", () => {
    const { chart } = makeTestChart({
      attributes: {
        focused: true,
        toolboxElements: null
      }
    })
    
    renderWithChart(<Toolbox>Content</Toolbox>, { testChartOptions: { chart } })
    
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("handles empty toolboxElements array", () => {
    const { chart } = makeTestChart({
      attributes: {
        focused: true,
        toolboxElements: []
      }
    })
    
    renderWithChart(<Toolbox>Content</Toolbox>, { testChartOptions: { chart } })
    
    expect(screen.getByText("Content")).toBeInTheDocument()
  })
})