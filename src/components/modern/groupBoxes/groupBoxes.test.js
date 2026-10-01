import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import { GroupBoxesContainer } from "@/components/groupBoxes"
import drawBoxes from "@/components/groupBoxes/drawBoxes"
import Labels from "@/components/groupBoxes/popover/labels"
import makeHeatPayload from "./makeHeatPayload"
import { pickStep, makeModernColor, getThreshold, modernBoxOptions } from "./scale"

const makeChart = async (attributes = {}, mockData = makeHeatPayload()) => {
  const { chart } = makeTestChart({
    mockData,
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

const hoverFirstBox = canvas => {
  const event = new MouseEvent("mousemove", { bubbles: true })
  Object.defineProperty(event, "offsetX", { value: 5 })
  Object.defineProperty(event, "offsetY", { value: 5 })
  act(() => {
    canvas.dispatchEvent(event)
  })
}

const renderBoxes = async (attributes = {}, props = {}) => {
  const chart = await makeChart(attributes)
  const result = renderWithChart(<GroupBoxesContainer {...props} />, { chart })

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

  describe("filter bar placement", () => {
    const countFilters = () => screen.queryAllByTestId("chartFilters").length

    it("keeps one fixed filter bar in the default flavour", async () => {
      await renderBoxes({ designFlavour: "default" })
      expect(countFilters()).toBe(1)
    })

    it("keeps one fixed filter bar in the minimal flavour", async () => {
      await renderBoxes({ designFlavour: "minimal" })
      expect(countFilters()).toBe(1)
    })

    it("leaves the filter bar to the modern header, closed until opened", async () => {
      await renderBoxes({ designFlavour: "modern" })
      expect(screen.getByTestId("chartHeader")).toHaveAttribute("data-flavour", "modern")
      expect(countFilters()).toBe(0)
    })

    it("shows a single filter bar when the modern panel is open", async () => {
      await renderBoxes({ designFlavour: "modern", filtersOpen: true })
      expect(countFilters()).toBe(1)
    })

    it("keeps the fixed filter bar in modern when the header is off", async () => {
      await renderBoxes({ designFlavour: "modern" }, { hasHeader: false })
      expect(screen.queryByTestId("chartHeader")).not.toBeInTheDocument()
      expect(countFilters()).toBe(1)
    })
  })

  describe("box layout", () => {
    const ids = Array.from({ length: 24 }, (_, index) => String(index))

    const draw = (chart, options) => {
      const el = document.createElement("canvas")
      const entered = []
      const boxes = drawBoxes(
        chart,
        el,
        { onMouseenter: event => entered.push(event.index), onMouseout: () => {} },
        options
      )
      const iterator = boxes.update(ids, null)
      while (!iterator.next().done);
      return { el, boxes, entered }
    }

    it("fills the available width in the modern flavour", () => {
      const { chart } = makeTestChart()
      const { el, boxes, entered } = draw(chart, {
        ...modernBoxOptions(chart),
        getAvailableWidth: () => 400,
      })

      expect(boxes.getElement().width).toBe(400)
      expect(el.width).toBe(400)

      const move = (x, y) => {
        const event = new MouseEvent("mousemove", { bubbles: true })
        Object.defineProperty(event, "offsetX", { value: x })
        Object.defineProperty(event, "offsetY", { value: y })
        el.dispatchEvent(event)
      }
      move(390, 5)
      move(65, 25)
      expect(entered).toEqual([19, 23])
      boxes.clear()
    })

    it("keeps the aspect ratio without an available width", () => {
      const { chart } = makeTestChart()
      const { boxes } = draw(chart, modernBoxOptions(chart))

      expect(boxes.getElement().width).toBe(140)
      boxes.clear()
    })

    it("measures the row only in the modern flavour", async () => {
      await renderBoxes({ designFlavour: "modern" })
      expect(screen.getAllByTestId("groupBox-track")).toHaveLength(4)
    })

    it("renders bare canvases in the default flavour", async () => {
      await renderBoxes({ designFlavour: "default" })
      expect(screen.queryByTestId("groupBox-track")).not.toBeInTheDocument()
    })
  })

  describe("readouts", () => {
    const renderReadouts = async designFlavour => {
      const chart = await makeChart({ designFlavour })
      renderWithChart(<GroupBoxesContainer />, { chart })
      return chart
    }

    it("formats the modern legend range with readout decimals", async () => {
      await renderReadouts("modern")

      const legend = screen.getByTestId("groupBox-legend")
      expect(legend).toHaveTextContent("27.9 %")
      expect(legend).toHaveTextContent("92.6 %")
    })

    it("keeps the default legend range as it was", async () => {
      const chart = await renderReadouts("default")

      const legend = screen.getByTestId("groupBox-legend")
      expect(legend).toHaveTextContent(`${chart.getConvertedValue(chart.getAttribute("min"))} %`)
      expect(legend).toHaveTextContent(`${chart.getConvertedValue(chart.getAttribute("max"))} %`)
      expect(legend).toHaveTextContent("27.86 %")
    })

    const renderLabels = async designFlavour => {
      const chart = await makeChart({ designFlavour })
      chart.setUI({ getChartWidth: () => 300 })
      const id = chart.getAttribute("viewDimensions").ids[0]

      const result = renderWithChart(
        <Labels label="node" groupLabel="Group" data={[1700000000, 42.56789]} id={id} />,
        { chart }
      )
      return { ...result, chart, id }
    }

    it("formats the modern hover value with readout decimals", async () => {
      await renderLabels("modern")
      expect(screen.getByTestId("chartPopover-labels")).toHaveTextContent("42.6 %")
    })

    it("keeps the default hover value as it was", async () => {
      await renderLabels("default")
      expect(screen.getByTestId("chartPopover-labels")).toHaveTextContent("42.57 %")
    })
  })
})
