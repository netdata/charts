import React from "react"
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import withTile from "@/components/hocs/withTile"
import Settings from "@/components/toolbox/settings"
import Fullscreen from "@/components/toolbox/fullscreen"
import Status from "@/components/status"
import LatestValue from "@/components/line/overlays/latestValue"
import { TileContext } from "./context"
import { getTileAlert } from "./alertDot"
import { getConsumerElements } from "./menu"
import { getReadoutSizes } from "./readout"
import { getLatestValueOverlay } from "./index"
import { useInModernTileMenu } from "./context"

const Body = () => <div data-testid="tileBody">body</div>
const Tiled = withTile(Body)

const AddToDashboard = ({ disabled }) => (
  <button type="button" disabled={disabled}>
    Add to dashboard
  </button>
)

const ChartOptions = () => <span>Chart options</span>

const renderTile = async (attributes = {}, props = {}) => {
  const { chart } = makeTestChart({ attributes: { title: "System load", ...attributes } })
  const result = renderWithChart(<Tiled {...props} />, { chart })
  await act(async () => {
    chart.fetch()
  })
  await waitFor(() => expect(chart.getAttribute("loaded")).toBe(true))
  return result
}

const renderModern = (attributes = {}, props) =>
  renderTile({ designFlavour: "modern", ...attributes }, props)

const openMenu = async (user, chart) => {
  act(() => chart.updateAttribute("focused", true))
  await user.click(screen.getByTestId("modernTile-more"))
  return screen.findByTestId("modernTileMenu")
}

describe("default tile", () => {
  it.each(["default", "minimal"])(
    "keeps the letter column and the hover strip in %s",
    async designFlavour => {
      const { chart } = await renderTile({ designFlavour, toolboxElements: [AddToDashboard] })

      expect(screen.queryByTestId("modernTile")).not.toBeInTheDocument()
      expect(screen.getByTestId("chartFilters")).toBeInTheDocument()
      expect(screen.getByTestId("chartHeaderStatus")).toBeInTheDocument()
      expect(screen.getByText("System load")).toBeInTheDocument()
      expect(screen.getByTestId("tileBody")).toBeInTheDocument()

      act(() => chart.updateAttribute("focused", true))

      await waitFor(() => expect(screen.getByTestId("chartHeaderToolbox")).toBeInTheDocument(), {
        timeout: 2000,
      })
      expect(screen.getByText("Add to dashboard")).toBeInTheDocument()
    }
  )

  it("renders the default latestValue overlay outside a modern tile", async () => {
    const { chart } = makeTestChart()
    renderWithChart(<LatestValue />, { chart })
    await act(async () => {
      chart.fetch()
    })

    await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument())
  })

  it("keeps the default latestValue overlay inside a tile when the flavour is default", async () => {
    const { chart } = makeTestChart()
    const { container } = renderWithChart(
      <TileContext.Provider value>
        <LatestValue />
      </TileContext.Provider>,
      { chart }
    )

    expect(container).not.toBeEmptyDOMElement()
  })
})

