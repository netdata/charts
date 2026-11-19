import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import { filterDropdownsPayload } from "../../../fixtures/filterDropdowns"
import Dimensions from "./dimensions"

it.each([
  ["modern", "modernLegend-swatch"],
  ["default", "chartDimensions-color"],
])("uses series IDs for %s Dimensions filter swatches", async (designFlavour, swatchId) => {
  const payload = {
    ...filterDropdownsPayload,
    summary: {
      ...filterDropdownsPayload.summary,
      dimensions: filterDropdownsPayload.summary.dimensions.map(dimension =>
        dimension.id === "load1" ? { ...dimension, nm: "One-minute load" } : dimension
      ),
    },
    view: {
      ...filterDropdownsPayload.view,
      dimensions: {
        ...filterDropdownsPayload.view.dimensions,
        names: ["One-minute load", "load5", "load15"],
      },
    },
  }
  const { chart } = makeTestChart({ attributes: { designFlavour }, mockData: payload })
  chart.doneFetch(payload)
  await waitFor(() => expect(chart.getAttribute("loaded")).toBe(true))
  renderWithChart(<Dimensions />, { chart })
  fireEvent.click(screen.getAllByRole("button")[0])

  const swatch = label =>
    within(screen.getByText(label).closest('[data-testid^="netdata-table-row"]')).getByTestId(
      swatchId
    )

  act(() => chart.updateAttribute("colorOverrides", { load5: "#334455", load1: "#112233" }))
  expect(chart.selectDimensionColor("load1")).toBe("#112233")
  expect(swatch("load5")).toHaveStyle({ backgroundColor: "#334455" })
  expect(swatch("One-minute load")).toHaveStyle({ backgroundColor: "#112233" })
})
