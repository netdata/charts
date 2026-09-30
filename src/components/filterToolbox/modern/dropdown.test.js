import React from "react"
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import { filterDropdownsPayload } from "../../../../fixtures/filterDropdowns"
import Nodes from "../nodes"
import Dimensions from "../dimensions"
import Labels from "../labels"
import GroupBy from "../groupBy"
import Aggregate from "../aggregate"
import TimeAggregation from "../timeAggregation"
import ModernItem from "./item"

const loadChart = async (attributes = {}) => {
  const { chart } = makeTestChart({ attributes, mockData: filterDropdownsPayload })
  chart.doneFetch(filterDropdownsPayload)
  await waitFor(() => expect(chart.getAttribute("loaded")).toBe(true))
  return chart
}

const openDropdown = async (Component, attributes) => {
  const chart = await loadChart(attributes)
  const result = renderWithChart(<Component />, { chart })
  fireEvent.click(screen.getAllByRole("button")[0])
  return { ...result, chart }
}

describe("filter dropdowns, default flavour", () => {
  it("keeps the table dropdown as it was", async () => {
    await openDropdown(Nodes, { designFlavour: "default" })

    expect(screen.queryByTestId("modern-filter-dropdown")).not.toBeInTheDocument()
    expect(screen.getByText("Vol %")).toBeInTheDocument()
    expect(screen.getByText("Anomaly%")).toBeInTheDocument()
    expect(screen.getByText("Instances")).toBeInTheDocument()
    expect(screen.getByText("clear")).toBeInTheDocument()
    expect(screen.getByText("reset")).toBeInTheDocument()
    expect(screen.queryByText("Apply")).not.toBeInTheDocument()
    expect(screen.queryByText("Share of volume")).not.toBeInTheDocument()
    expect(screen.getAllByText("Nodes").length).toBeGreaterThan(0)
    expect(screen.getByText("Min")).toBeInTheDocument()
    expect(screen.getByText(/^Selected/)).toBeInTheDocument()
    expect(screen.queryByTestId("modern-filter-columns-toggle")).not.toBeInTheDocument()
  })

  it("keeps the single select dropdown as it was", async () => {
    await openDropdown(Aggregate, { designFlavour: "minimal" })

    expect(screen.queryByTestId("modern-filter-single-select")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modern-filter-item")).not.toBeInTheDocument()
    expect(screen.getByText("Average")).toBeInTheDocument()
  })
})

describe("filter dropdowns, modern flavour", () => {
  const modern = { designFlavour: "modern" }

  it("renders search, columns and footer per node", async () => {
    await openDropdown(Nodes, modern)

    const dropdown = screen.getByTestId("modern-filter-dropdown")
    expect(within(dropdown).getByPlaceholderText("Search 6 nodes")).toBeInTheDocument()
    expect(within(dropdown).getByText("Node")).toBeInTheDocument()
    expect(within(dropdown).getByText("Share of volume")).toBeInTheDocument()
    expect(within(dropdown).getByText("Anomaly")).toBeInTheDocument()
    expect(within(dropdown).getByText("Alerts")).toBeInTheDocument()
    expect(within(dropdown).getByText("prod-db-1")).toBeInTheDocument()
    expect(within(dropdown).getByText("31%")).toBeInTheDocument()
    expect(within(dropdown).getByText("12%")).toBeInTheDocument()
    expect(screen.getByTestId("modern-filter-selected")).toHaveTextContent("of 6 selected")
    expect(screen.getByTestId("modern-filter-apply")).toBeInTheDocument()
    expect(screen.getByTestId("modern-filter-clear")).toBeInTheDocument()
    expect(screen.getByTestId("modern-filter-reset")).toBeInTheDocument()
  })

  it("shows alert pills only for non-zero counts", async () => {
    await openDropdown(Nodes, modern)

    expect(screen.getAllByTestId("modern-filter-alerts-critical")).toHaveLength(1)
    expect(screen.getAllByTestId("modern-filter-alerts-warning")).toHaveLength(1)
    expect(screen.getAllByTestId("modern-filter-alerts-clear")).toHaveLength(3)
    expect(screen.getByTestId("modern-filter-alerts-warning")).toHaveTextContent("2")
  })

  it("mutes a zero anomaly rate", async () => {
    await openDropdown(Nodes, modern)

    const anomalies = screen.getAllByTestId("modern-filter-anomaly").map(el => el.textContent)
    expect(anomalies).toEqual(expect.arrayContaining(["0", "4%", "12%", "1%"]))
  })

  it("hides secondary columns behind the column toggle", async () => {
    const { chart } = await openDropdown(Nodes, modern)

    expect(screen.queryByText("Min")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modern-filter-columns")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("modern-filter-columns-toggle"))
    const toggles = screen.getByTestId("modern-filter-columns")
    ;["Instances", "Metrics", "Min", "Avg", "Max", "Range"].forEach(name =>
      expect(within(toggles).getByText(name)).toBeInTheDocument()
    )

    fireEvent.click(within(toggles).getByText("Min"))

    expect(chart.getAttribute("filterColumnVisibility")).toMatchObject({ min: true })
    await waitFor(() =>
      expect(screen.getAllByTestId("netdata-table-cell-min").length).toBeGreaterThan(0)
    )
  })

  it("keeps a column hidden after toggling it off", async () => {
    const { chart } = await openDropdown(Nodes, modern)

    fireEvent.click(screen.getByTestId("modern-filter-columns-toggle"))
    fireEvent.click(within(screen.getByTestId("modern-filter-columns")).getByText("Alerts"))

    expect(chart.getAttribute("filterColumnVisibility")).toMatchObject({ alerts: false })
    await waitFor(() =>
      expect(screen.queryAllByTestId("modern-filter-alerts-critical")).toHaveLength(0)
    )
  })

  it("filters rows with the search field", async () => {
    await openDropdown(Nodes, modern)

    fireEvent.change(screen.getByPlaceholderText("Search 6 nodes"), {
      target: { value: "edge" },
    })

    await waitFor(() => expect(screen.queryByText("prod-db-1")).not.toBeInTheDocument())
    expect(screen.getByText("prod-edge-1")).toBeInTheDocument()
    expect(screen.getByText("prod-edge-2")).toBeInTheDocument()
  })

  it("applies the selection on Apply", async () => {
    const { chart } = await openDropdown(Nodes, modern)

    fireEvent.click(screen.getByText("prod-db-1"))
    await waitFor(() =>
      expect(screen.getByTestId("modern-filter-selected")).toHaveTextContent("1 of 6 selected")
    )
    expect(screen.getByTestId("modern-filter-reset")).not.toBeDisabled()

    await act(async () => fireEvent.click(screen.getByTestId("modern-filter-apply")))

    expect(screen.queryByTestId("modern-filter-dropdown")).not.toBeInTheDocument()
    expect(chart.getAttribute("selectedNodes")).toEqual(["nd-prod-db-1"])
  })

  it("resets to the selection the dropdown opened with", async () => {
    await openDropdown(Nodes, modern)

    expect(screen.getByTestId("modern-filter-reset")).toBeDisabled()
    fireEvent.click(screen.getByText("prod-db-1"))
    await waitFor(() => expect(screen.getByTestId("modern-filter-reset")).not.toBeDisabled())

    fireEvent.click(screen.getByTestId("modern-filter-reset"))

    await waitFor(() =>
      expect(screen.getByTestId("modern-filter-selected")).toHaveTextContent("0 of 6 selected")
    )
    expect(screen.getByTestId("modern-filter-reset")).toBeDisabled()
  })

  it("resets to a non-empty opening selection", async () => {
    await openDropdown(Nodes, { ...modern, selectedNodes: ["nd-prod-db-1"] })

    await waitFor(() =>
      expect(screen.getByTestId("modern-filter-selected")).toHaveTextContent("1 of 6 selected")
    )
    expect(screen.getByTestId("modern-filter-reset")).toBeDisabled()

    fireEvent.click(screen.getByText("prod-edge-1"))
    await waitFor(() =>
      expect(screen.getByTestId("modern-filter-selected")).toHaveTextContent("2 of 6 selected")
    )
    fireEvent.click(screen.getByTestId("modern-filter-reset"))

    await waitFor(() =>
      expect(screen.getByTestId("modern-filter-selected")).toHaveTextContent("1 of 6 selected")
    )
    expect(screen.getByTestId("modern-filter-reset")).toBeDisabled()
  })

  it("clears the selection", async () => {
    const { chart } = await openDropdown(Nodes, {
      ...modern,
      selectedNodes: ["nd-prod-db-1"],
    })

    await waitFor(() =>
      expect(screen.getByTestId("modern-filter-selected")).toHaveTextContent("1 of 6 selected")
    )
    fireEvent.click(screen.getByTestId("modern-filter-clear"))
    await waitFor(() =>
      expect(screen.getByTestId("modern-filter-selected")).toHaveTextContent("0 of 6 selected")
    )

    await act(async () => fireEvent.click(screen.getByTestId("modern-filter-apply")))
    expect(chart.getAttribute("selectedNodes")).toEqual([])
  })

  it("keeps the host labels sidebar", async () => {
    await openDropdown(Nodes, {
      ...modern,
      nodesById: { "nd-prod-db-1": { labels: { env: "prod" } } },
    })

    expect(screen.getByText("env")).toBeInTheDocument()
  })

  it("names the rows after the resource", async () => {
    await openDropdown(Dimensions, modern)

    expect(screen.getByPlaceholderText("Search 3 dimensions")).toBeInTheDocument()
    expect(screen.getByText("Dimension")).toBeInTheDocument()
    expect(screen.getByText("load15")).toBeInTheDocument()
  })

  it("offers the unique column for labels", async () => {
    await openDropdown(Labels, modern)

    fireEvent.click(screen.getByTestId("modern-filter-columns-toggle"))
    expect(
      within(screen.getByTestId("modern-filter-columns")).getByText("Unique")
    ).toBeInTheDocument()
    expect(screen.queryByText("Alerts")).not.toBeInTheDocument()
  })

  it("shows the group by empty selection hint", async () => {
    await openDropdown(GroupBy, modern)

    expect(screen.getByPlaceholderText(/^Search \d+ options$/)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId("modern-filter-clear"))

    await waitFor(() =>
      expect(
        screen.getByText("Deselecting everything will use GROUP BY DIMENSION by default")
      ).toBeInTheDocument()
    )
  })

  it("renders single select items in the modern style", async () => {
    const { chart } = await openDropdown(Aggregate, modern)

    expect(screen.getByTestId("modern-filter-single-select")).toBeInTheDocument()
    expect(screen.getAllByTestId("modern-filter-item").length).toBeGreaterThan(0)

    fireEvent.click(screen.getByText("Sum"))
    expect(chart.getAttribute("aggregationMethod")).toBe("sum")
  })

  it("renders time aggregation in the modern style", async () => {
    await openDropdown(TimeAggregation, modern)

    expect(screen.getByTestId("modern-filter-single-select")).toBeInTheDocument()
    expect(screen.getByText("Minimum")).toBeInTheDocument()
  })

  it("keeps section notes and marks the selected item", () => {
    renderWithChart(
      <ul>
        <ModernItem item={{ justDesc: true, description: "Section note" }} />
        <ModernItem item={{ value: "avg", label: "Average" }} value="avg" onItemClick={() => {}} />
        <ModernItem item={{ value: "sum", label: "Sum" }} value="avg" onItemClick={() => {}} />
      </ul>
    )

    expect(screen.getByTestId("modern-filter-item-description")).toHaveTextContent("Section note")
    expect(screen.getByText("Average").closest("li")).toHaveAttribute("aria-selected", "true")
    expect(screen.getByText("Sum").closest("li")).toHaveAttribute("aria-selected", "false")
  })
})
