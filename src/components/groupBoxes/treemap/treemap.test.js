import React from "react"
import { act, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import makeHeatPayload from "../../../../fixtures/makeHeatPayload"
import Treemap from "."
import { buildBoxTree, getBoxIds } from "./tree"
import { layoutTreemap, hitTest } from "./layout"

const makeChart = async (attributes = {}) => {
  const { chart } = makeTestChart({
    mockData: makeHeatPayload(),
    attributes: {
      contextScope: ["modern.nodes.cpu"],
      chartLibrary: "groupBoxes",
      designFlavour: "modern",
      ...attributes,
    },
  })
  await act(async () => {
    await chart.fetch()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return chart
}

const pointerAt = (canvas, type, x, y) => {
  const event = new MouseEvent(type, { bubbles: true })
  Object.defineProperty(event, "offsetX", { value: x })
  Object.defineProperty(event, "offsetY", { value: y })
  act(() => {
    canvas.dispatchEvent(event)
  })
}

const lastDrawFills = canvas => {
  const events = canvas.getContext("2d").__getEvents()
  const start = events.map(event => event.type).lastIndexOf("clearRect")
  return events.slice(start).filter(event => event.type === "fill")
}

const wait = ms =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, ms))
  })

const renderTreemap = async (attributes, size = { width: 600, height: 300 }) => {
  const chart = await makeChart(attributes)
  act(() => {
    chart.getUI().mount(document.createElement("div"))
  })
  renderWithChart(<Treemap {...size} />, { chart })
  await wait(20)
  return chart
}