describe("modern tile at rest", () => {
  it("renders the title and body without the letter column, the strip or the Status logo", async () => {
    await renderModern({ toolboxElements: [AddToDashboard, Settings, Fullscreen] })

    const tile = screen.getByTestId("modernTile")
    expect(tile).toHaveAttribute("data-flavour", "modern")
    expect(tile).toHaveAttribute("data-revealed", "false")
    expect(screen.getByTestId("modernTile-title")).toHaveTextContent("System load")
    expect(screen.getByTestId("tileBody")).toBeInTheDocument()

    expect(screen.queryByTestId("chartFilters")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderToolbox")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderStatus")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernTileAlert")).not.toBeInTheDocument()
    expect(screen.queryByText("Add to dashboard")).not.toBeInTheDocument()
  })

  it("shows the units in the title of a line tile when units are not hidden", async () => {
    await renderModern({ hideUnits: false })

    expect(screen.getByTestId("modernTile-title")).toHaveTextContent(/System load • \[.+\]/)
  })

  it.each(["number", "gauge", "easypiechart", "bars", "d3pie"])(
    "leaves the units to the %s body",
    async chartLibrary => {
      await renderModern({ hideUnits: false, chartLibrary })

      expect(screen.getByTestId("modernTile-title")).toHaveTextContent(/^System load$/)
    }
  )

  it("triggers goToLink from the title like the default tile title", async () => {
    const { chart } = await renderModern()
    const links = []
    chart.sdk.on("goToLink", node => links.push(node))

    fireEvent.click(screen.getByTestId("modernTile-title"))

    expect(links).toEqual([chart])
  })

  it("shows a status dot with a short label only when an alert is raised", async () => {
    const { chart } = await renderModern()

    act(() => chart.updateAttribute("alerts", { load: { nm: "load", cl: 1 } }))
    expect(screen.queryByTestId("modernTileAlert")).not.toBeInTheDocument()

    act(() => chart.updateAttribute("alerts", { load: { nm: "load_average_15", wr: 1 } }))
    const dot = screen.getByTestId("modernTileAlert")
    expect(dot).toHaveAttribute("data-status", "warning")
    expect(dot).toHaveTextContent("1 warning")
    expect(dot).toHaveAttribute("title", "1 warning: load_average_15")
  })

  it.each(["gauge", "number"])("leaves the status to a %s, which draws its own", async lib => {
    const { chart } = await renderModern({ chartLibrary: lib })

    act(() => chart.updateAttribute("alerts", { load: { nm: "load_average_15", wr: 1 } }))
    expect(screen.queryByTestId("modernTileAlert")).not.toBeInTheDocument()
  })
})

describe("modern tile revealed", () => {
  it("reveals Fullscreen, More and the scope line on focus", async () => {
    const { chart } = await renderModern({ toolboxElements: [Settings, Fullscreen] })

    act(() => chart.updateAttribute("focused", true))

    expect(screen.getByTestId("modernTile")).toHaveAttribute("data-revealed", "true")
    expect(screen.getByTestId("chartHeaderToolbox-fullscreen")).toBeInTheDocument()
    expect(screen.getByTestId("modernTile-more")).toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderToolbox-settings")).not.toBeInTheDocument()
    expect(screen.getByTestId("chartScope")).toHaveTextContent("1 node")
  })

  it("keeps the scope line off the body while the plot is hovered", async () => {
    const { chart } = await renderModern()

    act(() => chart.updateAttribute("focused", true))

    expect(getComputedStyle(screen.getByTestId("modernTile-scope")).visibility).toBe("hidden")
  })

  it("shows the scope line while the menu is open", async () => {
    const { user, chart } = await renderModern()

    await openMenu(user, chart)

    expect(getComputedStyle(screen.getByTestId("modernTile-scope")).visibility).toBe("visible")
  })

  it("keeps the actions reachable by keyboard while the tile is at rest", async () => {
    await renderModern()

    const more = screen.getByTestId("modernTile-more")
    act(() => more.focus())

    expect(more).toHaveFocus()
  })

  it("leaves out Fullscreen when the consumer leaves it out of toolboxElements", async () => {
    await renderModern({ focused: true, toolboxElements: [AddToDashboard] })

    expect(screen.queryByTestId("chartHeaderToolbox-fullscreen")).not.toBeInTheDocument()
    expect(screen.getByTestId("modernTile-more")).toBeInTheDocument()
  })

  it("renders the move handle from toolboxProps.drag and spreads it onto the handle", async () => {
    const pressed = []
    const { chart } = await renderModern({
      focused: true,
      toolboxProps: {
        drag: {
          "data-dnd-handle": "card-1",
          onPointerDown: () => pressed.push(true),
          dragging: false,
        },
      },
    })

    const handle = screen.getByTestId("modernTile-drag")
    expect(handle).toHaveAttribute("data-dnd-handle", "card-1")
    expect(handle).not.toHaveAttribute("dragging")
    fireEvent.pointerDown(handle)
    expect(pressed).toEqual([true])

    act(() =>
      chart.updateAttribute("toolboxProps", {
        drag: { "data-dnd-handle": "card-1", dragging: true },
      })
    )
    expect(screen.getByTestId("modernTile-drag")).toHaveStyle({ cursor: "grabbing" })
  })

  it("has no move handle without toolboxProps.drag", async () => {
    await renderModern({ focused: true })

    expect(screen.queryByTestId("modernTile-drag")).not.toBeInTheDocument()
  })

  it("hides every action when hasToolbox is false and keeps the plain Status reload", async () => {
    await renderModern({
      focused: true,
      hasToolbox: false,
      toolboxProps: { drag: { "data-dnd-handle": "card-1" } },
      toolboxElements: [Fullscreen],
    })

    expect(screen.queryByTestId("modernTile-actions")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernTile-drag")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderToolbox-fullscreen")).not.toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderStatus")).toBeInTheDocument()
  })

  it("keeps consumer left header elements among the revealed controls", async () => {
    await renderModern({ focused: true, leftHeaderElements: [ChartOptions, Status] })

    const reveal = screen.getByTestId("modernTile-reveal")
    expect(within(reveal).getByText("Chart options")).toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderStatus")).not.toBeInTheDocument()
  })

  it("opens the existing filter toolbox from the scope line", async () => {
    const { user } = await renderModern({ focused: true })

    await user.click(screen.getByTestId("chartScope"))

    expect(await screen.findByTestId("chartFilters")).toBeInTheDocument()
    expect(screen.getByTestId("modernTile")).toHaveAttribute("data-revealed", "true")
  })

  it("does not open filters from the scope line when hasFilters is false", async () => {
    await renderModern({ focused: true }, { hasFilters: false })

    expect(screen.getByTestId("chartScope")).toBeDisabled()
  })
})

