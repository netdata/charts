import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import Header from "@/components/header"

const renderModern = async (attributes = {}, props = { hasFilters: true }) => {
  const { chart } = makeTestChart({
    attributes: {
      designFlavour: "modern",
      title: "System load",
      locale: "en-US",
      focused: true,
      ...attributes,
    },
  })
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

const openGroup = async (user, id) => {
  await openMenu(user)
  await user.click(screen.getByTestId(`chartMore-group-${id}`))
}

const drilledIds = () =>
  Array.from(screen.getByTestId("chartMore-drilled").querySelectorAll('[role^="menuitem"]'))
    .map(item => item.dataset.testid)
    .filter(testId => testId !== "chartMore-back")

describe("Modern menu chart settings", () => {
  it("names the Show group Display and lists the display settings in it", async () => {
    const { user } = await renderModern()
    await openGroup(user, "show")

    expect(screen.getByTestId("chartMore-back")).toHaveTextContent("← Display")
    expect(drilledIds()).toEqual(
      expect.arrayContaining([
        "chartMore-xAxis",
        "chartMore-yAxis",
        "chartMore-legend",
        "chartMore-units",
      ])
    )
    expect(screen.queryByTestId("chartMore-thresholds")).not.toBeInTheDocument()
  })

  it("lists the data settings and leaves time aggregation to the filters bar", async () => {
    const { user } = await renderModern()
    await openGroup(user, "data")

    expect(drilledIds()).toEqual(
      expect.arrayContaining(["chartMore-nulls2zero", "chartMore-points"])
    )
    expect(screen.queryByTestId("chartMore-timeAggregation")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartMore-tab-data")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartMore-tab-display")).not.toBeInTheDocument()
  })

  it("offers time aggregation in the menu when the chart has no filters bar", async () => {
    const { user, chart } = await renderModern({}, { hasFilters: false })
    await openGroup(user, "data")

    await user.click(screen.getByTestId("chartMore-timeAggregation"))

    const drilled = within(screen.getByTestId("chartMore-drilled"))
    expect(drilled.getByText("Time aggregation", { selector: "*:not(button)" })).toBeVisible()
    expect(drilled.getByRole("combobox")).toBeInTheDocument()
    expect(chart.getAttribute("groupingMethod")).toBe("average")
  })

  it("lists download, reset and reload in Actions without the old tabs", async () => {
    const { user } = await renderModern()
    await openGroup(user, "actions")

    expect(drilledIds()).toEqual([
      "chartMore-download",
      "chartMore-resetSettings",
      "chartMore-reload",
    ])
  })

  it("opens the download options straight from Actions", async () => {
    const { user } = await renderModern()
    await openGroup(user, "actions")

    await user.click(screen.getByTestId("chartMore-download"))

    expect(screen.getByTestId("chartMore-back")).toHaveTextContent("← Download")
    expect(drilledIds()).toEqual([
      "chartMore-download-csv",
      "chartMore-download-raw",
      "chartMore-download-pdf",
      "chartMore-download-png",
    ])
  })

  it("changes the chart type from the root", async () => {
    const { user, chart } = await renderModern()
    await openMenu(user)

    expect(screen.getByTestId("chartMore-chartType")).toHaveTextContent("Line")
    await user.click(screen.getByTestId("chartMore-chartType"))
    expect(screen.getByTestId("chartMore-chartType-area").querySelector("svg")).toBeInTheDocument()
    await user.click(screen.getByTestId("chartMore-chartType-area"))

    expect(chart.getAttribute("chartType")).toBe("area")
  })

  it("toggles the X axis", async () => {
    const { user, chart } = await renderModern()
    await openGroup(user, "show")

    await user.click(screen.getByTestId("chartMore-xAxis"))

    expect(chart.getAttribute("enabledXAxis")).toBe(false)
  })

  it("hides the Y axis and sets its range from the Y axis panel", async () => {
    const { user, chart } = await renderModern()
    await openGroup(user, "show")
    await user.click(screen.getByTestId("chartMore-yAxis"))

    await user.click(screen.getByTestId("chartMore-yAxis-visible"))
    expect(chart.getAttribute("enabledYAxis")).toBe(false)

    fireEvent.change(screen.getByTestId("chartSettings-valueRange-min"), { target: { value: "5" } })
    expect(chart.getAttribute("staticValueRange")).toEqual([5, null])
  })

  it("keeps arrow keys inside a number input", async () => {
    const { user } = await renderModern()
    await openGroup(user, "show")
    await user.click(screen.getByTestId("chartMore-yAxis"))
    const input = screen.getByTestId("chartSettings-valueRange-min")
    input.focus()

    await user.keyboard("{ArrowDown}")

    expect(input).toHaveFocus()
  })

  it("picks the legend layout or hides the legend from one list", async () => {
    const { user, chart } = await renderModern()
    await openGroup(user, "show")
    await user.click(screen.getByTestId("chartMore-legend"))

    await user.click(screen.getByTestId("chartMore-legend-below"))
    expect(chart.getAttribute("chartLegendLayout")).toBe("below")
    expect(chart.getAttribute("legend")).toBe(true)

    await user.click(screen.getByTestId("chartMore-legend"))
    await user.click(screen.getByTestId("chartMore-legend-hidden"))
    expect(chart.getAttribute("legend")).toBe(false)

    await user.click(screen.getByTestId("chartMore-legend"))
    await user.click(screen.getByTestId("chartMore-legend-auto"))
    expect(chart.getAttribute("legend")).toBe(true)
    expect(chart.getAttribute("chartLegendLayout")).toBe(null)
  })

  it("keeps the layout locked by the personal setting but still allows hiding", async () => {
    const { user, chart } = await renderModern({ legendLayout: "table" })
    await openGroup(user, "show")
    await user.click(screen.getByTestId("chartMore-legend"))

    expect(screen.getByTestId("chartMore-legend-below")).toBeDisabled()
    expect(screen.getByTestId("chartMore-legend-table")).toHaveAttribute("aria-checked", "true")
    expect(screen.getByTestId("chartMore-legend-locked")).toBeInTheDocument()

    await user.click(screen.getByTestId("chartMore-legend-hidden"))
    expect(chart.getAttribute("legend")).toBe(false)
  })

  it("treats gaps as zero and refetches", async () => {
    const { user, chart } = await renderModern()
    let fetches = 0
    chart.on("finishFetch", () => (fetches += 1))
    await openGroup(user, "data")

    await user.click(screen.getByTestId("chartMore-nulls2zero"))

    expect(chart.getAttribute("nulls2zero")).toBe(true)
    await waitFor(() => expect(fetches).toBeGreaterThan(0))
  })

  it("sets the data points from the Data points panel", async () => {
    const { user, chart } = await renderModern()
    await openGroup(user, "data")
    await user.click(screen.getByTestId("chartMore-points"))

    fireEvent.change(screen.getByTestId("chartSettings-points"), { target: { value: "300" } })

    expect(chart.getAttribute("points")).toBe(300)
  })

  it("shows gauge thresholds only for gauges", async () => {
    const { user } = await renderModern({ chartLibrary: "gauge" })
    await openGroup(user, "show")

    expect(screen.getByTestId("chartMore-thresholds")).toBeInTheDocument()
  })

  it("resets every chart setting and is disabled while nothing changed", async () => {
    const { user, chart } = await renderModern()
    await openGroup(user, "actions")
    expect(screen.getByTestId("chartMore-resetSettings")).toBeDisabled()

    act(() => chart.updateAttributes({ enabledXAxis: false, nulls2zero: true }))
    await waitFor(() => expect(screen.getByTestId("chartMore-resetSettings")).toBeEnabled())
    await user.click(screen.getByTestId("chartMore-resetSettings"))

    expect(chart.getAttribute("enabledXAxis")).toBe(true)
    expect(chart.getAttribute("nulls2zero")).toBe(false)
  })

  it("does not count the time-series renderer as a change to reset", async () => {
    const { user, chart } = await renderModern({ chartLibrary: "uplot" })
    await openGroup(user, "actions")

    expect(screen.getByTestId("chartMore-resetSettings")).toBeDisabled()

    act(() => chart.updateAttributes({ enabledXAxis: false }))
    await waitFor(() => expect(screen.getByTestId("chartMore-resetSettings")).toBeEnabled())
    await user.click(screen.getByTestId("chartMore-resetSettings"))

    expect(chart.getAttribute("chartLibrary")).toBe("uplot")
    expect(chart.getAttribute("enabledXAxis")).toBe(true)
  })

  it("drops every chart setting when the consumer turns settings off", async () => {
    const { user } = await renderModern({ settingsTabs: [] })
    await openMenu(user)

    expect(screen.queryByTestId("chartMore-chartType")).not.toBeInTheDocument()
    await user.click(screen.getByTestId("chartMore-group-show"))
    expect(screen.queryByTestId("chartMore-xAxis")).not.toBeInTheDocument()
    await user.click(screen.getByTestId("chartMore-back"))
    await user.click(screen.getByTestId("chartMore-group-actions"))
    expect(drilledIds()).toEqual(["chartMore-reload"])
  })
})
