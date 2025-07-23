import React from "react"
import { screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import Status from "./index"

describe("Status component", () => {
  it("renders loading status when initial loading", () => {
    const { chart } = makeTestChart({
      attributes: {
        initialLoading: true,
        loaded: false,
      },
    })

    renderWithChart(<Status />, { chart })

    expect(screen.getByText("Loading")).toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderStatus-loading")).toBeInTheDocument()
  })

  it("renders error status when there is an error", async () => {
    const { chart } = makeTestChart({
      attributes: {
        error: "Failed to load data",
        initialLoading: false,
        loaded: true,
      },
    })

    renderWithChart(<Status />, { chart })
    chart.trigger("failFetch")

    await waitFor(() => {
      expect(screen.getByText(/Error.*Failed to load data/)).toBeInTheDocument()
      expect(screen.getByTestId("chartHeaderStatus-error")).toBeInTheDocument()
    })
  })

  it("renders no data status when empty", () => {
    const { chart } = makeTestChart({
      attributes: {
        empty: true,
        initialLoading: false,
        loaded: true,
      },
    })

    renderWithChart(<Status />, { chart })

    expect(screen.getByText("No data")).toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderStatus-empty")).toBeInTheDocument()
  })

  it("renders logo/reload container", () => {
    const { chart } = makeTestChart()

    renderWithChart(<Status />, { chart })

    expect(screen.getByTestId("chartHeaderStatus-logo")).toBeInTheDocument()
  })

  it("hides badges when plain prop is true", () => {
    const { chart } = makeTestChart({
      attributes: {
        initialLoading: true,
      },
    })

    renderWithChart(<Status plain />, { chart })

    expect(screen.queryByText("Loading")).not.toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderStatus-logo")).toBeInTheDocument()
  })

  it("updates when loading state changes", () => {
    const { chart } = makeTestChart({
      attributes: {
        initialLoading: true,
      },
    })

    const { rerender } = renderWithChart(<Status />, { chart })

    expect(screen.getByText("Loading")).toBeInTheDocument()

    chart.updateAttribute("initialLoading", false)
    chart.updateAttribute("loaded", true)
    rerender(<Status />)

    expect(screen.queryByText("Loading")).not.toBeInTheDocument()
  })

  it("prioritizes error over loading status", async () => {
    const { chart } = makeTestChart({
      attributes: {
        initialLoading: true,
        error: "Network error",
        loaded: false,
      },
    })

    renderWithChart(<Status />, { chart })
    chart.trigger("failFetch")

    await waitFor(() => {
      expect(screen.getByText(/Error.*Network error/)).toBeInTheDocument()
      expect(screen.queryByText("Loading")).not.toBeInTheDocument()
    })
  })

  it("handles empty error string", () => {
    const { chart } = makeTestChart({
      attributes: {
        error: "",
      },
    })

    renderWithChart(<Status />, { chart })

    expect(screen.queryByTestId("chartHeaderStatus-error")).not.toBeInTheDocument()
  })

  it("passes additional props to container", () => {
    const { chart } = makeTestChart()

    renderWithChart(<Status data-custom="test" />, { chart })

    const container = screen.getByTestId("chartHeaderStatus")
    expect(container).toHaveAttribute("data-custom", "test")
  })

  it("shows nothing when loaded and not empty", () => {
    const { chart } = makeTestChart({
      attributes: {
        initialLoading: false,
        loaded: true,
        error: null,
      },
    })

    chart.getPayload = jest.fn(() => ({ data: [1, 2, 3] }))

    renderWithChart(<Status />, { chart })

    expect(screen.queryByTestId("chartHeaderStatus-loading")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderStatus-error")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderStatus-empty")).not.toBeInTheDocument()
  })
})
