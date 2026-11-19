import { makeTestChart } from "@jest/testUtilities"
import d3pieChart from "./index"

describe("d3pieChart", () => {
  it("creates chart instance with required methods", () => {
    const { sdk, chart } = makeTestChart()

    const instance = d3pieChart(sdk, chart)

    expect(instance).toHaveProperty("mount")
    expect(instance).toHaveProperty("unmount")
    expect(instance).toHaveProperty("render")
    expect(typeof instance.mount).toBe("function")
    expect(typeof instance.unmount).toBe("function")
    expect(typeof instance.render).toBe("function")
  })

  it("handles mount attempt with DOM limitations", () => {
    const { sdk, chart } = makeTestChart()

    const instance = d3pieChart(sdk, chart)
    const element = document.createElement("div")

    expect(() => instance.mount(element)).toThrow()
  })

  it("unmounts without errors when not mounted", () => {
    const { sdk, chart } = makeTestChart()

    const instance = d3pieChart(sdk, chart)

    expect(() => instance.unmount()).not.toThrow()
  })

  it("renders without errors when not mounted", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true },
    })

    chart.getPayload = () => ({ data: [[1, 50, 30]] })
    chart.getVisibleDimensionIds = () => ["cpu", "memory"]
    chart.getDimensionValue = () => 25
    chart.selectDimensionColor = () => "#ff0000"
    chart.getClosestRow = () => 0

    const instance = d3pieChart(sdk, chart)

    expect(() => instance.render()).not.toThrow()
  })

  describe("modern flavour", () => {
    const mountModern = () => {
      const { sdk, chart } = makeTestChart({
        attributes: { loaded: true, designFlavour: "modern" },
      })
      const instance = d3pieChart(sdk, chart)
      const parent = document.createElement("div")
      const element = document.createElement("div")
      parent.appendChild(element)
      return { chart, instance, element }
    }

    it("mounts without drawing the d3pie svg", () => {
      const { instance, element } = mountModern()

      expect(() => instance.mount(element)).not.toThrow()
      expect(element.querySelector("svg")).toBeNull()
      expect(element.classList.length).toBe(0)
      instance.unmount()
    })

    it("still reports renders and the value range", () => {
      const { chart, instance, element } = mountModern()
      const rendered = []
      const ranges = []
      instance.on("rendered", () => rendered.push(true))
      chart.on("yAxisChange", (min, max) => ranges.push([min, max]))

      instance.mount(element)
      rendered.length = 0

      expect(instance.render()).toBe(true)
      expect(rendered).toHaveLength(1)
      expect(ranges.length).toBeGreaterThan(0)
      instance.unmount()
    })

    it("mounts the library again after an unmount in the default flavour", () => {
      const { chart, instance, element } = mountModern()

      instance.mount(element)
      instance.unmount()
      chart.updateAttribute("designFlavour", "default")

      expect(() => instance.mount(element)).toThrow("getBBox")
    })
  })

  describe("colorOverrides", () => {
    const originalGetBBox = SVGElement.prototype.getBBox
    const originalRaf = window.requestAnimationFrame

    beforeEach(() => {
      SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 10, height: 10 })
      window.requestAnimationFrame = callback => callback()
    })

    afterEach(() => {
      SVGElement.prototype.getBBox = originalGetBBox
      window.requestAnimationFrame = originalRaf
    })

    const mountPie = () => {
      const { sdk, chart } = makeTestChart({ attributes: { loaded: true } })
      chart.getPayload = () => ({ data: [[1, 50, 30]] })
      chart.getVisibleDimensionIds = () => ["cpu", "memory"]
      chart.getDimensionValue = (id, index) => (id === "cpu" ? 50 : 30)
      chart.getClosestRow = () => 0

      const instance = d3pieChart(sdk, chart)
      const parent = document.createElement("div")
      const element = document.createElement("div")
      parent.appendChild(element)
      document.body.appendChild(parent)
      instance.mount(element)

      return { chart, instance, element, parent }
    }

    const flush = () => new Promise(resolve => setTimeout(resolve, 0))

    const sliceFills = element =>
      Array.from(element.querySelectorAll("path"))
        .map(path => path.getAttribute("fill"))
        .filter(fill => fill && fill.startsWith("#"))
        .map(fill => fill.toLowerCase())

    it("repaints with the override when colorOverrides changes", async () => {
      const { chart, instance, element, parent } = mountPie()
      const cpuColor = chart.selectDimensionColor("cpu").toLowerCase()
      const memoryColor = chart.selectDimensionColor("memory").toLowerCase()

      expect(sliceFills(element)).toContain(cpuColor)

      chart.updateAttribute("colorOverrides", { cpu: "#FFD400" })
      await flush()

      expect(sliceFills(element)).toContain("#ffd400")
      expect(sliceFills(element)).not.toContain(cpuColor)
      expect(sliceFills(element)).toContain(memoryColor)
      instance.unmount()
      document.body.removeChild(parent)
    })

    it("repaints back to the default when it is cleared", async () => {
      const { chart, instance, element, parent } = mountPie()
      const cpuColor = chart.selectDimensionColor("cpu").toLowerCase()

      chart.updateAttribute("colorOverrides", { cpu: "#FFD400" })
      await flush()
      expect(sliceFills(element)).toContain("#ffd400")

      chart.updateAttribute("colorOverrides", {})
      await flush()

      expect(sliceFills(element)).toContain(cpuColor)
      expect(sliceFills(element)).not.toContain("#ffd400")
      instance.unmount()
      document.body.removeChild(parent)
    })
  })
})
