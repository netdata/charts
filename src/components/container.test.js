import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import Container from "./container"

describe("Container", () => {
  it("renders container component with content", () => {
    renderWithChart(<Container>Test content</Container>)

    expect(screen.getByText("Test content")).toBeInTheDocument()
  })

  it("renders with data-testid and data-type attributes", () => {
    renderWithChart(<Container>Content</Container>)

    const container = screen.getByTestId("chart")
    expect(container).toHaveAttribute("data-type", "chart")
  })

  it("applies default dimensions", () => {
    renderWithChart(<Container>Content</Container>)

    const container = screen.getByTestId("chart")
    expect(container).toHaveStyle({ height: "100%", width: "100%" })
  })

  it("accepts custom dimensions as strings", () => {
    renderWithChart(
      <Container height="200px" width="300px">
        Content
      </Container>
    )

    const container = screen.getByTestId("chart")
    expect(container).toHaveStyle({ height: "200px", width: "300px" })
  })

  it("accepts custom dimensions as numbers", () => {
    renderWithChart(
      <Container height={250} width={350}>
        Content
      </Container>
    )

    const container = screen.getByTestId("chart")
    expect(container).toHaveStyle({ height: "250px", width: "350px" })
  })

  it("applies default styling", () => {
    renderWithChart(<Container>Content</Container>)

    const container = screen.getByTestId("chart")
    expect(container).toHaveStyle({ position: "relative" })
    // Check that it has styled-component classes
    expect(container.className).toMatch(/sc-/)
  })

  it("passes through additional props", () => {
    renderWithChart(
      <Container className="custom-class" data-custom="value">
        Content
      </Container>
    )

    const container = screen.getByTestId("chart")
    expect(container).toHaveClass("custom-class")
    expect(container).toHaveAttribute("data-custom", "value")
  })
})