describe("group boxes treemap", () => {
  it("draws one box per payload id and a frame per group", async () => {
    await renderTreemap()

    const canvas = screen.getByTestId("groupBoxesTreemap-canvas")
    const events = canvas.getContext("2d").__getEvents()
    expect(events.filter(event => event.type === "fill")).toHaveLength(66)
    const texts = events.filter(event => event.type === "fillText").map(event => event.props.text)
    expect(texts).toEqual(expect.arrayContaining(["prod-edge", "prod-db", "prod-jobs", "staging"]))
  })

  it("does not draw at zero size", async () => {
    await renderTreemap({}, { width: 0, height: 0 })

    const canvas = screen.getByTestId("groupBoxesTreemap-canvas")
    expect(
      canvas
        .getContext("2d")
        .__getEvents()
        .filter(event => event.type === "fill")
    ).toHaveLength(0)
  })

  it("shows the hover card over a box and hides it on leave", async () => {
    await renderTreemap()
    const canvas = screen.getByTestId("groupBoxesTreemap-canvas")

    pointerAt(canvas, "mousemove", 10, 30)
    await wait(150)
    expect(screen.getByTestId("groupBoxCard")).toBeInTheDocument()

    pointerAt(canvas, "mouseout", -1, -1)
    await wait(20)
    expect(screen.queryByTestId("groupBoxCard")).not.toBeInTheDocument()
  })

  it("pins the card on box click and keeps it in an attribute", async () => {
    const chart = await renderTreemap()
    const canvas = screen.getByTestId("groupBoxesTreemap-canvas")

    pointerAt(canvas, "click", 10, 30)
    await wait(20)

    expect(chart.getAttribute("groupBoxesPinned")).toEqual(expect.any(String))
    expect(screen.getByTestId("groupBoxCard-actions")).toBeInTheDocument()

    fireEvent.keyDown(document, { key: "Escape", keyCode: 27 })
    await wait(20)
    expect(chart.getAttribute("groupBoxesPinned")).toBeNull()
  })

  it("zooms on header click and zooms out from the breadcrumb", async () => {
    const chart = await renderTreemap()
    const canvas = screen.getByTestId("groupBoxesTreemap-canvas")

    pointerAt(canvas, "click", 8, 8)
    await wait(20)
    expect(chart.getAttribute("groupBoxesFocus")).toHaveLength(1)

    fireEvent.click(screen.getByTestId("groupBoxesTreemap-crumb-root"))
    await wait(20)
    expect(chart.getAttribute("groupBoxesFocus")).toEqual([])
  })

  it("falls back to the root and closes the pin when they no longer exist", async () => {
    const chart = await renderTreemap({ groupBoxesFocus: ["gone"], groupBoxesPinned: "gone,box" })

    expect(screen.getByTestId("groupBoxesTreemap-crumb-root")).toBeInTheDocument()
    expect(screen.queryByTestId("groupBoxCard")).not.toBeInTheDocument()
    expect(lastDrawFills(screen.getByTestId("groupBoxesTreemap-canvas"))).toHaveLength(66)
    expect(chart.getAttribute("groupBoxesFocus")).toEqual(["gone"])
    expect(chart.getAttribute("groupBoxesPinned")).toBeNull()
  })

  it("moves the card anchor to the newly hovered box", async () => {
    await renderTreemap()
    const canvas = screen.getByTestId("groupBoxesTreemap-canvas")

    pointerAt(canvas, "mousemove", 10, 30)
    await wait(150)
    const firstName = screen.getByTestId("groupBoxCard-name").textContent
    const firstAnchor = screen.getByTestId("groupBoxesTreemap-anchor")

    pointerAt(canvas, "mousemove", 200, 30)
    await wait(150)
    expect(screen.getByTestId("groupBoxCard-name").textContent).not.toBe(firstName)
    expect(screen.getByTestId("groupBoxesTreemap-anchor")).not.toBe(firstAnchor)
  })

  it("redraws box colours when the threshold changes", async () => {
    const chart = await renderTreemap()
    const ctx = screen.getByTestId("groupBoxesTreemap-canvas").getContext("2d")
    ctx.__clearEvents()

    act(() => {
      chart.updateAttribute("groupBoxesThreshold", 0)
    })
    await wait(20)

    const hot = chart.getThemeAttribute("themeErrorBackground").toLowerCase()
    const styles = ctx
      .__getEvents()
      .filter(event => event.type === "fillStyle")
      .map(event => event.props.value.toLowerCase())
    expect(styles).toContain(hot)
  })

  const labelStrokes = (ctx, label) => {
    let style
    let afterLabel = false
    return ctx.__getEvents().reduce((moves, event) => {
      if (event.type === "strokeStyle") {
        style = event.props.value.toLowerCase()
        afterLabel = style === label
      }
      if (event.type === "moveTo" && afterLabel) moves.push(event.props)
      if (event.type === "stroke") afterLabel = false
      return moves
    }, [])
  }

  const leafAt = (chart, x, y) => {
    const root = buildBoxTree(
      getBoxIds(chart.getPayload()),
      chart.getAttribute("viewDimensions").grouped,
      {}
    )
    return hitTest(layoutTreemap(root, [], { width: 600, height: 300 }), x, y).item
  }

  it("outlines the hovered box with the label colour and removes it on leave", async () => {
    const chart = await renderTreemap()
    const canvas = screen.getByTestId("groupBoxesTreemap-canvas")
    const ctx = canvas.getContext("2d")
    const label = chart.getThemeAttribute("themeLabelColor").toLowerCase()

    ctx.__clearEvents()
    pointerAt(canvas, "mousemove", 10, 30)
    await wait(150)
    expect(labelStrokes(ctx, label).length).toBeGreaterThan(0)

    ctx.__clearEvents()
    pointerAt(canvas, "mouseout", -1, -1)
    await wait(20)
    expect(labelStrokes(ctx, label)).toHaveLength(0)
  })

  it("keeps the outline on the pinned box while another box is hovered", async () => {
    const chart = await renderTreemap()
    const canvas = screen.getByTestId("groupBoxesTreemap-canvas")
    const ctx = canvas.getContext("2d")
    const label = chart.getThemeAttribute("themeLabelColor").toLowerCase()
    const pinned = leafAt(chart, 10, 30)

    pointerAt(canvas, "click", 10, 30)
    await wait(20)
    ctx.__clearEvents()
    pointerAt(canvas, "mousemove", 500, 250)
    await wait(150)

    const [move] = labelStrokes(ctx, label).slice(-1)
    expect(move.y).toBeCloseTo(pinned.y0 + 0.75, 0)
  })

  it("draws at the measured container size when no size is given", async () => {
    const chart = await makeChart()
    act(() => {
      chart.getUI().mount(document.createElement("div"))
    })
    renderWithChart(<Treemap />, { chart })
    await wait(20)

    const events = screen.getByTestId("groupBoxesTreemap-canvas").getContext("2d").__getEvents()
    expect(events.filter(event => event.type === "fill")).toHaveLength(66)
  })

  it("animates on zoom but not on a data refetch", async () => {
    const chart = await renderTreemap()
    const canvas = screen.getByTestId("groupBoxesTreemap-canvas")
    const ctx = canvas.getContext("2d")
    const clears = () => ctx.__getEvents().filter(event => event.type === "clearRect").length

    ctx.__clearEvents()
    await act(async () => {
      await chart.fetch()
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    await wait(700)
    expect(clears()).toBeLessThanOrEqual(2)

    ctx.__clearEvents()
    pointerAt(canvas, "click", 8, 8)
    await wait(700)
    expect(clears()).toBeGreaterThan(5)
  })
})
