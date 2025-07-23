import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import Toolbox, {
  Container,
  Separator,
  ChartType,
  Fullscreen,
  Information,
  Download,
} from "./index"

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
    renderWithChart(<Toolbox>Test Content</Toolbox>, {
      attributes: {
        focused: true,
        toolboxElements: [],
      },
    })

    expect(screen.getByText("Test Content")).toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderToolbox")).toBeInTheDocument()
  })

  it("renders custom toolbox elements with correct disabled state when not focused", () => {
    const CustomElement = ({ disabled }) => <button disabled={disabled}>Custom Button</button>

    renderWithChart(<Toolbox>Regular Content</Toolbox>, {
      attributes: {
        focused: false,
        toolboxElements: [CustomElement],
      },
    })

    expect(screen.getByText("Custom Button")).toBeInTheDocument()
    expect(screen.getByText("Custom Button")).toBeDisabled()
    expect(screen.getByText("Regular Content")).toBeInTheDocument()
  })

  it("renders custom toolbox elements enabled when focused", () => {
    const CustomElement = ({ disabled }) => <button disabled={disabled}>Custom Button</button>

    renderWithChart(<Toolbox>Regular Content</Toolbox>, {
      attributes: {
        focused: true,
        toolboxElements: [CustomElement],
      },
    })

    expect(screen.getByText("Custom Button")).toBeInTheDocument()
    expect(screen.getByText("Custom Button")).not.toBeDisabled()
  })

  it("renders multiple toolbox elements", () => {
    const Element1 = ({ disabled }) => <button disabled={disabled}>Element 1</button>
    const Element2 = ({ disabled }) => <button disabled={disabled}>Element 2</button>

    renderWithChart(<Toolbox>Content</Toolbox>, {
      attributes: {
        focused: true,
        toolboxElements: [Element1, Element2],
      },
    })

    expect(screen.getByText("Element 1")).toBeInTheDocument()
    expect(screen.getByText("Element 2")).toBeInTheDocument()
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("passes additional props to Container", () => {
    renderWithChart(
      <Toolbox className="custom-toolbox" data-test="toolbox">
        Content
      </Toolbox>,
      {
        attributes: {
          focused: true,
          toolboxElements: [],
        },
      }
    )

    const container = screen.getByTestId("chartHeaderToolbox")
    expect(container).toHaveClass("custom-toolbox")
    expect(container).toHaveAttribute("data-test", "toolbox")
  })

  it("handles null toolboxElements gracefully", () => {
    renderWithChart(<Toolbox>Content</Toolbox>, {
      attributes: {
        focused: true,
        toolboxElements: null,
      },
    })

    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("handles empty toolboxElements array", () => {
    renderWithChart(<Toolbox>Content</Toolbox>, {
      attributes: {
        focused: true,
        toolboxElements: [],
      },
    })

    expect(screen.getByText("Content")).toBeInTheDocument()
  })
})
