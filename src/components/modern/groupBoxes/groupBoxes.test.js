import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import { GroupBoxesContainer } from "@/components/groupBoxes"
import drawBoxes from "@/components/groupBoxes/drawBoxes"
import makeHeatPayload from "./makeHeatPayload"
import { pickStep, makeModernColor, getThreshold, modernBoxOptions } from "./scale"

const makeChart = async (attributes = {}) => {
  const { chart } = makeTestChart({
    mockData: makeHeatPayload(),
    attributes: {
      contextScope: ["modern.nodes.cpu"],
      chartLibrary: "groupBoxes",
      ...attributes,
    },
  })

  await act(async () => {
    await chart.fetch()
    await new Promise(resolve => setTimeout(resolve, 0))
  })

  return chart
}

// jsdom does not derive offsetX/offsetY from the event init, so they are set on the event itself.
const hoverFirstBox = canvas => {
  const event = new MouseEvent("mousemove", { bubbles: true })
  Object.defineProperty(event, "offsetX", { value: 5 })
  Object.defineProperty(event, "offsetY", { value: 5 })
  act(() => {
    canvas.dispatchEvent(event)
  })
}

const renderBoxes = async (attributes = {}) => {
  const chart = await makeChart(attributes)
  const result = renderWithChart(<GroupBoxesContainer />, { chart })

  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 50))
  })

  return { ...result, chart }
}

