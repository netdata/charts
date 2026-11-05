import React from "react"
import { screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import Fullscreen from "@/components/toolbox/fullscreen"
import Information from "@/components/toolbox/information"
import Header from "./index"

describe("Header component", () => {
  it("renders the title by default", () => {
    renderWithChart(<Header />, {
      attributes: { title: "CPU Usage" },
    })

    expect(screen.getByText("CPU Usage")).toBeInTheDocument()
  })

  it("hides the title when hideTitle is true", () => {
    renderWithChart(<Header />, {
      attributes: { title: "CPU Usage", hideTitle: true },
    })

    expect(screen.queryByText("CPU Usage")).not.toBeInTheDocument()
  })
})

describe("Header flavours", () => {
  const ConsumerAction = ({ disabled }) => (
    <button type="button" disabled={disabled}>
      Consumer action
    </button>
  )

  it.each(["default", "minimal"])("keeps the %s header free of modern elements", flavour => {
    renderWithChart(<Header hasFilters />, {
      attributes: {
        title: "CPU Usage",
        designFlavour: flavour,
        focused: true,
        toolboxElements: [ConsumerAction],
      },
    })

    expect(screen.getByTestId("chartHeader")).not.toHaveAttribute("data-flavour")
    expect(screen.getByTestId("chartHeaderStatus")).toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderToolbox")).toBeInTheDocument()
    expect(screen.getByText("Consumer action")).toBeEnabled()
    expect(screen.getByText("CPU Usage")).toBeInTheDocument()
    expect(screen.queryByTestId("chartScope")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartScope-loading")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderToolbox-more")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderToolbox-filters")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartAttention")).not.toBeInTheDocument()
  })

  it.each(["default", "minimal"])(
    "keeps the %s toolbox buttons for elements that declare a menu",
    flavour => {
      renderWithChart(<Header hasFilters />, {
        attributes: {
          title: "CPU Usage",
          designFlavour: flavour,
          focused: true,
          toolboxProps: { drag: { "aria-roledescription": "draggable" } },
          toolboxElements: [Fullscreen, Information, ConsumerAction],
        },
      })

      const toolbox = screen.getByTestId("chartHeaderToolbox")
      expect(within(toolbox).getByTestId("chartHeaderToolbox-fullscreen")).toBeEnabled()
      expect(within(toolbox).getByTestId("chartHeaderToolbox-information")).toBeEnabled()
      expect(within(toolbox).getByText("Consumer action")).toBeEnabled()
      expect(screen.queryByTestId("chartHeaderToolbox-drag")).not.toBeInTheDocument()
      expect(screen.queryByTestId("chartMoreMenu")).not.toBeInTheDocument()
    }
  )

  it("renders the modern header only for the modern flavour", () => {
    renderWithChart(<Header hasFilters />, {
      attributes: { title: "CPU Usage", designFlavour: "modern" },
    })

    expect(screen.getByTestId("chartHeader")).toHaveAttribute("data-flavour", "modern")
    expect(screen.queryByTestId("chartHeaderStatus")).not.toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderToolbox-more")).toBeInTheDocument()
  })

  it.each(["default", "minimal"])("keeps the %s header on sparklines", flavour => {
    renderWithChart(<Header hasFilters />, {
      attributes: { title: "CPU Usage", designFlavour: flavour, sparkline: true },
    })

    expect(screen.getByTestId("chartHeader")).toBeInTheDocument()
    expect(screen.getByText("CPU Usage")).toBeInTheDocument()
  })

  it.each(["default", "minimal"])("keeps the %s status badges without the toolbox", flavour => {
    renderWithChart(<Header hasFilters />, {
      attributes: { title: "CPU Usage", designFlavour: flavour, hasToolbox: false },
    })

    expect(screen.getByTestId("chartHeaderStatus")).toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderStatus-loading")).toBeInTheDocument()
    expect(screen.queryByTestId("chartScope-loading")).not.toBeInTheDocument()
  })

  it("renders no modern header on a modern sparkline", () => {
    renderWithChart(<Header hasFilters />, {
      attributes: { title: "CPU Usage", designFlavour: "modern", sparkline: true },
    })

    expect(screen.queryByTestId("chartHeader")).not.toBeInTheDocument()
  })
})
