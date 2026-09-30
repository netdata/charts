import { makeTestChart } from "@jest/testUtilities"
import { makePayload, makeWave } from "@/helpers/makeWavePayload"
import uplotChart from "../index"
import getPxRatio from "../pxRatio"
import makeAnomaly, { getMarkAlpha } from "./anomaly"

const points = 97
const anomalousRows = [10, 40, 41, 80]
const rateAt = index => (anomalousRows.includes(index) ? 30 + index : 0)

const payload = makePayload({
  context: "anomaly.cpu",
  title: "CPU",
  unit: "percentage",
  dimensions: [
    {
      id: "user",
      values: makeWave({ center: 50, amplitude: 30 }),
      anomalyRates: Array.from({ length: points }, (_, index) => rateAt(index)),
    },
  ],
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
    instance,
    u: instance.getUPlot(),
    teardown: () => (instance.unmount(), document.body.removeChild(element)),
  }
}

// records the canvas state at each draw call, then lets the real canvas run it
const record = (ctx, names = ["fill", "fillRect", "strokeRect", "moveTo"]) => {
  const calls = []

  names.forEach(name => {
    const original = ctx[name].bind(ctx)
    ctx[name] = (...args) => {
      calls.push({ name, args, fillStyle: ctx.fillStyle, globalAlpha: ctx.globalAlpha })
      return original(...args)
    }
  })

  return calls
}

const only = (calls, name) => calls.filter(call => call.name === name)

describe("anomaly mark opacity", () => {
  it("follows the rate with a visible floor", () => {
    expect(getMarkAlpha(0)).toBeCloseTo(0.35)
    expect(getMarkAlpha(30)).toBeCloseTo(0.55)
    expect(getMarkAlpha(100)).toBe(1)
  })
})

describe("anomaly plotter flavours", () => {
  it("keeps the full-height ribbon in the default flavour", async () => {
    const { u, instance, teardown } = await mountUplot()
    const calls = record(u.ctx)

    makeAnomaly(instance)(u)

    const rects = only(calls, "fillRect")
    expect(rects).toHaveLength(anomalousRows.length)
    expect(only(calls, "strokeRect")).toHaveLength(anomalousRows.length)
    rects.forEach(call => {
      expect(call.args[1]).toBe(u.bbox.top)
      expect(call.args[3]).toBe(15 * getPxRatio())
    })
    expect(only(calls, "fill")).toHaveLength(0)

    teardown()
  })

  it("keeps the ribbon in the minimal flavour", async () => {
    const { u, instance, teardown } = await mountUplot({ designFlavour: "minimal" })
    const calls = record(u.ctx)

    makeAnomaly(instance)(u)

    expect(only(calls, "fillRect")).toHaveLength(anomalousRows.length)
    expect(only(calls, "fill")).toHaveLength(0)

    teardown()
  })

  it("draws a small rounded mark per anomalous point along the top edge", async () => {
    const { u, instance, teardown } = await mountUplot({ designFlavour: "modern" })
    const calls = record(u.ctx)

    makeAnomaly(instance)(u)

    expect(only(calls, "fillRect")).toHaveLength(0)
    expect(only(calls, "strokeRect")).toHaveLength(0)

    const marks = only(calls, "fill")
    expect(marks).toHaveLength(anomalousRows.length)
    marks.forEach(call => expect(call.fillStyle).toBe("#9f75f9"))
    expect(marks.map(call => call.globalAlpha)).toEqual(
      anomalousRows.map(row => expect.closeTo(getMarkAlpha(rateAt(row))))
    )

    const dpr = getPxRatio()
    const expectedTop = u.bbox.top >= 5 * dpr ? u.bbox.top - 5 * dpr : u.bbox.top + dpr
    const tops = only(calls, "moveTo").map(call => call.args[1])
    expect(tops.every(y => y === expectedTop)).toBe(true)

    teardown()
  })

  it("draws nothing when anomalies are hidden", async () => {
    const { u, instance, teardown } = await mountUplot({
      designFlavour: "modern",
      showAnomalies: false,
    })
    const calls = record(u.ctx)

    makeAnomaly(instance)(u)

    expect(calls).toHaveLength(0)

    teardown()
  })
})
