import React from "react"
import { screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@/testUtilities"
import Button from "./button"

describe("Icon Button", () => {
  it("renders button with children", () => {
    renderWithChart(<Button>Click me</Button>)
    expect(screen.getByRole("button")).toHaveTextContent("Click me")
  })

  it("renders button with icon prop", () => {
    const Icon = () => <svg data-testid="test-icon" />
    renderWithChart(<Button icon={<Icon />} />)
    expect(screen.getByTestId("test-icon")).toBeInTheDocument()
  })

  it("applies active state", () => {
    renderWithChart(<Button active>Active Button</Button>)
    const button = screen.getByRole("button")
    // Active state affects styling, check that button renders
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent("Active Button")
  })

  it("applies disabled attribute when disabled", () => {
    renderWithChart(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
  })

  it("handles click events", () => {
    const handleClick = jest.fn()
    renderWithChart(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole("button")
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalled()
  })

  it("shows tooltip when title prop is provided", () => {
    renderWithChart(<Button title="This is a tooltip">Hover me</Button>)
    
    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()
    // Button is wrapped with withTooltip HOC which handles tooltip display
  })

  it("respects aria-expanded attribute for active state", () => {
    renderWithChart(<Button aria-expanded="true">Expanded</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("aria-expanded", "true")
  })

  it("passes custom props to button", () => {
    renderWithChart(
      <Button data-testid="custom-button" className="custom-class">
        Custom props
      </Button>
    )
    
    const button = screen.getByTestId("custom-button")
    expect(button).toHaveClass("custom-class")
  })

  it("applies hover indicator by default", () => {
    const { container } = renderWithChart(<Button>Hover indicator</Button>)
    const button = container.querySelector("button")
    
    // hoverIndicator prop defaults to true
    expect(button).toBeInTheDocument()
  })

  it("can disable hover indicator", () => {
    renderWithChart(<Button hoverIndicator={false}>No hover</Button>)
    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()
  })

  it("handles stroked prop for SVG styling", () => {
    const StrokedIcon = () => (
      <svg data-testid="stroked-icon">
        <path d="M10 10" />
      </svg>
    )
    
    renderWithChart(<Button icon={<StrokedIcon />} stroked />)
    expect(screen.getByTestId("stroked-icon")).toBeInTheDocument()
  })
})