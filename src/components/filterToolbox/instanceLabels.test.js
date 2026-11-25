import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import { filterDropdownsPayload } from "../../../fixtures/filterDropdowns"
import Instances from "./instances"
import Nodes from "./nodes"
import GroupBy from "./groupBy"
import PostGroupBy from "./postGroupBy"

const labelledHosts = ["prod-edge-1", "prod-edge-2", "prod-db-1", "prod-cache-1"]
const unlabelledHosts = ["prod-jobs-2", "staging-1"]

const labelsOf = index => ({
  chip_id: `nvme-${index}`,
  feature: `temp${index}`,
  label: `Composite${index}`,
  zone: `z${index}`,
  type: "nvme",
  _collect_job: "sensors",
})

const detailsResponse = {
  detailed: {
    nodes: Object.fromEntries(
      [...labelledHosts, ...unlabelledHosts].map((host, index) => [
        `mg-${host}`,
        {
          nd: `nd-${host}`,
          nm: host,
          contexts: {
            "system.load": {
              instances: {
                "system.load": {
                  nm: "system.load",
                  ...(index < labelledHosts.length && { labels: labelsOf(index + 1) }),
                },
              },
            },
          },
        },
      ])
    ),
  },
}

let requests
let originalFetch
let respond

beforeEach(() => {
  requests = []
  originalFetch = global.fetch
  respond = () => Promise.resolve({ ok: true, json: () => Promise.resolve(detailsResponse) })
  global.fetch = url => {
    requests.push(url)
    return respond()
  }
})

afterEach(() => {
  global.fetch = originalFetch
})

const openDropdown = async (Component, attributes = {}) => {
  const { chart } = makeTestChart({
    attributes: { designFlavour: "modern", ...attributes },
    mockData: filterDropdownsPayload,
  })
  chart.doneFetch(filterDropdownsPayload)
  await waitFor(() => expect(chart.getAttribute("loaded")).toBe(true))
  renderWithChart(<Component />, { chart })
  fireEvent.click(screen.getAllByRole("button")[0])
  return chart
}

const detailRequests = () => requests.filter(url => url.includes("details"))

describe("identifying labels in the instances dropdown", () => {
  it("shows label pairs and the node instead of the opaque instance name", async () => {
    await openDropdown(Instances)
    const dropdown = screen.getByTestId("modern-filter-dropdown")

    expect(await within(dropdown).findByText("nvme-1")).toBeInTheDocument()
    const row = within(dropdown).getByText("nvme-1").closest("[data-testid='instance-identity']")
    const identity = within(row)

    expect(identity.getByText("chip_id")).toBeInTheDocument()
    expect(identity.getByText("feature")).toBeInTheDocument()
    expect(identity.getByText("temp1")).toBeInTheDocument()
    expect(identity.getByText("label")).toBeInTheDocument()
    expect(identity.getByText("Composite1")).toBeInTheDocument()
    expect(identity.getByText("+2")).toBeInTheDocument()
    expect(identity.getByText("@ prod-edge-1")).toBeInTheDocument()
    expect(identity.queryByText("z1")).not.toBeInTheDocument()
    expect(within(dropdown).queryByText("system.load@prod-edge-1")).not.toBeInTheDocument()
    expect(detailRequests()).toHaveLength(1)
  })

  it("uses the node alias as the node name", async () => {
    await openDropdown(Instances, {
      nodesById: { "nd-prod-db-1": { name: "Billing DB", labels: {} } },
    })
    const dropdown = screen.getByTestId("modern-filter-dropdown")

    expect(await within(dropdown).findByText("@ Billing DB")).toBeInTheDocument()
  })

  it("keeps today's text for instances without labels", async () => {
    await openDropdown(Instances)
    const dropdown = screen.getByTestId("modern-filter-dropdown")

    await within(dropdown).findByText("nvme-1")
    expect(within(dropdown).getByText("system.load@prod-jobs-2")).toBeInTheDocument()
    expect(within(dropdown).getByText("system.load@staging-1")).toBeInTheDocument()
  })

  it("keeps today's text when the labels request fails", async () => {
    respond = () => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
    const chart = await openDropdown(Instances)
    const dropdown = screen.getByTestId("modern-filter-dropdown")

    await waitFor(() => expect(chart.getAttribute("instanceLabelsLoading")).toBe(false))
    expect(detailRequests()).toHaveLength(1)
    expect(within(dropdown).getByText("system.load@prod-edge-1")).toBeInTheDocument()
    expect(within(dropdown).queryByText("chip_id")).not.toBeInTheDocument()
  })

  it("finds a labelled instance by its old opaque name and by a label value", async () => {
    await openDropdown(Instances)
    const dropdown = screen.getByTestId("modern-filter-dropdown")
    await within(dropdown).findByText("nvme-1")
    const search = screen.getByPlaceholderText(/^Search \d+ instances$/)

    fireEvent.change(search, { target: { value: "system.load@prod-edge-2" } })
    await waitFor(() => expect(within(dropdown).queryByText("nvme-1")).not.toBeInTheDocument())
    expect(within(dropdown).getByText("nvme-2")).toBeInTheDocument()

    fireEvent.change(search, { target: { value: "Composite3" } })
    await waitFor(() => expect(within(dropdown).queryByText("nvme-2")).not.toBeInTheDocument())
    expect(within(dropdown).getByText("nvme-3")).toBeInTheDocument()
  })

  it("selects the same instance id when a labelled row is clicked", async () => {
    const chart = await openDropdown(Instances)
    const dropdown = screen.getByTestId("modern-filter-dropdown")

    fireEvent.click(await within(dropdown).findByText("nvme-3"))
    await act(async () => fireEvent.click(screen.getByTestId("modern-filter-apply")))

    expect(chart.getAttribute("selectedInstances")).toEqual(["system.load@nd-prod-db-1"])
  })

  it("does not refetch labels it already has", async () => {
    const chart = await openDropdown(Instances)
    await waitFor(() => expect(chart.getAttribute("instanceLabels")).not.toBeNull())

    fireEvent.click(screen.getAllByRole("button")[0])
    fireEvent.click(screen.getAllByRole("button")[0])

    await waitFor(() => expect(chart.getAttribute("instanceLabelsLoading")).toBe(false))
    expect(detailRequests()).toHaveLength(1)
  })

  it("shows label pairs in the legacy dropdown", async () => {
    await openDropdown(Instances, { designFlavour: "default" })

    expect(await screen.findByText("nvme-1")).toBeInTheDocument()
    expect(screen.getByText("@ prod-edge-1")).toBeInTheDocument()
    expect(screen.getByText("system.load@prod-jobs-2")).toBeInTheDocument()
  })
})