describe("modern tile More menu", () => {
  it("tells consumer elements they are in the menu, so a duplicate handle can step aside", async () => {
    const DragLike = () => (useInModernTileMenu() ? null : <button type="button">Drag</button>)
    const { user, chart } = await renderModern({
      focused: true,
      toolboxElements: [DragLike, AddToDashboard],
    })
    const menu = await openMenu(user, chart)

    const row = within(menu).getByTestId("modernTileMenu-elements")
    expect(within(row).queryByText("Drag")).not.toBeInTheDocument()
    expect(within(row).getByText("Add to dashboard")).toBeInTheDocument()
  })

  it("lists consumer toolbox elements as an icon row, then filters, settings, info and reload", async () => {
    const { user, chart } = await renderModern({
      focused: true,
      toolboxElements: [AddToDashboard, Settings, Fullscreen],
    })
    const menu = await openMenu(user, chart)

    const row = within(menu).getByTestId("modernTileMenu-elements")
    expect(within(row).getByText("Add to dashboard")).toBeEnabled()
    expect(within(row).queryByTestId("chartHeaderToolbox-settings")).not.toBeInTheDocument()
    expect(within(row).queryByTestId("chartHeaderToolbox-fullscreen")).not.toBeInTheDocument()

    expect(within(menu).getByTestId("chartFilters")).toBeInTheDocument()
    expect(within(menu).getByTestId("modernTileMenu-settings")).toBeInTheDocument()
    expect(within(menu).getByTestId("modernTileMenu-info")).toBeInTheDocument()
    expect(within(menu).getByTestId("modernTileMenu-reload")).toBeInTheDocument()
  })

  it("has no filter entries when hasFilters is false", async () => {
    const { user, chart } = await renderModern({ focused: true }, { hasFilters: false })
    const menu = await openMenu(user, chart)

    expect(within(menu).queryByTestId("chartFilters")).not.toBeInTheDocument()
    expect(within(menu).getByTestId("modernTileMenu-reload")).toBeInTheDocument()
  })

  it("opens a filter dropdown from the menu without closing the menu", async () => {
    const { user, chart } = await renderModern({ focused: true })
    const menu = await openMenu(user, chart)

    const filters = within(menu).getByTestId("chartFilters")
    const nodes = within(filters)
      .getAllByRole("button")
      .find(button => /^\d+ nodes?$/.test(button.textContent))
    await user.click(nodes)

    const dropdown = await screen.findByTestId("modern-filter-dropdown")
    await user.click(within(dropdown).getAllByRole("checkbox")[0] || dropdown)
    expect(screen.getByTestId("modernTileMenu")).toBeInTheDocument()
  })

  it("toggles chart info and reloads data", async () => {
    const { user, chart } = await renderModern({ focused: true })
    const fetches = []
    chart.on("startFetch", () => fetches.push(true))

    await openMenu(user, chart)
    await user.click(screen.getByTestId("modernTileMenu-info"))
    expect(chart.getAttribute("showingInfo")).toBe(true)

    await openMenu(user, chart)
    await user.click(screen.getByTestId("modernTileMenu-reload"))
    await waitFor(() => expect(fetches.length).toBeGreaterThan(0))
    expect(screen.queryByTestId("modernTileMenu")).not.toBeInTheDocument()
  })

  it("opens the existing settings content", async () => {
    const { user, chart } = await renderModern({ focused: true })
    await openMenu(user, chart)

    await user.click(screen.getByTestId("modernTileMenu-settings"))

    expect(screen.queryByTestId("modernTileMenu")).not.toBeInTheDocument()
    expect(await screen.findByText("Display")).toBeInTheDocument()
  })
})

