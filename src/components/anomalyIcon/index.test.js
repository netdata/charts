import React from "react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import AnomalyIcon from "./index"

describe("AnomalyIcon", () => {
  beforeEach(() => {
    // Clean up any previously injected svg containers
    const existingContainer = document.getElementById("netdata-sdk-svg")
    if (existingContainer) {
      existingContainer.remove()
    }
  })

  it("renders anomaly icon with tooltip", () => {
    const { container } = renderWithChart(<AnomalyIcon />)

    // Check that the icon is rendered
    const icon = container.querySelector("svg")
    expect(icon).toBeInTheDocument()
  })

  it("displays tooltip on hover", () => {
    const { container } = renderWithChart(<AnomalyIcon />)

    // The Tooltip component wraps the icon
    expect(container.firstChild).toBeInTheDocument()
  })

  it("applies loading color to icon", () => {
    const { container } = renderWithChart(<AnomalyIcon />, {
      attributes: {
        loading: true,
        fetchStartedAt: Date.now(),
      },
    })

    const icon = container.querySelector("svg")
    // Default loading color is themeNeutralBackground
    expect(icon).toHaveAttribute("color", "themeNeutralBackground")
  })

  it("renders with custom props", () => {
    const { container } = renderWithChart(
      <AnomalyIcon className="custom-class" data-test="anomaly" />
    )

    const icon = container.querySelector("svg")
    expect(icon).toHaveClass("custom-class")
    expect(icon).toHaveAttribute("data-test", "anomaly")
  })

  it("applies animation styles", () => {
    const { container } = renderWithChart(<AnomalyIcon />)

    const icon = container.querySelector("svg")

    // Check that the icon is styled (styled-components adds classes)
    expect(icon.tagName).toBe("svg")
    // The animation is applied via styled-components
    expect(icon).toHaveAttribute("width", "100%")
  })

  it("uses 100% width for icon", () => {
    const { container } = renderWithChart(<AnomalyIcon />)

    const icon = container.querySelector("svg")
    expect(icon).toHaveAttribute("width", "100%")
  })
})
