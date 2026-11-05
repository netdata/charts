import React from "react"
import { screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithProviders } from "@jest/testUtilities"
import { NodesLight, NodesDark, AggregateDark, ToolboxLight, Dropdown } from "./modern.stories"

describe("modern filter dropdown stories", () => {
  it("opens the nodes dropdown in light and dark", async () => {
    const { unmount } = renderWithProviders(<NodesLight />)
    expect(await screen.findByTestId("modern-filter-dropdown")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Search 6 nodes")).toBeInTheDocument()
    expect(screen.getByText("env")).toBeInTheDocument()
    unmount()

    renderWithProviders(<NodesDark />)
    expect(await screen.findByTestId("modern-filter-dropdown")).toBeInTheDocument()
  })

  it("opens a single select dropdown", async () => {
    renderWithProviders(<AggregateDark />)
    expect(await screen.findByTestId("modern-filter-single-select")).toBeInTheDocument()
  })

  it("renders every dropdown from the control", async () => {
    for (const dropdown of ["dimensions", "labels", "groupBy", "timeAggregation"]) {
      const { unmount } = renderWithProviders(<Dropdown theme="light" dropdown={dropdown} />)
      await waitFor(() =>
        expect(
          screen.queryByTestId("modern-filter-dropdown") ||
            screen.queryByTestId("modern-filter-single-select")
        ).toBeInTheDocument()
      )
      unmount()
    }
  })

  it("renders the whole toolbox", async () => {
    renderWithProviders(<ToolboxLight />)
    expect(await screen.findByTestId("chartFilters")).toBeInTheDocument()
  })
})
