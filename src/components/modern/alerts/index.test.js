import { act, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import Header from "@/components/header"
import { panelDrillPrefix } from "@/components/modern/header/moreMenu"
import { makeAlertsMenu as publicMakeAlertsMenu } from "@/components"
import { makeAlertsMenu, thresholdOverlayId } from "."

const definitions = {
  cpu_usage: { warn: "$this > 80", crit: "$this > 90", plotted: true },
  cpu_steal: { warn: "$this > $green", crit: "$this > $red", plotted: true },
  cpu_pressure: { warn: "$this > 10", crit: "$this > 20", plotted: false },
  cpu_slow: { loading: true },
}

const opened = []

const AlertsElement = () => null
AlertsElement.menu = makeAlertsMenu({
  useAlertDefinition: ({ name }) => definitions[name] || null,
  useAlertActions: ({ name }) => [
    { id: "details", label: "View instances", onClick: () => opened.push(`details:${name}`) },
  ],
  useChartActions: () => [
    { id: "add", label: "New alert for this chart…", onClick: () => opened.push("add") },
  ],
})

const renderAlerts = async (alerts, attributes = {}) => {
  const { chart } = makeTestChart({
    attributes: {
      designFlavour: "modern",
      chartLibrary: "uplot",
      title: "CPU",
      locale: "en-US",
      focused: true,
      toolboxElements: [AlertsElement],
      ...attributes,
    },
  })
  const result = renderWithChart(<Header />, { chart })
  await act(async () => {
    chart.fetch()
  })
  await waitFor(() => expect(chart.getAttribute("loaded")).toBe(true))
  act(() => chart.updateAttribute("alerts", alerts))
  return result
}

const openAlert = async (user, name) => {
  await user.click(screen.getByTestId("chartAttention-status"))
  await user.click(screen.getByRole("menuitem", { name: new RegExp(`^${name}`) }))
}

describe("modern alerts menu", () => {
  beforeEach(() => opened.splice(0))

  it("is part of the public components entry", () => {
    expect(publicMakeAlertsMenu).toBe(makeAlertsMenu)
  })

  it("is a root entry the status dot opens", async () => {
    expect(AlertsElement.menu).toMatchObject({ id: "alerts", group: "root", statusTarget: true })

    const { user, chart } = await renderAlerts({ cpu_usage: { nm: "cpu_usage", wr: 1 } })
    await user.click(screen.getByTestId("chartAttention-status"))

    expect(chart.getAttribute("moreMenu")).toEqual({ drill: ["alerts"] })
    expect(screen.getByTestId("chartMore-back")).toHaveTextContent("← Alerts")
  })

  it("lists raised alerts before the ones that only watch", async () => {
    const { user } = await renderAlerts({
      cpu_steal: { nm: "cpu_steal", cl: 2 },
      cpu_usage: { nm: "cpu_usage", wr: 1, cl: 1 },
    })

    await user.click(screen.getByTestId("chartAttention-status"))

    const rows = screen.getAllByTestId("chartAlerts-row")
    expect(rows.map(row => row.getAttribute("data-alert"))).toEqual(["cpu_usage", "cpu_steal"])
    expect(rows[0]).toHaveTextContent("1 warning of 2")
  })

  it("drills into one alert on the menu stack with a single back row", async () => {
    const { user, chart } = await renderAlerts({ cpu_usage: { nm: "cpu_usage", wr: 1 } })

    await openAlert(user, "cpu_usage")

    expect(chart.getAttribute("moreMenu")).toEqual({
      drill: ["alerts", `${panelDrillPrefix}cpu_usage`],
    })
    expect(screen.getAllByTestId("chartMore-back")).toHaveLength(1)
    expect(screen.getByTestId("chartMore-back")).toHaveTextContent("← cpu_usage")
    expect(screen.getByTestId("chartAlerts-levels")).toHaveTextContent(
      "Warning above 80 threads · Critical above 90 threads"
    )

    await user.click(screen.getByTestId("chartMore-back"))
    expect(screen.getByTestId("chartMore-back")).toHaveTextContent("← Alerts")
  })

  it("draws the levels of a fixed threshold alert and removes them again", async () => {
    const { user, chart } = await renderAlerts({ cpu_usage: { nm: "cpu_usage", wr: 1 } })

    await openAlert(user, "cpu_usage")
    await user.click(screen.getByTestId("chartAlerts-showLevels"))

    expect(chart.getAttribute("overlays")[thresholdOverlayId]).toEqual({
      type: "threshold",
      alert: "cpu_usage",
      warning: 80,
      critical: 90,
      direction: "above",
    })

    await user.click(screen.getByTestId("chartAlerts-showLevels"))
    expect(chart.getAttribute("overlays")[thresholdOverlayId]).toBeUndefined()
  })

  it.each([
    ["cpu_steal", "Not a fixed level", {}],
    ["cpu_pressure", "Measures another value", {}],
    ["cpu_slow", "Loading…", {}],
    ["cpu_usage", "Not on this renderer", { chartLibrary: "dygraph" }],
  ])("disables the chart levels of %s with a reason", async (name, reason, attributes) => {
    const { user } = await renderAlerts({ [name]: { nm: name, cl: 1 } }, attributes)

    await user.click(screen.getByTestId("chartAttention-status"))
    await user.click(screen.getByTestId("chartAlerts-row"))

    expect(screen.getByTestId("chartAlerts-showLevels")).toBeDisabled()
    expect(screen.getByTestId("chartAlerts-showLevels")).toHaveTextContent(reason)
  })

  it("runs the consumer actions", async () => {
    const { user } = await renderAlerts({ cpu_usage: { nm: "cpu_usage", wr: 1 } })

    await user.click(screen.getByTestId("chartAttention-status"))
    await user.click(screen.getByTestId("chartAlerts-add"))
    await openAlert(user, "cpu_usage")
    await user.click(screen.getByTestId("chartAlerts-details"))

    expect(opened).toEqual(["add", "details:cpu_usage"])
  })

  it("falls back to the list when the drilled alert is gone", async () => {
    const { user, chart } = await renderAlerts({ cpu_usage: { nm: "cpu_usage", wr: 1 } })
    await openAlert(user, "cpu_usage")

    act(() => chart.updateAttribute("alerts", { cpu_steal: { nm: "cpu_steal", cl: 1 } }))

    expect(screen.getByTestId("chartMore-back")).toHaveTextContent("← Alerts")
    expect(screen.getByTestId("chartAlerts-row")).toHaveAttribute("data-alert", "cpu_steal")
  })

  it("says so when no alert watches the chart", async () => {
    const { user } = await renderAlerts({})

    await user.click(screen.getByTestId("chartHeaderToolbox-more"))
    await user.click(await screen.findByTestId("chartMore-alerts"))

    expect(screen.getByTestId("chartAlerts-empty")).toBeInTheDocument()
  })
})
