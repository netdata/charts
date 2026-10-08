import React from "react"
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import { makePayload, makeWave } from "../../../../fixtures/makeWavePayload"
import Header from "@/components/header"
import Fullscreen from "@/components/toolbox/fullscreen"
import Information from "@/components/toolbox/information"
import Settings from "@/components/toolbox/settings"
import { Line } from "@/components/line"
import ChartContentWrapper from "@/components/line/chartContentWrapper"
import { getScopeParts } from "./scopeSummary"
import { dimensionsLimit } from "./moreMenu"

const AddToDashboard = ({ disabled }) => (
  <button type="button" disabled={disabled}>
    Add to dashboard
  </button>
)

const ChartOptions = () => <span>Chart options</span>

const AlertsPanel = ({ onBack, onClose }) => (
  <>
    <button type="button" role="menuitem" data-testid="alertsPanel-back" onClick={onBack}>
      Panel back
    </button>
    <button type="button" role="menuitem" data-testid="alertsPanel-close" onClick={onClose}>
      Panel close
    </button>
  </>
)

const AskAi = () => null
AskAi.menu = {
  id: "askAi",
  group: "actions",
  order: 10,
  useItem: () => ({ label: "Add to AI conversation", testId: "consumer-askAi", onClick: () => {} }),
}

const Alerts = () => null
Alerts.menu = {
  id: "alerts",
  group: "actions",
  order: 20,
  useItem: () => ({ label: "Alerts", hint: "2", testId: "consumer-alerts", Panel: AlertsPanel }),
}

const WideAlerts = () => null
WideAlerts.menu = {
  ...Alerts.menu,
  id: "wideAlerts",
  useItem: () => ({
    label: "Wide alerts",
    testId: "consumer-wideAlerts",
    Panel: AlertsPanel,
    panelWidth: "360px",
  }),
}

const Hidden = () => null
Hidden.menu = {
  id: "hiddenItem",
  group: "show",
  order: 5,
  useItem: () => ({ label: "Never", hidden: true, testId: "consumer-hidden" }),
}

const Nothing = () => null
Nothing.menu = { id: "nothing", group: "data", order: 5, useItem: () => null }

