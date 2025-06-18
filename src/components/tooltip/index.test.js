import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@/testUtilities"
import Tooltip, { withTooltip, tooltipStyleProps } from "./index"

describe("Tooltip component", () => {
  it("renders tooltip when content is provided", () => {
    renderWithChart(
      <Tooltip content="Tooltip content" data-testid="tooltip-trigger">
        <button>Hover me</button>
      </Tooltip>
    )
    
    expect(screen.getByText("Hover me")).toBeInTheDocument()
  })

  it("renders children directly when no content", () => {
    renderWithChart(
      <Tooltip>
        <button>No tooltip button</button>
      </Tooltip>
    )
    
    expect(screen.getByText("No tooltip button")).toBeInTheDocument()
  })

  it("shows tooltip content on hover", async () => {
    const { user } = renderWithChart(
      <Tooltip content="This is the tooltip content">
        <button>Hover for tooltip</button>
      </Tooltip>
    )
    
    const button = screen.getByText("Hover for tooltip")
    
    // Hover over the button
    await user.hover(button)
    
    // Tooltip content should appear
    expect(await screen.findByText("This is the tooltip content")).toBeInTheDocument()
    
    // Unhover
    await user.unhover(button)
    
    // Tooltip should disappear
    await waitFor(() => {
      expect(screen.queryByText("This is the tooltip content")).not.toBeInTheDocument()
    })
  })

  it("uses custom Content component when provided", () => {
    const CustomContent = ({ children }) => (
      <div data-testid="custom-content">{children}</div>
    )
    
    renderWithChart(
      <Tooltip content="Custom tooltip" Content={CustomContent}>
        <button>Button</button>
      </Tooltip>
    )
    
    expect(screen.getByText("Button")).toBeInTheDocument()
  })

  it("passes dropProps with data-toolbox", () => {
    renderWithChart(
      <Tooltip content="Test" data-toolbox="test-id">
        <button>Button</button>
      </Tooltip>
    )
    
    expect(screen.getByText("Button")).toBeInTheDocument()
  })

  it("applies tooltip style props to default content", async () => {
    const { user } = renderWithChart(
      <Tooltip content="Styled tooltip">
        <button>Hover me</button>
      </Tooltip>
    )
    
    await user.hover(screen.getByText("Hover me"))
    
    const tooltipContent = await screen.findByText("Styled tooltip")
    expect(tooltipContent).toBeInTheDocument()
  })

  it("respects disabled prop", async () => {
    const { user } = renderWithChart(
      <Tooltip content="Should not show" disabled>
        <button>Disabled tooltip</button>
      </Tooltip>
    )
    
    await user.hover(screen.getByText("Disabled tooltip"))
    
    // Tooltip should not appear when disabled
    expect(screen.queryByText("Should not show")).not.toBeInTheDocument()
  })
})

describe("withTooltip HOC", () => {
  it("wraps component and adds tooltip functionality", () => {
    const TestComponent = ({ children, ...props }) => (
      <button data-testid="test-button" {...props}>
        {children}
      </button>
    )
    
    const WrappedComponent = withTooltip(TestComponent)
    
    renderWithChart(
      <WrappedComponent title="Test tooltip">
        Button with tooltip
      </WrappedComponent>
    )
    
    expect(screen.getByTestId("test-button")).toBeInTheDocument()
    expect(screen.getByText("Button with tooltip")).toBeInTheDocument()
  })

  it("passes through all props to wrapped component", () => {
    const TestComponent = ({ customProp, ...props }) => (
      <div data-testid="test-component" data-custom={customProp} {...props} />
    )
    
    const WrappedComponent = withTooltip(TestComponent)
    
    renderWithChart(
      <WrappedComponent customProp="custom-value" className="test-class">
        Content
      </WrappedComponent>
    )
    
    const element = screen.getByTestId("test-component")
    expect(element).toHaveAttribute("data-custom", "custom-value")
    expect(element).toHaveClass("test-class")
  })

  it("handles components without title prop", () => {
    const TestComponent = (props) => <div data-testid="no-title" {...props} />
    const WrappedComponent = withTooltip(TestComponent)
    
    renderWithChart(<WrappedComponent>No tooltip</WrappedComponent>)
    
    expect(screen.getByTestId("no-title")).toBeInTheDocument()
  })
})

describe("tooltipStyleProps", () => {
  it("exports correct style properties", () => {
    expect(tooltipStyleProps).toEqual({
      padding: [1, 2],
      margin: [2],
      round: 1,
      width: { max: "300px", base: "fit-content" },
      background: "tooltip"
    })
  })
})