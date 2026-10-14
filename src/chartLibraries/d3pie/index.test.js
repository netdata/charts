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
})
