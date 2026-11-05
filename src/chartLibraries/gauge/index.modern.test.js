import { makeTestChart } from "@jest/testUtilities"
import gaugeChart from "./index"

const setup = attributes => {
  const { sdk, chart } = makeTestChart({
    attributes: { loaded: true, getValueRange: () => [0, 100], ...attributes },
  })
  chart.getPayload = () => ({ data: [[1617946860000, 85]] })
  chart.getClosestRow = () => 0
  chart.selectDimensionColor = () => "#00AB44"
  const instance = gaugeChart(sdk, chart)
  const element = document.createElement("div")
  return { chart, instance, element }
}

const record = () => {
  const calls = []
  const listener = (...args) => calls.push(args)
  return { calls, listener }
}

describe("gauge library under the modern flavour (real engine)", () => {
  it("mounts without a canvas and never draws one", () => {
    const { instance, element } = setup({ designFlavour: "modern" })

    expect(() => instance.mount(element)).not.toThrow()
    expect(element.querySelector("canvas")).toBeNull()
    expect(element.childNodes).toHaveLength(0)
    expect(instance.getElement()).toBe(element)
  })

  it("still renders, reports the value range and emits rendered", () => {
    const { chart, instance, element } = setup({ designFlavour: "modern" })
    const rendered = record()
    const yAxisChange = record()
    instance.on("rendered", rendered.listener)
    chart.on("yAxisChange", yAxisChange.listener)

    instance.mount(element)

    expect(rendered.calls.length).toBeGreaterThan(0)
    expect(yAxisChange.calls.map(([min, max]) => [min, max])).toContainEqual([0, 100])
    expect(instance.getMinMax()).toEqual([0, 100])
    expect(instance.render()).toBe(true)
  })

  it("re-renders on hover and ignores a second mount", () => {
    const { chart, instance, element } = setup({ designFlavour: "modern" })
    instance.mount(element)
    const rendered = record()
    instance.on("rendered", rendered.listener)

    instance.mount(element)
    expect(rendered.calls).toHaveLength(0)

    chart.updateAttribute("hoverX", [1617946860000])
    expect(rendered.calls).toHaveLength(1)
  })

  it("stops rendering after unmount", () => {
    const { instance, element } = setup({ designFlavour: "modern" })
    instance.mount(element)
    instance.unmount()

    expect(instance.render()).toBe(false)
  })

  it.each(["default", "minimal"])("keeps drawing on the canvas for %s", designFlavour => {
    const { instance, element } = setup({ designFlavour })
    const canvas = document.createElement("canvas")
    canvas.width = 200
    canvas.height = 200
    element.appendChild(canvas)

    instance.mount(element)

    expect(canvas.style.width).not.toBe("")
    expect(instance.render()).toBe(true)
  })
})