let effectMounts = 0
const ShortcutEffects = () => {
  React.useEffect(() => {
    effectMounts += 1
  }, [])
  return null
}
const WithShortcut = () => null
WithShortcut.menu = {
  id: "withShortcut",
  group: "actions",
  order: 30,
  useItem: () => ({ label: "With shortcut", testId: "consumer-withShortcut", onClick: () => {} }),
  Effects: ShortcutEffects,
}

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
  it("renders the title row, the scope line and only the More action", async () => {
    await renderModern({
      focused: true,
      toolboxElements: [AddToDashboard, Settings, Fullscreen, Information, AskAi],
    })

    expect(screen.getByTestId("chartHeader")).toHaveAttribute("data-flavour", "modern")
    expect(screen.getByText("System load")).toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderToolbox-filters")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderToolbox-fullscreen")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderToolbox-information")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderToolbox-settings")).not.toBeInTheDocument()
    const toolbox = screen.getByTestId("chartHeaderToolbox")
    expect(within(toolbox).getAllByRole("button")).toEqual([
      screen.getByTestId("chartHeaderToolbox-more"),
    ])

    const scope = screen.getByTestId("chartScope")
    expect(scope).toHaveTextContent("Group by dimension")
    expect(scope).toHaveTextContent("1 node")
    expect(scope).toHaveTextContent("3 dimensions")
  })

  it("renders the scope line as its own line below the title row", async () => {
    await renderModern({ focused: true })

    const header = screen.getByTestId("chartHeader")
    const scopeLine = screen.getByTestId("chartScope").parentElement
    expect(scopeLine.parentElement).toBe(header)
    expect(within(scopeLine).queryByText("System load")).not.toBeInTheDocument()
  })

  it("overlays the toolbox on the title row instead of reserving space for it", async () => {
    await renderModern({ focused: false })

    const toolbox = screen.getByTestId("chartHeaderToolbox")
    expect(toolbox).toHaveStyle({ position: "absolute" })
    expect(toolbox).toHaveAttribute("data-hidden", "true")
  })

  it("marks the overlaid toolbox visible once the card is focused", async () => {
    await renderModern({ focused: true })

    expect(screen.getByTestId("chartHeaderToolbox")).toHaveAttribute("data-hidden", "false")
  })

  it("leaves toolbox elements without a menu descriptor out of the header and the menu", async () => {
    const { user } = await renderModern({ focused: true, toolboxElements: [AddToDashboard] })

    expect(screen.queryByText("Add to dashboard")).not.toBeInTheDocument()
    const menu = await openMenu(user)
    expect(within(menu).queryByText("Add to dashboard")).not.toBeInTheDocument()
  })

  it("mounts the menu Effects of toolbox elements without opening the menu", async () => {
    effectMounts = 0
    await renderModern({ focused: false, toolboxElements: [WithShortcut] })

    expect(effectMounts).toBe(1)
    expect(screen.queryByTestId("chartMoreMenu")).not.toBeInTheDocument()
  })

  it("makes the title row the drag handle when the consumer passes drag props", async () => {
    let pointerDowns = 0
    const { user } = await renderModern({
      focused: true,
      toolboxProps: {
        drag: {
          dragging: false,
          role: "button",
          tabIndex: 0,
          "aria-roledescription": "draggable",
          onPointerDown: () => (pointerDowns += 1),
        },
      },
    })

    const handle = screen.getByTestId("chartHeaderToolbox-drag")
    expect(within(handle).getByText("System load")).toBeInTheDocument()
    expect(within(handle).getByTestId("chartHeaderDrag-grip")).toBeInTheDocument()
    expect(handle).toHaveAttribute("aria-roledescription", "draggable")
    expect(handle).not.toHaveAttribute("dragging")
    expect(handle).toHaveStyle({ cursor: "grab" })
    expect(within(handle).queryByTestId("chartHeaderToolbox-more")).not.toBeInTheDocument()

    fireEvent.pointerDown(screen.getByText("System load"))
    expect(pointerDowns).toBe(1)

    await user.click(screen.getByTestId("chartScope"))
    expect(screen.getByTestId("chartFilters")).toBeInTheDocument()
  })

  it("shows the grabbing cursor while dragging", async () => {
    await renderModern({ toolboxProps: { drag: { dragging: true } } })

    expect(screen.getByTestId("chartHeaderToolbox-drag")).toHaveStyle({ cursor: "grabbing" })
  })

  it("has no drag handle without drag props", async () => {
    await renderModern({ focused: true })

    expect(screen.queryByTestId("chartHeaderToolbox-drag")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderDrag-grip")).not.toBeInTheDocument()
  })

  it("moves the default Status out of the title row but keeps consumer left elements", async () => {
    await renderModern({ leftHeaderElements: [ChartOptions] })

    expect(screen.getByText("Chart options")).toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderStatus")).not.toBeInTheDocument()
  })

  it("opens the existing FilterToolbox from the scope line and the Data filters item", async () => {
    const { user, chart } = await renderModern({ focused: true })

    expect(screen.queryByTestId("chartFilters")).not.toBeInTheDocument()

    await user.click(screen.getByTestId("chartScope"))
    expect(screen.getByTestId("chartFilters")).toBeInTheDocument()
    expect(chart.getAttribute("filtersOpen")).toBe(true)

    await openMenu(user)
    const filters = within(screen.getByTestId("chartMore-group-data")).getByTestId(
      "chartMore-filters"
    )
    expect(filters).toHaveTextContent("Hide filters")
    await user.click(filters)
    expect(screen.queryByTestId("chartFilters")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartMoreMenu")).not.toBeInTheDocument()

    await openMenu(user)
    expect(screen.getByTestId("chartMore-filters")).toHaveTextContent("Show filters")
  })

  it("has no filter action when the card has no filters", async () => {
    const { user } = await renderModern({ focused: true }, { hasFilters: false })

    expect(screen.getByTestId("chartScope")).toBeDisabled()
    await openMenu(user)
    expect(screen.queryByTestId("chartMore-filters")).not.toBeInTheDocument()
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

  it("shows a quiet dot when the attached alerts are clear and describes it on hover", async () => {
    const { chart } = await renderModern()
    const watching = Object.keys(chart.getAttribute("alerts")).length

    const attention = screen.getByTestId("chartAttention")
    expect(attention).toHaveAttribute("data-status", "clear")
    expect(attention).toHaveTextContent(/^$/)
    expect(screen.queryByText("Within thresholds")).not.toBeInTheDocument()

    const status = screen.getByTestId("chartAttention-status")
    expect(status).toHaveAttribute("data-status", "clear")
    fireEvent.mouseEnter(status)
    expect(
      await screen.findByText(
        `${watching} ${watching === 1 ? "alert watches" : "alerts watch"} this chart, none is raised`
      )
    ).toBeInTheDocument()
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
    expect(screen.getByTestId("chartAttention-status")).toHaveAttribute("data-status", "warning")
    expect(within(attention).getByText("1 warning")).toBeInTheDocument()
    expect(screen.getByTestId("chartAttention-value")).toHaveTextContent("31.86")
    expect(attention).toHaveTextContent("load_average_15 raised since")
  })

  it("shows critical as the prominent pill with the instance count", async () => {
    const { chart } = await renderModern()

    act(() => {
      chart.updateAttribute("alerts", {
        disk_full: { nm: "disk_full", cr: 2 },
        load_average_15: { nm: "load_average_15", wr: 1 },
      })
    })

    const status = screen.getByTestId("chartAttention-status")
    expect(status).toHaveAttribute("data-status", "critical")
    expect(within(status).getByText("2 critical")).toBeInTheDocument()

    fireEvent.mouseEnter(status)
    expect(
      (await screen.findAllByTestId("modernStatus-name")).map(node => node.textContent)
    ).toEqual(["disk_full", "load_average_15"])
  })

  it("names the level without a count when only an overlay raised it", async () => {
    const { chart } = await renderModern()

    act(() => {
      chart.updateAttributes({
        alerts: {},
        overlays: { alarm: { type: "alarm", status: "critical", value: 9, when: 1000 } },
      })
    })

    expect(screen.getByTestId("chartAttention-status")).toHaveTextContent("Critical")
  })

  it.each(["default", "minimal"])(
    "renders no status indicator for the %s flavour with raised alerts",
    async designFlavour => {
      const { chart } = await renderModern({ designFlavour })

      act(() => chart.updateAttribute("alerts", { disk_full: { nm: "disk_full", cr: 1 } }))

      expect(screen.queryByTestId("chartAttention")).not.toBeInTheDocument()
      expect(screen.queryByTestId("chartAttention-status")).not.toBeInTheDocument()
      expect(screen.queryByTestId("modernStatus-dot")).not.toBeInTheDocument()
      expect(screen.queryByText("1 critical")).not.toBeInTheDocument()
    }
  )

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
    const { user, chart } = await renderModern({ focused: true, legendMode: "below" })
    await openMenu(user)

    await user.click(screen.getByTestId("chartMore-anomalies"))
    expect(chart.getAttribute("showAnomalies")).toBe(false)

    await user.click(screen.getByTestId("chartMore-annotations"))
    expect(chart.getAttribute("showAnnotations")).toBe(false)

    await user.click(screen.getByTestId("chartMore-sort"))
    expect(screen.getByTestId("chartMore-back")).toHaveTextContent("← Sort dimensions")
    await user.click(screen.getByTestId("chartMore-sort-valueDesc"))
    expect(chart.getAttribute("dimensionsSort")).toBe("valueDesc")
    expect(screen.getByTestId("chartMore-sort")).toHaveTextContent("Value Max→Min")

    await user.click(screen.getByTestId("chartMore-info"))
    expect(chart.getAttribute("showingInfo")).toBe(true)
  })

  it("groups the built-in items under Navigate, Show, Data and Actions", async () => {
    const { user } = await renderModern({ focused: true, legendMode: "below" })
    const menu = await openMenu(user)

    const groups = within(menu).getAllByRole("group")
    expect(groups.map(group => group.getAttribute("aria-label"))).toEqual([
      "Navigate",
      "Navigation",
      "Show",
      "Data",
      "Actions",
    ])
    const ids = group =>
      Array.from(
        screen.getByTestId(`chartMore-group-${group}`).querySelectorAll('[role^="menuitem"]')
      ).map(item => item.dataset.testid)

    expect(ids("navigate")).toEqual([
      "chartMore-zoomIn",
      "chartMore-zoomOut",
      "chartMore-zoomReset",
      "chartMore-fullscreen",
    ])
    expect(ids("show")).toEqual(["chartMore-anomalies", "chartMore-annotations", "chartMore-info"])
    expect(ids("data")).toEqual([
      "chartMore-filters",
      "chartMore-dimensions",
      "chartMore-sort",
      "chartMore-tab-data",
      "chartMore-tab-display",
    ])
    expect(ids("actions")).toEqual([
      "chartMore-tab-download",
      "chartMore-tab-info",
      "chartMore-reload",
    ])
    expect(within(menu).getByText("Navigate")).toBeInTheDocument()
    expect(screen.getByTestId("chartMore-dimensions")).toHaveTextContent("›")
    expect(screen.getByTestId("chartMore-reload")).not.toHaveTextContent("›")
  })

  it("renders consumer menu items in their group by order and skips hidden or null ones", async () => {
    const { user } = await renderModern({
      focused: true,
      toolboxElements: [Alerts, Hidden, Nothing, AskAi, Information, Fullscreen],
    })
    await openMenu(user)

    const actions = within(screen.getByTestId("chartMore-group-actions"))
      .getAllByRole("menuitem")
      .map(item => item.dataset.testid)
    expect(actions).toEqual([
      "consumer-askAi",
      "consumer-alerts",
      "chartMore-tab-download",
      "chartMore-tab-info",
      "chartMore-reload",
    ])
    expect(screen.queryByTestId("consumer-hidden")).not.toBeInTheDocument()
    expect(screen.getAllByTestId("chartMore-info")).toHaveLength(1)
    expect(screen.getAllByTestId("chartMore-fullscreen")).toHaveLength(1)
    expect(screen.getByTestId("consumer-alerts")).toHaveTextContent("2")
  })

  it("drops Full screen from the menu when the consumer leaves the element out", async () => {
    const { user } = await renderModern({ focused: true, toolboxElements: [Settings] })
    await openMenu(user)

    expect(screen.queryByTestId("chartMore-fullscreen")).not.toBeInTheDocument()
  })

  it("toggles full screen from the Navigate group", async () => {
    const { user, chart } = await renderModern({ focused: true })
    let toggles = 0
    chart.toggleFullscreen = () => (toggles += 1)
    await openMenu(user)

    expect(screen.getByTestId("chartMore-fullscreen")).toHaveTextContent("Full screen")
    await user.click(screen.getByTestId("chartMore-fullscreen"))

    expect(toggles).toBe(1)
    expect(screen.queryByTestId("chartMoreMenu")).not.toBeInTheDocument()
  })

  it("sizes a drilled panel by the item's panelWidth and keeps the 260px default", async () => {
    const { user } = await renderModern({
      focused: true,
      toolboxElements: [Alerts, WideAlerts],
    })
    await openMenu(user)

    await user.click(screen.getByTestId("consumer-wideAlerts"))
    expect(screen.getByTestId("chartMore-drilled")).toHaveStyle({ width: "360px" })

    await user.click(screen.getByTestId("chartMore-back"))
    await user.click(screen.getByTestId("consumer-alerts"))
    expect(screen.getByTestId("chartMore-drilled")).toHaveStyle({ width: "260px" })
  })

  it("drills into a consumer panel and comes back with the back row or the panel", async () => {
    const { user } = await renderModern({ focused: true, toolboxElements: [Alerts] })
    await openMenu(user)

    await user.click(screen.getByTestId("consumer-alerts"))
    expect(screen.getByTestId("chartMore-back")).toHaveTextContent("← Alerts")
    expect(screen.queryByTestId("chartMore-reload")).not.toBeInTheDocument()

    await user.click(screen.getByTestId("chartMore-back"))
    expect(screen.queryByTestId("chartMore-back")).not.toBeInTheDocument()
    expect(screen.getByTestId("consumer-alerts")).toHaveFocus()

    await user.click(screen.getByTestId("consumer-alerts"))
    await user.click(screen.getByTestId("alertsPanel-back"))
    expect(screen.getByTestId("chartMore-reload")).toBeInTheDocument()

    await user.click(screen.getByTestId("consumer-alerts"))
    await user.click(screen.getByTestId("alertsPanel-close"))
    expect(screen.queryByTestId("chartMoreMenu")).not.toBeInTheDocument()
  })

  it("goes back on Esc inside a drilled panel and closes on Esc at the root", async () => {
    const { user } = await renderModern({ focused: true, toolboxElements: [Alerts] })
    await openMenu(user)

    await user.click(screen.getByTestId("consumer-alerts"))
    expect(screen.getByTestId("chartMore-back")).toHaveFocus()

    fireEvent.keyDown(document.activeElement, { key: "Escape", keyCode: 27 })
    expect(screen.getByTestId("chartMoreMenu")).toBeInTheDocument()
    expect(screen.queryByTestId("chartMore-back")).not.toBeInTheDocument()
    expect(screen.getByTestId("consumer-alerts")).toHaveFocus()

    fireEvent.keyDown(document.activeElement, { key: "Escape", keyCode: 27 })
    expect(screen.queryByTestId("chartMoreMenu")).not.toBeInTheDocument()

    await openMenu(user)
    expect(screen.queryByTestId("chartMore-back")).not.toBeInTheDocument()
  })

  it("moves focus into the menu and between items with the arrow keys", async () => {
    const { user } = await renderModern({ focused: true })
    await openMenu(user)

    expect(screen.getByTestId("chartMore-zoomIn")).toHaveFocus()

    await user.keyboard("{ArrowDown}")
    expect(screen.getByTestId("chartMore-zoomOut")).toHaveFocus()

    await user.keyboard("{ArrowUp}{ArrowUp}")
    expect(screen.getByTestId("chartMore-reload")).toHaveFocus()

    await user.keyboard("{Home}")
    expect(screen.getByTestId("chartMore-zoomIn")).toHaveFocus()
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

  it("opens a custom settings tab that has no id", async () => {
    const CustomBody = () => <div data-testid="customTabBody">Custom</div>
    const { chart } = makeModern({ focused: true })
    const tabs = chart.getAttribute("settingsTabs")
    chart.updateAttribute("settingsTabs", [...tabs, { label: "Custom", Component: CustomBody }])
    const { user } = renderWithChart(<Header hasFilters />, { chart })
    await openMenu(user)

    await user.click(screen.getByTestId(`chartMore-tab-${tabs.length}`))

    expect(await screen.findByTestId("customTabBody")).toBeInTheDocument()
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
  it("shows the zoom state with a reset in the header and hides the floating navigation toolbox", async () => {
    const { chart } = makeModern()
    const { user, container } = renderWithChart(
      <>
        <Header />
        <ChartContentWrapper />
      </>,
      { chart }
    )

    expect(screen.queryByTestId("chartZoomChip")).not.toBeInTheDocument()

    await user.hover(container.querySelector('[data-testid="chartContentWrapper"]'))
    expect(screen.queryByTestId("chartToolbox")).not.toBeInTheDocument()

    const now = Math.floor(Date.now() / 1000)
    act(() => chart.updateAttributes({ after: now - 600, before: now - 300 }))

    expect(screen.getByTestId("chartZoomChip")).toHaveTextContent("Zoomed to")

    const chip = within(screen.getByTestId("chartHeader")).getByTestId("chartZoomChip")
    act(() => chart.updateAttribute("focused", false))
    expect(getComputedStyle(chip).opacity).toBe("0")
    act(() => chart.updateAttribute("focused", true))
    expect(getComputedStyle(chip).opacity).toBe("1")

    await user.click(screen.getByTestId("chartZoomChip-reset"))
    await waitFor(() => expect(chart.getAttribute("after")).toBe(-900))
    expect(screen.queryByTestId("chartZoomChip")).not.toBeInTheDocument()
  })
})

const manyPayload = count =>
  makePayload({
    context: "test.many",
    title: "Many",
    unit: "percentage",
    dimensions: Array.from({ length: count }, (_, index) => ({
      id: `dim${index}`,
      values: makeWave({ center: 10 + index, amplitude: 2, phase: index }),
    })),
  })

const renderLoaded = async (attributes, payload, props = { hasFilters: true }) => {
  const { chart } = makeModern(attributes)
  const result = renderWithChart(<Header {...props} />, { chart })
  await act(async () => {
    chart.doneFetch(payload)
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return { ...result, chart }
}

const sortItem = () => screen.queryByTestId("chartMore-sort")

describe("Modern dimension sort item", () => {
  it.each(["below", "table"])("is offered with the %s legend", async legendMode => {
    const { user } = await renderModern({ focused: true, legendMode })
    await openMenu(user)

    expect(sortItem()).toBeInTheDocument()
  })

  it.each(["live", "direct", "hidden"])(
    "is not offered with the %s legend, which ignores the sort",
    async legendMode => {
      const { user } = await renderModern({ focused: true, legendMode })
      await openMenu(user)

      expect(sortItem()).not.toBeInTheDocument()
    }
  )

  it("is offered on bars, which sort their hover rows", async () => {
    const { user } = await renderModern({ focused: true, chartLibrary: "bars" })
    await openMenu(user)

    expect(sortItem()).toBeInTheDocument()
  })

  it("is not offered on a heatmap", async () => {
    const { user } = await renderModern({
      focused: true,
      legendMode: "below",
      chartType: "heatmap",
    })
    await openMenu(user)

    expect(sortItem()).not.toBeInTheDocument()
  })

  it("is not offered with a single dimension", async () => {
    const { user } = await renderLoaded({ focused: true, legendMode: "below" }, manyPayload(1))
    await openMenu(user)

    expect(screen.getByTestId("chartMore-dimensions")).toBeInTheDocument()
    expect(sortItem()).not.toBeInTheDocument()
  })
})

const openDimensions = async user => {
  await openMenu(user)
  await user.click(screen.getByTestId("chartMore-dimensions"))
}

describe("Modern header without the toolbox", () => {
  it("keeps the default reload control in the title row", async () => {
    const { user, chart } = await renderModern({ hasToolbox: false, focused: true })
    let fetches = 0
    chart.on("finishFetch", () => (fetches += 1))

    expect(screen.queryByTestId("chartHeaderToolbox-more")).not.toBeInTheDocument()
    const status = screen.getByTestId("chartHeaderStatus")

    await user.hover(status.firstChild)
    fireEvent.click(await screen.findByTestId("chartHeaderStatus-reload"))

    await waitFor(() => expect(fetches).toBeGreaterThan(0))
  })

  it("shows states only in the scope line, not as header badges", async () => {
    const { chart } = makeTestChart({
      attributes: { designFlavour: "modern", hasToolbox: false },
      mockData: { errorMsgKey: "ErrQuery", errorMessage: "Query failed" },
    })
    renderWithChart(<Header hasFilters />, { chart })
    act(() => {
      chart.fetch()
    })

    expect(await screen.findByTestId("chartScope-error")).toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderStatus")).toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderStatus-error")).not.toBeInTheDocument()
  })

  it("keeps consumer left elements and drops nothing else", async () => {
    await renderModern({ hasToolbox: false, leftHeaderElements: [ChartOptions] })

    expect(screen.getByText("Chart options")).toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderStatus")).not.toBeInTheDocument()
  })

  it("opens the filters from the error state", async () => {
    const { chart } = makeTestChart({
      attributes: { designFlavour: "modern", hasToolbox: false },
      mockData: { errorMsgKey: "ErrQuery", errorMessage: "Query failed" },
    })
    const { user } = renderWithChart(<Header hasFilters />, { chart })
    act(() => {
      chart.fetch()
    })

    await user.click(await screen.findByTestId("chartScope-error"))

    expect(chart.getAttribute("filtersOpen")).toBe(true)
    expect(screen.getByTestId("chartFilters")).toBeInTheDocument()
  })

  it("opens the filters from the loading and empty states", async () => {
    const { chart } = makeModern({ hasToolbox: false })
    const { user } = renderWithChart(<Header hasFilters />, { chart })

    await user.click(screen.getByTestId("chartScope-loading"))
    expect(chart.getAttribute("filtersOpen")).toBe(true)

    const empty = makeTestChart({
      attributes: { designFlavour: "modern", hasToolbox: false, loaded: true },
    })
    renderWithChart(<Header hasFilters />, { chart: empty.chart })

    await user.click(screen.getByTestId("chartScope-empty"))
    expect(empty.chart.getAttribute("filtersOpen")).toBe(true)
  })

  it("keeps the states as plain text when the card has no filters", () => {
    const { chart } = makeModern({ hasToolbox: false })
    renderWithChart(<Header hasFilters={false} />, { chart })

    expect(screen.getByTestId("chartScope-loading").tagName).not.toBe("BUTTON")
  })
})

describe("Modern dimensions", () => {
  it("toggles dimensions from the More menu with the legend click semantics", async () => {
    const { user, chart } = await renderModern({ focused: true })
    await openDimensions(user)

    const rows = screen.getAllByTestId("chartMore-dimension")
    expect(rows.map(row => row.dataset.dimension)).toEqual(chart.getDimensionIds())
    const [first, second] = chart.getDimensionIds()

    await user.click(rows[0])
    expect(chart.getAttribute("selectedLegendDimensions")).toEqual([first])

    fireEvent.click(screen.getAllByTestId("chartMore-dimension")[1], { shiftKey: true })
    expect(chart.getAttribute("selectedLegendDimensions")).toEqual([first, second])

    fireEvent.click(screen.getAllByTestId("chartMore-dimension")[1], { metaKey: true })
    expect(chart.getAttribute("selectedLegendDimensions")).toEqual([first])

    expect(screen.getByTestId("chartMoreMenu")).toBeInTheDocument()
    expect(screen.getAllByTestId("chartMore-dimension")[0]).toHaveAttribute("aria-checked", "true")
    expect(screen.getAllByTestId("chartMore-dimension")[1]).toHaveAttribute("aria-checked", "false")

    await user.click(screen.getByTestId("chartMore-dimensions-showAll"))
    expect(chart.getAttribute("selectedLegendDimensions")).toEqual([])
    expect(screen.getByTestId("chartMore-dimensions-showAll")).toBeDisabled()
  })

  it("hides everything but the clicked one with ctrl-click from the all-visible state", async () => {
    const { user, chart } = await renderModern({ focused: true })
    await openDimensions(user)
    const [first, ...rest] = chart.getDimensionIds()

    fireEvent.click(screen.getAllByTestId("chartMore-dimension")[0], { ctrlKey: true })

    expect(chart.getAttribute("selectedLegendDimensions")).toEqual(rest)
    expect(chart.isDimensionVisible(first)).toBe(false)
  })

  it("caps the list and narrows it with a search on high cardinality", async () => {
    const count = 120
    const { user } = await renderLoaded({ focused: true }, manyPayload(count))
    await openDimensions(user)

    expect(screen.getAllByTestId("chartMore-dimension")).toHaveLength(dimensionsLimit)
    expect(screen.getByTestId("chartMore-dimensions-more")).toHaveTextContent(
      `${count - dimensionsLimit} more`
    )

    await user.type(screen.getByTestId("chartMore-dimensions-search"), "dim11")

    const names = screen.getAllByTestId("chartMore-dimension").map(row => row.dataset.dimension)
    expect(names.sort()).toEqual(
      [
        "dim11",
        "dim110",
        "dim111",
        "dim112",
        "dim113",
        "dim114",
        "dim115",
        "dim116",
        "dim117",
        "dim118",
        "dim119",
      ].sort()
    )
    expect(screen.queryByTestId("chartMore-dimensions-more")).not.toBeInTheDocument()
  })

  it("shows the hidden count and a show all action in the scope line", async () => {
    const { user, chart } = await renderModern({ hasToolbox: false })

    expect(screen.queryByTestId("chartScope-hidden")).not.toBeInTheDocument()

    act(() => chart.toggleDimensionId(chart.getDimensionIds()[0]))

    const hiddenCount = chart.getDimensionIds().length - 1
    expect(screen.getByTestId("chartScope-hidden")).toHaveTextContent(`, ${hiddenCount} hidden,`)

    await user.click(screen.getByTestId("chartScope-showAll"))

    expect(chart.getAttribute("selectedLegendDimensions")).toEqual([])
    expect(screen.queryByTestId("chartScope-hidden")).not.toBeInTheDocument()
    expect(chart.getAttribute("filtersOpen")).toBeFalsy()
  })
})

describe("Modern scope summary", () => {
  it("separates the parts with commas", async () => {
    const { chart } = await renderModern()

    const parts = getScopeParts(chart.getAttributes(), chart.intl)
    expect(parts.length).toBeGreaterThan(1)
    expect(screen.getByTestId("chartScope")).toHaveTextContent(parts.join(", "))
    expect(screen.getByTestId("chartScope").textContent).not.toContain("·")
  })
})

describe("Modern sparklines", () => {
  it("renders no header and no zoom chip on a sparkline", async () => {
    const { chart } = makeModern({ sparkline: true })
    renderWithChart(<Line />, { chart })
    await act(async () => {
      chart.fetch()
    })

    const now = Math.floor(Date.now() / 1000)
    act(() => chart.updateAttributes({ after: now - 600, before: now - 300 }))

    expect(screen.queryByTestId("chartHeader")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartScope")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartZoomChip")).not.toBeInTheDocument()
    expect(screen.getByTestId("chartContentWrapper")).toBeInTheDocument()
  })
})

describe("Modern anomaly pill", () => {
  const anomalyPayload = rate =>
    makePayload({
      context: "anomaly.cpu",
      title: "CPU",
      unit: "percentage",
      dimensions: [
        {
          id: "user",
          values: makeWave({ center: 50, amplitude: 30 }),
          anomalyRates: Array.from({ length: 97 }, (_, index) => rate(index)),
        },
      ],
    })

  const renderWithPayload = async (data, attributes = {}) => {
    const { chart } = makeModern(attributes)
    chart.doneFetch(data)
    await act(() => new Promise(resolve => setTimeout(resolve, 0)))
    renderWithChart(<Header />, { chart })
    return chart
  }

  it("shows the peak anomaly rate when the window has anomalies", async () => {
    await renderWithPayload(anomalyPayload(index => (index === 40 ? 42 : index === 80 ? 12 : 0)))

    const pill = screen.getByTestId("chartAnomalyPill")
    expect(pill).toHaveTextContent("Anomalous, peak 42%")
    expect(pill).toHaveAttribute(
      "title",
      "2 anomalous periods in this window, peak anomaly rate 42%"
    )
  })

  it("keeps one decimal for a peak below 1%", async () => {
    await renderWithPayload(anomalyPayload(index => (index === 40 ? 0.5 : 0)))

    expect(screen.getByTestId("chartAnomalyPill")).toHaveTextContent("Anomalous, peak 0.5%")
  })

  it("stays out of the header when the window has no anomalies", async () => {
    await renderWithPayload(anomalyPayload(() => 0))

    expect(screen.queryByTestId("chartAnomalyPill")).not.toBeInTheDocument()
  })

  it("stays out of the header when anomalies are hidden", async () => {
    await renderWithPayload(
      anomalyPayload(() => 30),
      { showAnomalies: false }
    )

    expect(screen.queryByTestId("chartAnomalyPill")).not.toBeInTheDocument()
  })
})
