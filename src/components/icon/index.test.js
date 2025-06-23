import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import Icon, { Button } from "./index"

const mockSvg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
</svg>`

describe("Icon component", () => {
  beforeEach(() => {
    // Clean up any previously injected svg containers
    const existingContainer = document.getElementById("netdata-sdk-svg")
    if (existingContainer) {
      existingContainer.remove()
    }
  })

  it("renders icon component with svg", () => {
    const { container } = renderWithChart(<Icon svg={mockSvg} />)
    const iconElement = container.querySelector("svg")
    expect(iconElement).toBeInTheDocument()
    expect(iconElement.querySelector("use")).toBeInTheDocument()
  })

  it("passes size props to icon component", () => {
    const { container } = renderWithChart(<Icon svg={mockSvg} width="32px" height="32px" />)
    const iconElement = container.querySelector("svg")
    expect(iconElement).toHaveAttribute("width", "32px")
    expect(iconElement).toHaveAttribute("height", "32px")
  })

  it("uses size prop when width and height not provided", () => {
    const { container } = renderWithChart(<Icon svg={mockSvg} size="48px" />)
    const iconElement = container.querySelector("svg")
    expect(iconElement).toHaveAttribute("width", "48px")
    expect(iconElement).toHaveAttribute("height", "48px")
  })

  it("injects svg into document body", () => {
    renderWithChart(<Icon svg={mockSvg} />)
    const svgContainer = document.getElementById("netdata-sdk-svg")
    expect(svgContainer).toBeInTheDocument()
    expect(svgContainer.querySelector("defs")).toBeInTheDocument()
  })

  it("handles svg with content property", () => {
    const svgObject = { content: mockSvg }
    const { container } = renderWithChart(<Icon svg={svgObject} />)
    const iconElement = container.querySelector("svg")
    expect(iconElement).toBeInTheDocument()
  })

  it("reuses existing svg if already injected", () => {
    const { rerender } = renderWithChart(<Icon svg={mockSvg} />)
    const defsBeforeRerender = document.querySelector("#netdata-sdk-svg defs").children.length

    rerender(<Icon svg={mockSvg} />)
    const defsAfterRerender = document.querySelector("#netdata-sdk-svg defs").children.length

    expect(defsAfterRerender).toBe(defsBeforeRerender)
  })

  it("creates unique ids for different svgs", () => {
    const anotherSvg = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`

    renderWithChart(<Icon svg={mockSvg} />)
    renderWithChart(<Icon svg={anotherSvg} />)

    const defs = document.querySelector("#netdata-sdk-svg defs")
    expect(defs.children.length).toBe(2)
  })
})

describe("Button export", () => {
  it("exports Button component", () => {
    expect(Button).toBeDefined()
    expect(typeof Button).toBe("function")
  })
})