describe("modern tile readout", () => {
  it("renders the latestValue readout above the body with the unit beside it", async () => {
    await renderModern({ overlays: { latestValue: { type: "latestValue" } } })

    const readout = await screen.findByTestId("modernTileReadout")
    expect(screen.getByTestId("modernTileReadout-value").textContent).toMatch(/^\d/)
    expect(screen.getByTestId("modernTileReadout-unit")).toHaveTextContent("threads")

    const order = readout.compareDocumentPosition(screen.getByTestId("tileBody"))
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("has no readout without a latestValue overlay", async () => {
    await renderModern()

    expect(screen.queryByTestId("modernTileReadout")).not.toBeInTheDocument()
  })

  it("steps the overlay aside inside a modern tile", async () => {
    const { chart } = makeTestChart({ attributes: { designFlavour: "modern" } })
    const { container } = renderWithChart(
      <TileContext.Provider value>
        <LatestValue />
      </TileContext.Provider>,
      { chart }
    )

    expect(container).toBeEmptyDOMElement()
  })
})

describe("modern tile helpers", () => {
  it("drops the library Settings and Fullscreen from the consumer elements", () => {
    expect(getConsumerElements([AddToDashboard, Settings, Fullscreen])).toEqual([AddToDashboard])
    expect(getConsumerElements(undefined)).toEqual([])
  })

  it("finds the latestValue overlay", () => {
    expect(getLatestValueOverlay({ a: { type: "alarm" } })).toBeNull()
    expect(getLatestValueOverlay({ v: { type: "latestValue", dimensionId: "x" } })).toEqual({
      type: "latestValue",
      dimensionId: "x",
    })
    expect(getLatestValueOverlay(undefined)).toBeNull()
  })

  it("labels raised alerts and stays silent when clear", () => {
    expect(getTileAlert({ alerts: { a: { nm: "a", cl: 1 } } })).toBeNull()
    expect(getTileAlert({})).toBeNull()
    expect(getTileAlert({ alerts: { a: { nm: "a", wr: 2 } } })).toMatchObject({
      status: "warning",
      tone: "warning",
      label: "2 warning",
    })
    expect(
      getTileAlert({ overlays: { x: { type: "alarm", status: "critical", value: 3 } } })
    ).toMatchObject({ status: "critical", tone: "error", label: "1 critical" })
  })

  it("sizes the readout to the tile", () => {
    const wide = getReadoutSizes({ width: 420, height: 190, chars: 4, unitChars: 1 })
    const narrow = getReadoutSizes({ width: 140, height: 190, chars: 6, unitChars: 5 })

    expect(wide.value).toBeLessThanOrEqual(34)
    expect(narrow.value).toBeLessThan(wide.value)
    expect(narrow.unit).toBeGreaterThanOrEqual(11)
  })
})
