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
  it("shows only the alias in the nodes table and keeps selection ids", async () => {
    const chart = await openDropdown(Nodes, { nodesById: aliases })

    fireEvent.click(screen.getByText("Billing DB"))
    await act(async () => fireEvent.click(screen.getByTestId("modern-filter-apply")))

    expect(chart.getAttribute("selectedNodes")).toEqual(["nd-prod-db-1"])
  })

  it("finds an aliased node by its alias and by its hostname", async () => {
    await openDropdown(Nodes, { nodesById: aliases })
    const search = screen.getByPlaceholderText("Search 6 nodes")

    fireEvent.change(search, { target: { value: "billing" } })
    await waitFor(() => expect(screen.queryByText("prod-edge-1")).not.toBeInTheDocument())
    expect(screen.getByText("Billing DB")).toBeInTheDocument()
    expect(screen.queryByText("prod-db-1")).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: "prod-db" } })
    await waitFor(() => expect(screen.queryByText("prod-edge-1")).not.toBeInTheDocument())
    expect(screen.getByText("Billing DB")).toBeInTheDocument()
    expect(screen.queryByText("prod-db-1")).not.toBeInTheDocument()
  })

  it("keeps a node row when only one of its instances matches the search", async () => {
    await openDropdown(Nodes, { nodesById: aliases })
    const search = screen.getByPlaceholderText("Search 6 nodes")

    fireEvent.change(search, { target: { value: "system.load@Billing" } })
    await waitFor(() => expect(screen.queryByText("prod-edge-1")).not.toBeInTheDocument())
    expect(screen.getByText("Billing DB")).toBeInTheDocument()

    fireEvent.change(search, { target: { value: "system.load@prod-db" } })
    await waitFor(() => expect(screen.queryByText("prod-edge-1")).not.toBeInTheDocument())
    expect(screen.getByText("Billing DB")).toBeInTheDocument()
  })

  it("keeps hostnames when no node has an alias", async () => {
    await openDropdown(Nodes, { nodesById: { "nd-prod-db-1": { labels: {} } } })

    expect(screen.getByText("prod-db-1")).toBeInTheDocument()
  })

  it("shows only the alias on instance rows and finds them by hostname", async () => {
    await openDropdown(Instances, { nodesById: aliases })
    const dropdown = screen.getByTestId("modern-filter-dropdown")

    expect(within(dropdown).getByText("system.load@Billing DB")).toBeInTheDocument()
    expect(within(dropdown).getByText("system.load@prod-edge-1")).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/^Search \d+ instances$/), {
      target: { value: "prod-db" },
    })
    await waitFor(() =>
      expect(within(dropdown).queryByText("system.load@prod-edge-1")).not.toBeInTheDocument()
    )
    expect(within(dropdown).getByText("system.load@Billing DB")).toBeInTheDocument()
  })

  it("shows a changed alias without a refetch", async () => {
    const chart = await openDropdown(Nodes, { nodesById: aliases })

    await act(async () =>
      chart.updateAttribute("nodesById", { "nd-prod-db-1": { name: "Ledger DB", labels: {} } })
    )

    expect(await screen.findByText("Ledger DB")).toBeInTheDocument()
  })
})