const expandRow = text => {
  const row = screen.getByText(text).closest("[role='row'], tr") || screen.getByText(text)
  const toggle = row.parentElement.parentElement.querySelector("[role='button']")
  fireEvent.click(toggle)
}

describe("identifying labels in nested instance rows", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = () => {}
  })

  afterEach(() => {
    delete Element.prototype.scrollIntoView
  })

  it("shows label pairs on the instance sub-rows of a node", async () => {
    await openDropdown(Nodes)
    const dropdown = screen.getByTestId("modern-filter-dropdown")

    expandRow("prod-edge-1")

    expect(await within(dropdown).findByText("nvme-1")).toBeInTheDocument()
    expect(within(dropdown).getByText("@ prod-edge-1")).toBeInTheDocument()
    expect(within(dropdown).queryByText("system.load@prod-edge-1")).not.toBeInTheDocument()
    expect(within(dropdown).getByText("prod-edge-1")).toBeInTheDocument()
    expect(detailRequests()).toHaveLength(1)
  })

  it("keeps today's text for a node instance without labels", async () => {
    await openDropdown(Nodes)
    const dropdown = screen.getByTestId("modern-filter-dropdown")
    await waitFor(() => expect(detailRequests()).toHaveLength(1))

    expandRow("staging-1")

    expect(await within(dropdown).findByText("system.load@staging-1")).toBeInTheDocument()
    expect(within(dropdown).queryByTestId("instance-identity")).not.toBeInTheDocument()
  })

  it("selects the same instance id when a labelled node instance is clicked", async () => {
    const chart = await openDropdown(Nodes)
    const dropdown = screen.getByTestId("modern-filter-dropdown")

    expandRow("prod-db-1")
    fireEvent.click(await within(dropdown).findByText("nvme-3"))
    await act(async () => fireEvent.click(screen.getByTestId("modern-filter-apply")))

    expect(chart.getAttribute("selectedInstances")).toEqual(["system.load@nd-prod-db-1"])
  })

  it.each([
    ["group by", GroupBy],
    ["post group by", PostGroupBy],
  ])("shows label pairs on the instance sub-rows of %s", async (_, Component) => {
    await openDropdown(Component)
    const dropdown = screen.getByTestId("modern-filter-dropdown")
    await waitFor(() => expect(detailRequests()).toHaveLength(1))

    expandRow("instance")

    expect(await within(dropdown).findByText("nvme-1")).toBeInTheDocument()
    expect(within(dropdown).getByText("@ prod-edge-1")).toBeInTheDocument()
    expect(within(dropdown).getByText("system.load@staging-1")).toBeInTheDocument()
  })
})
