import React from "react"
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import { filterDropdownsPayload } from "../../../fixtures/filterDropdowns"
import Nodes from "./nodes"
import Instances from "./instances"

const modern = { designFlavour: "modern" }
const aliases = { "nd-prod-db-1": { name: "Billing DB", labels: {} } }

const openDropdown = async (Component, attributes) => {
  const { chart } = makeTestChart({
    attributes: { ...modern, ...attributes },
    mockData: filterDropdownsPayload,
  })
  chart.doneFetch(filterDropdownsPayload)
  await waitFor(() => expect(chart.getAttribute("loaded")).toBe(true))
  renderWithChart(<Component />, { chart })
  fireEvent.click(screen.getAllByRole("button")[0])
  return chart
}

describe("node alias in the filter dropdowns", () => {
  it("shows the alias with the hostname in the nodes table and keeps selection ids", async () => {
    const chart = await openDropdown(Nodes, { nodesById: aliases })

    fireEvent.click(screen.getByText("Billing DB (prod-db-1)"))
    await act(async () => fireEvent.click(screen.getByTestId("modern-filter-apply")))

    expect(chart.getAttribute("selectedNodes")).toEqual(["nd-prod-db-1"])
  })

  it("finds an aliased node by its alias and by its hostname", async () => {
    await openDropdown(Nodes, { nodesById: aliases })
    const search = screen.getByPlaceholderText("Search 6 nodes")

    fireEvent.change(search, { target: { value: "billing" } })
    await waitFor(() => expect(screen.queryByText("prod-edge-1")).not.toBeInTheDocument())
    expect(screen.getByText("Billing DB (prod-db-1)")).toBeInTheDocument()

    fireEvent.change(search, { target: { value: "prod-db" } })
    await waitFor(() => expect(screen.queryByText("prod-edge-1")).not.toBeInTheDocument())
    expect(screen.getByText("Billing DB (prod-db-1)")).toBeInTheDocument()
  })

  it("keeps hostnames when no node has an alias", async () => {
    await openDropdown(Nodes, { nodesById: { "nd-prod-db-1": { labels: {} } } })

    expect(screen.getByText("prod-db-1")).toBeInTheDocument()
  })

  it("shows the alias on the instance rows of a node and in the instances table", async () => {
    await openDropdown(Instances, { nodesById: aliases })
    const dropdown = screen.getByTestId("modern-filter-dropdown")

    expect(within(dropdown).getByText("system.load@Billing DB (prod-db-1)")).toBeInTheDocument()
    expect(within(dropdown).getByText("system.load@prod-edge-1")).toBeInTheDocument()
  })

  it("shows a changed alias without a refetch", async () => {
    const chart = await openDropdown(Nodes, { nodesById: aliases })

    await act(async () =>
      chart.updateAttribute("nodesById", { "nd-prod-db-1": { name: "Ledger DB", labels: {} } })
    )

    expect(await screen.findByText("Ledger DB (prod-db-1)")).toBeInTheDocument()
  })
})
