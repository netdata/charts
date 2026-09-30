import React from "react"
import { act, screen, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import Header from "@/components/header"
import ChartContentWrapper from "@/components/line/chartContentWrapper"

const AddToDashboard = ({ disabled }) => (
  <button type="button" disabled={disabled}>
    Add to dashboard
  </button>
)

const ChartOptions = () => <span>Chart options</span>

const makeModern = (attributes = {}) =>
  makeTestChart({ attributes: { designFlavour: "modern", title: "System load", ...attributes } })

const renderModern = async (attributes, props = { hasFilters: true }) => {
  const { chart } = makeModern(attributes)
  const result = renderWithChart(<Header {...props} />, { chart })
  await act(async () => {
    chart.fetch()
  })
  await waitFor(() => expect(chart.getAttribute("loaded")).toBe(true))
  return result
}

const openMenu = async user => {
  await user.click(screen.getByTestId("chartHeaderToolbox-more"))
  return screen.findByTestId("chartMoreMenu")
}

describe("Modern header", () => {
  it("renders the title row, the scope line and consumer toolbox elements", async () => {
    await renderModern({
      focused: true,
      toolboxElements: [AddToDashboard],
    })

    expect(screen.getByTestId("chartHeader")).toHaveAttribute("data-flavour", "modern")
    expect(screen.getByText("System load")).toBeInTheDocument()
    expect(screen.getByText("Add to dashboard")).toBeEnabled()
    expect(screen.getByTestId("chartHeaderToolbox-filters")).toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderToolbox-more")).toBeInTheDocument()

    const scope = screen.getByTestId("chartScope")
    expect(scope).toHaveTextContent("Group by dimension")
    expect(scope).toHaveTextContent("1 node")
    expect(scope).toHaveTextContent("3 dimensions")
  })

  it("disables toolbox elements until the card is focused, as the default header does", async () => {
    await renderModern({ focused: false, toolboxElements: [AddToDashboard] })

    expect(screen.getByText("Add to dashboard")).toBeDisabled()
  })

  it("moves the default Status out of the title row but keeps consumer left elements", async () => {
    await renderModern({ leftHeaderElements: [ChartOptions] })

    expect(screen.getByText("Chart options")).toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderStatus")).not.toBeInTheDocument()
  })

  it("opens the existing FilterToolbox from the scope line and the filters action", async () => {
    const { user, chart } = await renderModern({ focused: true })

    expect(screen.queryByTestId("chartFilters")).not.toBeInTheDocument()

    await user.click(screen.getByTestId("chartScope"))
    expect(screen.getByTestId("chartFilters")).toBeInTheDocument()
    expect(chart.getAttribute("filtersOpen")).toBe(true)

    await user.click(screen.getByTestId("chartHeaderToolbox-filters"))
    expect(screen.queryByTestId("chartFilters")).not.toBeInTheDocument()
  })

  it("has no filter action when the card has no filters", async () => {
    await renderModern({ focused: true }, { hasFilters: false })

    expect(screen.queryByTestId("chartHeaderToolbox-filters")).not.toBeInTheDocument()
    expect(screen.getByTestId("chartScope")).toBeDisabled()
  })

  it("shows the loading state in the scope line before the first payload", () => {
    const { chart } = makeModern()
    renderWithChart(<Header hasFilters />, { chart })

    expect(screen.getByTestId("chartScope-loading")).toHaveTextContent("Loading")
  })

  it("shows the error state in the scope line", async () => {
    const { chart } = makeTestChart({
      attributes: { designFlavour: "modern" },
      mockData: { errorMsgKey: "ErrQuery", errorMessage: "Query failed" },
    })
    renderWithChart(<Header hasFilters />, { chart })
    act(() => {
      chart.fetch()
    })

    expect(await screen.findByTestId("chartScope-error")).toHaveTextContent(/^Error: /)
  })

  it("shows the no data state in the scope line", () => {
    const { chart } = makeTestChart({ attributes: { designFlavour: "modern", loaded: true } })
    renderWithChart(<Header hasFilters />, { chart })

    expect(screen.getByTestId("chartScope-empty")).toHaveTextContent("No data")
  })

  it("shows within thresholds when the attached alerts are clear", async () => {
    await renderModern()

    expect(screen.getByTestId("chartAttention")).toHaveAttribute("data-status", "clear")
    expect(screen.getByText("Within thresholds")).toBeInTheDocument()
  })

  it("shows the raised alert, its triggered value and units", async () => {
    const { chart } = await renderModern()

    act(() => {
      chart.updateAttributes({
        alerts: { load_average_15: { nm: "load_average_15", wr: 1 } },
        overlays: { alarm: { type: "alarm", status: "warning", value: 31.86, when: 1000 } },
      })
    })

    const attention = screen.getByTestId("chartAttention")
    expect(attention).toHaveAttribute("data-status", "warning")
    expect(within(attention).getByText("Warning")).toBeInTheDocument()
    expect(screen.getByTestId("chartAttention-value")).toHaveTextContent("31.86")
    expect(attention).toHaveTextContent("load_average_15 raised since")
  })

  it("shows nothing on the right when no alert data exists", async () => {
    const { chart } = await renderModern()

    act(() => chart.updateAttribute("alerts", {}))

    expect(screen.queryByTestId("chartAttention")).not.toBeInTheDocument()
  })
})

describe("Modern More menu", () => {
  it("switches navigation modes through the navigation attribute", async () => {
    const { user, chart } = await renderModern({ focused: true })
    await openMenu(user)

    await user.click(screen.getByTestId("chartMore-navigation-highlight"))
    expect(chart.getAttribute("navigation")).toBe("highlight")

    await user.click(screen.getByTestId("chartMore-navigation-selectVertical"))
    expect(chart.getAttribute("navigation")).toBe("selectVertical")
    expect(screen.getByTestId("chartMore-navigation-selectVertical")).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  it("zooms in and resets back to the default window", async () => {
    const { user, chart } = await renderModern({ focused: true })
    await openMenu(user)

    expect(screen.getByTestId("chartMore-zoomReset")).toBeDisabled()
    expect(screen.getByTestId("chartMore-zoomReset")).toHaveTextContent("Alt+Shift+R")

    await user.click(screen.getByTestId("chartMore-zoomIn"))
    await waitFor(() => expect(chart.getAttribute("after")).toBeGreaterThan(0))

    await user.click(screen.getByTestId("chartMore-zoomReset"))
    await waitFor(() => expect(chart.getAttribute("after")).toBe(-900))
  })

  it("toggles anomalies, annotations, chart info and the dimension sort", async () => {
    const { user, chart } = await renderModern({ focused: true })
    await openMenu(user)

    await user.click(screen.getByTestId("chartMore-anomalies"))
    expect(chart.getAttribute("showAnomalies")).toBe(false)

    await user.click(screen.getByTestId("chartMore-annotations"))
    expect(chart.getAttribute("showAnnotations")).toBe(false)

    await user.click(screen.getByTestId("chartMore-sort"))
    await user.click(screen.getByTestId("chartMore-sort-valueDesc"))
    expect(chart.getAttribute("dimensionsSort")).toBe("valueDesc")

    await user.click(screen.getByTestId("chartMore-info"))
    expect(chart.getAttribute("showingInfo")).toBe(true)
  })

  it("opens the existing settings on the chosen tab", async () => {
    const { user } = await renderModern({ focused: true })
    await openMenu(user)

    expect(screen.getByTestId("chartMore-tab-display")).toBeInTheDocument()
    expect(screen.getByTestId("chartMore-tab-data")).toBeInTheDocument()
    expect(screen.getByTestId("chartMore-tab-info")).toBeInTheDocument()
    expect(screen.getByTestId("chartMore-tab-download")).toBeInTheDocument()

    await user.click(screen.getByTestId("chartMore-tab-download"))

    const settings = await screen.findByTestId("chartSettings")
    expect(within(settings).getByTestId("chartSettings-download-download-as-csv")).toBeVisible()
    expect(within(settings).queryByTestId("chartSettings-chartType")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartMoreMenu")).not.toBeInTheDocument()
  })

  it("reloads the data", async () => {
    const { user, chart } = await renderModern({ focused: true })
    let fetches = 0
    chart.on("finishFetch", () => (fetches += 1))
    await openMenu(user)

    await user.click(screen.getByTestId("chartMore-reload"))

    await waitFor(() => expect(fetches).toBeGreaterThan(0))
  })
})

describe("Modern chart content", () => {
  it("shows a reset chip while zoomed and hides the floating navigation toolbox", async () => {
    const { chart } = makeModern()
    const { user, container } = renderWithChart(<ChartContentWrapper />, { chart })

    expect(screen.queryByTestId("chartZoomChip")).not.toBeInTheDocument()

    await user.hover(container.firstChild)
    expect(screen.queryByTestId("chartToolbox")).not.toBeInTheDocument()

    const now = Math.floor(Date.now() / 1000)
    act(() => chart.updateAttributes({ after: now - 600, before: now - 300 }))

    expect(screen.getByTestId("chartZoomChip")).toHaveTextContent("Zoomed to")

    await user.click(screen.getByTestId("chartZoomChip-reset"))
    await waitFor(() => expect(chart.getAttribute("after")).toBe(-900))
    expect(screen.queryByTestId("chartZoomChip")).not.toBeInTheDocument()
  })
})
