import React from "react"
import { act, screen, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import FilterToolbox from "./index"

const renderToolbox = async (attributes = {}) => {
  const { chart } = makeTestChart({ attributes: { designFlavour: "modern", ...attributes } })
  const result = renderWithChart(<FilterToolbox />, { chart })
  await act(async () => {
    chart.fetch()
  })
  await waitFor(() => expect(chart.getAttribute("loaded")).toBe(true))
  return { ...result, chart }
}

const openNodes = async user => {
  const nodes = within(await screen.findByTestId("chartFilters"))
    .getAllByRole("button")
    .find(button => /^\d+ nodes?$/.test(button.textContent))
  await user.click(nodes)
  return (await screen.findByTestId("modern-filter-dropdown")).closest("[data-toolbox]")
}

const openAggregate = async (user, chart) => {
  const aggregate = screen
    .getByTestId("chartFilters")
    .querySelector(`[data-value="${chart.getAttribute("aggregationMethod")}"]`)
  await user.click(aggregate)
  return (await screen.findByTestId("modern-filter-single-select")).closest("[data-toolbox]")
}

const mockReducedMotion = reduce => {
  const original = window.matchMedia
  window.matchMedia = query => ({
    matches: reduce && query === "(prefers-reduced-motion: reduce)",
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })
  return () => {
    window.matchMedia = original
  }
}

describe("filter chip dropdown animation", () => {
  let restore

  afterEach(() => restore?.())

  it("fades the table dropdown in", async () => {
    restore = mockReducedMotion(false)
    const { user } = await renderToolbox()

    expect(getComputedStyle(await openNodes(user)).opacity).toBe("0")
  })

  it("fades the single select dropdown in", async () => {
    restore = mockReducedMotion(false)
    const { user, chart } = await renderToolbox()

    expect(getComputedStyle(await openAggregate(user, chart)).opacity).toBe("0")
  })

  it("opens the table dropdown without animation when the user prefers reduced motion", async () => {
    restore = mockReducedMotion(true)
    const { user } = await renderToolbox()

    expect(getComputedStyle(await openNodes(user)).opacity).not.toBe("0")
  })

  it("opens the single select dropdown without animation when the user prefers reduced motion", async () => {
    restore = mockReducedMotion(true)
    const { user, chart } = await renderToolbox()

    expect(getComputedStyle(await openAggregate(user, chart)).opacity).not.toBe("0")
  })

  it("keeps the default flavour dropdowns without animation", async () => {
    restore = mockReducedMotion(false)
    const { chart } = makeTestChart({ attributes: { designFlavour: "default" } })
    const { user } = renderWithChart(<FilterToolbox />, { chart })
    await act(async () => {
      chart.fetch()
    })
    await waitFor(() => expect(chart.getAttribute("loaded")).toBe(true))

    const aggregate = screen
      .getByTestId("chartFilters")
      .querySelector(`[data-value="${chart.getAttribute("aggregationMethod")}"]`)
    await user.click(aggregate)
    const [option] = await screen.findAllByRole("option")
    const drop = option.closest("[data-toolbox]")

    expect(getComputedStyle(drop).opacity).not.toBe("0")
  })
})
