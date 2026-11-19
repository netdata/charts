import { makeTestChart } from "@jest/testUtilities"
import { makePayload, makeWave } from "../../../../fixtures/makeWavePayload"
import uplotChart from "../index"
import { getThresholdExtent } from "./threshold"

const payload = makePayload({
  context: "overlays.cpu",
  title: "CPU",
  unit: "percentage",
  dimensions: [{ id: "user", values: makeWave({ center: 50, amplitude: 30 }) }],
})

const { after, before } = payload.view

const mountUplot = async (attributes = {}) => {
  const { sdk, chart } = makeTestChart({
    attributes: { chartLibrary: "uplot", chartType: "line", after, before, ...attributes },
  })
  chart.doneFetch(payload)
  await new Promise(resolve => setTimeout(resolve, 0))

  const instance = uplotChart(sdk, chart)
  const element = document.createElement("div")
  element.style.width = "800px"
  element.style.height = "300px"
  document.body.appendChild(element)
  instance.mount(element)
  await Promise.resolve()
  await Promise.resolve()

  return {
    chart,
    u: instance.getUPlot(),
    teardown: () => (instance.unmount(), document.body.removeChild(element)),
  }
}

const settle = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

const high = { levels: { type: "threshold", warning: 150, critical: 200 } }
const low = { levels: { type: "threshold", warning: 5, critical: 2 } }

describe("threshold extent", () => {
  it("spans every numeric level of the threshold overlays", () => {
    expect(
      getThresholdExtent({
        a: { type: "threshold", warning: 150, critical: 200 },
        b: { type: "threshold", warning: -3 },
        c: { type: "alarm", value: 999 },
      })
    ).toEqual([-3, 200])
  })

  it("is empty without threshold levels", () => {
    expect(getThresholdExtent({})).toBeNull()
    expect(getThresholdExtent({ a: { type: "threshold" } })).toBeNull()
    expect(getThresholdExtent(undefined)).toBeNull()
  })
})

describe("uPlot y range with threshold levels", () => {
  it("grows up to levels above the data on modern charts", async () => {
    const { u, teardown } = await mountUplot({ designFlavour: "modern", overlays: high })

    const [, max] = u.scales.y.range(u, 20, 80)
    expect(max).toBeGreaterThanOrEqual(200)

    teardown()
  })

  it("grows down to low levels below the data on modern charts", async () => {
    const { u, teardown } = await mountUplot({ designFlavour: "modern", overlays: low })

    const [min] = u.scales.y.range(u, 20, 80)
    expect(min).toBeLessThanOrEqual(2)

    teardown()
  })

  it("keeps the data range where levels are not drawn", async () => {
    const { u, teardown } = await mountUplot({ designFlavour: "default", overlays: high })

    const [, max] = u.scales.y.range(u, 20, 80)
    expect(max).toBeLessThan(150)

    teardown()
  })

  it("keeps a value range the user fixed", async () => {
    const { u, teardown } = await mountUplot({
      designFlavour: "modern",
      overlays: high,
      valueRange: [0, 100],
    })

    const [, max] = u.scales.y.range(u, 20, 80)
    expect(max).toBeLessThan(150)

    teardown()
  })

  it("rescales when levels are added and removed after mount", async () => {
    const { chart, u, teardown } = await mountUplot({ designFlavour: "modern" })

    expect(u.scales.y.max).toBeLessThan(150)

    chart.updateAttribute("overlays", { ...chart.getAttribute("overlays"), ...high })
    await settle()
    expect(u.scales.y.max).toBeGreaterThanOrEqual(200)

    chart.updateAttribute("overlays", {})
    await settle()
    expect(u.scales.y.max).toBeLessThan(150)

    teardown()
  })
})
