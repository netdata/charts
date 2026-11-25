import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import { filterDropdownsPayload } from "../../../fixtures/filterDropdowns"
import GroupBy from "./groupBy"
import PostGroupBy from "./postGroupBy"

const openDropdown = async (Component, attributes = {}) => {
  const { chart } = makeTestChart({
    attributes: { ...attributes },
    mockData: filterDropdownsPayload,
  })
  chart.doneFetch(filterDropdownsPayload)
  await waitFor(() => expect(chart.getAttribute("loaded")).toBe(true))
  renderWithChart(<Component />, { chart })
  fireEvent.click(screen.getAllByRole("button")[0])
}

const systems = { instance: { one: "system", other: "systems" } }

describe.each([
  ["group by", GroupBy],
  ["post group by", PostGroupBy],
])("expand label of the instance row in %s", (_, Component) => {
  it.each([
    ["modern", "modern"],
    ["legacy", "default"],
  ])("names the instances in the %s dropdown", async (__, designFlavour) => {
    await openDropdown(Component, { designFlavour })

    expect(within(screen.getByRole("listbox")).getAllByText("instances")).not.toHaveLength(0)
  })

  it.each([
    ["modern", "modern"],
    ["legacy", "default"],
  ])("uses the chart's own instance naming in the %s dropdown", async (__, designFlavour) => {
    await openDropdown(Component, { designFlavour, en: systems })

    expect(within(screen.getByRole("listbox")).getAllByText("systems")).not.toHaveLength(0)
  })
})