describe("modern group boxes", () => {
  describe("default flavour stays as it is", () => {
    it("renders the gradient legend and square boxes", async () => {
      await renderBoxes({ designFlavour: "default" })

      const legend = screen.getByTestId("groupBox-legend")
      expect(legend).not.toHaveAttribute("data-flavour")
      expect(screen.queryByTestId("groupBox-legend-scale")).not.toBeInTheDocument()

      const titles = screen.getAllByTestId("groupBoxWrapper-title").map(el => el.textContent)
      expect(titles).toEqual(["prod-edge(24)", "prod-db(16)", "prod-jobs(16)", "staging(10)"])

      const [canvas] = screen.getAllByTestId("groupBox")
      hoverFirstBox(canvas)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150))
      })

      expect(screen.getByTestId("chartPopover-labels")).toBeInTheDocument()
      const events = canvas.getContext("2d").__getEvents()
      expect(events.some(event => event.type === "strokeRect")).toBe(true)
      expect(events.some(event => event.type === "quadraticCurveTo")).toBe(false)
    })

    it("keeps the default drawing when no modern options are given", () => {
      const { chart } = makeTestChart()
      const el = document.createElement("canvas")
      const boxes = drawBoxes(chart, el, { onMouseenter: () => {}, onMouseout: () => {} })
      const ids = ["a", "b", "c"]
      const iterator = boxes.update(ids, null)
      while (!iterator.next().done);

      const events = boxes.getElement().getContext("2d").__getEvents()
      const types = events.map(event => event.type)
      expect(types).not.toContain("quadraticCurveTo")
      expect(types.filter(type => type === "fillRect")).toHaveLength(ids.length)

      const ctx = el.getContext("2d")
      boxes.activateBox(1)
      const strokes = ctx.__getEvents().filter(event => event.type === "strokeRect")
      expect(strokes).toHaveLength(1)
      expect(ctx.strokeStyle).toBe("#ffffff")
      boxes.clear()
    })
  })

  describe("modern flavour", () => {
    it("lays groups out as labelled rows", async () => {
      await renderBoxes({ designFlavour: "modern" })

      const titles = screen.getAllByTestId("groupBoxWrapper-title").map(el => el.textContent)
      expect(titles).toEqual(["prod-edge(24)", "prod-db(16)", "prod-jobs(16)", "staging(10)"])
      expect(screen.getAllByTestId("groupBox")).toHaveLength(4)
    })

    it("draws rounded boxes from the sequential scale", () => {
      const { chart } = makeTestChart({ attributes: { min: 0, max: 100 } })
      chart.getRowDimensionValue = id => Number(id)
      const el = document.createElement("canvas")
      const boxes = drawBoxes(
        chart,
        el,
        { onMouseenter: () => {}, onMouseout: () => {} },
        modernBoxOptions(chart)
      )
      const iterator = boxes.update(["5", "50", "95"], null)
      while (!iterator.next().done);

      const events = boxes.getElement().getContext("2d").__getEvents()
      expect(events.some(event => event.type === "quadraticCurveTo")).toBe(true)
      expect(events.some(event => event.type === "fillRect")).toBe(false)

      const scale = chart.getThemeAttribute("themeGroupBoxesScale").map(c => c.toLowerCase())
      const fills = events
        .filter(event => event.type === "fillStyle")
        .map(event => event.props.value.toLowerCase())
      expect(fills).toEqual([scale[0], scale[3], scale[6]])

      const ctx = el.getContext("2d")
      boxes.activateBox(0)
      expect(ctx.__getEvents().some(event => event.type === "strokeRect")).toBe(false)
      expect(ctx.strokeStyle).toBe(chart.getThemeAttribute("themeLabelColor").toLowerCase())
      boxes.clear()
    })

    it("shows the scale legend and no threshold without one", async () => {
      await renderBoxes({ designFlavour: "modern" })

      expect(screen.getByTestId("groupBox-legend")).toHaveAttribute("data-flavour", "modern")
      expect(screen.getByTestId("groupBox-legend-scale").children).toHaveLength(7)
      expect(screen.queryByTestId("groupBox-legend-threshold")).not.toBeInTheDocument()
    })

    it("highlights values at or above the threshold", async () => {
      const { chart } = makeTestChart({ attributes: { min: 0, max: 100, groupBoxesThreshold: 90 } })
      chart.getRowDimensionValue = id => Number(id)
      const el = document.createElement("canvas")
      const boxes = drawBoxes(
        chart,
        el,
        { onMouseenter: () => {}, onMouseout: () => {} },
        modernBoxOptions(chart)
      )
      const iterator = boxes.update(["89", "90", "99"], null)
      while (!iterator.next().done);

      const error = chart.getThemeAttribute("themeErrorBackground").toLowerCase()
      const fills = boxes
        .getElement()
        .getContext("2d")
        .__getEvents()
        .filter(event => event.type === "fillStyle")
        .map(event => event.props.value.toLowerCase())
      expect(fills[0]).not.toBe(error)
      expect(fills.slice(1)).toEqual([error, error])
      boxes.clear()
    })

    it("shows the threshold in the legend", async () => {
      await renderBoxes({ designFlavour: "modern", groupBoxesThreshold: 90 })

      expect(screen.getByTestId("groupBox-legend-threshold")).toHaveTextContent("≥ 90 %")
    })

    it("keeps the hover popover and outlines the hovered box", async () => {
      await renderBoxes({ designFlavour: "modern" })

      const [canvas] = screen.getAllByTestId("groupBox")
      hoverFirstBox(canvas)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150))
      })

      expect(screen.getByTestId("chartPopover-labels")).toBeInTheDocument()
      const events = canvas.getContext("2d").__getEvents()
      expect(events.some(event => event.type === "stroke")).toBe(true)
      expect(events.some(event => event.type === "strokeRect")).toBe(false)
    })

    it("dark theme uses the dark scale", async () => {
      const { chart } = await renderBoxes({ designFlavour: "modern", theme: "dark" })

      expect(chart.getThemeAttribute("themeGroupBoxesScale")[0]).toBe("#172230")
    })
  })

  describe("scale helpers", () => {
    it("picks a step inside the range", () => {
      expect(pickStep(0, 0, 100, 7)).toBe(0)
      expect(pickStep(100, 0, 100, 7)).toBe(6)
      expect(pickStep(50, 0, 100, 7)).toBe(3)
      expect(pickStep(-5, 0, 100, 7)).toBe(0)
      expect(pickStep(500, 0, 100, 7)).toBe(6)
      expect(pickStep(null, 0, 100, 7)).toBe(0)
      expect(pickStep(5, 5, 5, 7)).toBe(0)
    })

    it("reads the threshold only when it is a number", () => {
      const { chart } = makeTestChart()
      expect(getThreshold(chart)).toBeNull()
      chart.updateAttribute("groupBoxesThreshold", "90")
      expect(getThreshold(chart)).toBeNull()
      chart.updateAttribute("groupBoxesThreshold", 90)
      expect(getThreshold(chart)).toBe(90)
    })

    it("colours by threshold first, then by scale", () => {
      const { chart } = makeTestChart({ attributes: { groupBoxesThreshold: 80 } })
      const getColor = makeModernColor(chart)(0, 100)
      const scale = chart.getThemeAttribute("themeGroupBoxesScale")

      expect(getColor(85)).toBe(chart.getThemeAttribute("themeErrorBackground"))
      expect(getColor(0)).toBe(scale[0])
      expect(getColor(79)).toBe(scale[5])
    })

    it("strokes the hovered box with the label colour", () => {
      const { chart } = makeTestChart()
      expect(modernBoxOptions(chart).getActiveStroke()).toBe(
        chart.getThemeAttribute("themeLabelColor")
      )
    })
  })
})
