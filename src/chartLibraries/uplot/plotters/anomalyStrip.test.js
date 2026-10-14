import { makeTestChart } from "@jest/testUtilities"
import { makePayload, makeWave } from "../../../../fixtures/makeWavePayload"
import uplotChart from "../index"
import getPxRatio from "../pxRatio"
import { getAnomalyColor } from "@/components/modern/anomaly"
import makeAnomaly, { makeAnomalyShade } from "./anomaly"
import makeAnomalyBadge from "./anomalyBadge"

const points = 97
const anomalousRows = [10, 40, 41, 80]
const rateAt = index => (anomalousRows.includes(index) ? 30 + index : 0)

const makeAnomalyPayload = rate =>
  makePayload({
    context: "anomaly.cpu",
    title: "CPU",
    unit: "percentage",
    dimensions: [
      {
        id: "user",
        values: makeWave({ center: 50, amplitude: 30 }),
        anomalyRates: Array.from({ length: points }, (_, index) => rate(index)),
      },
    ],
  })

const payload = makeAnomalyPayload(rateAt)

const { after, before } = payload.view

const mountUplot = async (attributes = {}, data = payload) => {
  const { sdk, chart } = makeTestChart({
    attributes: { chartLibrary: "uplot", chartType: "line", after, before, ...attributes },
  })
  chart.doneFetch(data)
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

const canvasColor = (ctx, color) => {
  ctx.fillStyle = color
  return ctx.fillStyle
}

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
    expect(marks.map(call => call.fillStyle)).toEqual(
      anomalousRows.map(row => canvasColor(u.ctx, getAnomalyColor(instance.chart, rateAt(row))))
    )

    const dpr = getPxRatio()
    const expectedTop = u.bbox.top >= 6 * dpr ? u.bbox.top - 6 * dpr : u.bbox.top + dpr
    const tops = only(calls, "moveTo").map(call => call.args[1])
    expect(tops.every(y => y === expectedTop)).toBe(true)

    teardown()
  })

  it("draws a sub-1% rate with the low end of the ramp", async () => {
    const { u, instance, teardown } = await mountUplot(
      { designFlavour: "modern" },
      makeAnomalyPayload(index => (anomalousRows.includes(index) ? 0.5 : 0))
    )
    const calls = record(u.ctx)

    makeAnomaly(instance)(u)

    const marks = only(calls, "fill")
    expect(marks).toHaveLength(anomalousRows.length)
    marks.forEach(call =>
      expect(call.fillStyle).toBe(canvasColor(u.ctx, "rgba(202, 187, 251, 1)"))
    )

    teardown()
  })

  it("leaves the modern badge to the HTML overlay", async () => {
    const busy = await mountUplot({ designFlavour: "modern" })
    const busyCalls = record(busy.u.ctx)
    makeAnomalyBadge(busy.instance)(busy.u)
    expect(only(busyCalls, "fill")).toHaveLength(0)
    busy.teardown()
  })

  it("shades each anomalous point behind the series over the full plot height", async () => {
    const { u, instance, teardown } = await mountUplot({ designFlavour: "modern" })
    const calls = record(u.ctx)

    makeAnomalyShade(instance)(u)

    const rects = only(calls, "fillRect")
    expect(rects).toHaveLength(anomalousRows.length)
    rects.forEach(call => {
      expect(call.args[1]).toBe(u.bbox.top)
      expect(call.args[3]).toBe(u.bbox.height)
    })

    teardown()
  })

  it.each(["default", "minimal"])("draws no shade in the %s flavour", async designFlavour => {
    const { u, instance, teardown } = await mountUplot({ designFlavour })
    const calls = record(u.ctx)

    makeAnomalyShade(instance)(u)

    expect(calls).toHaveLength(0)

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

  it("draws nothing on a modern sparkline", async () => {
    const { u, instance, teardown } = await mountUplot({ designFlavour: "modern", sparkline: true })
    const calls = record(u.ctx)

    makeAnomaly(instance)(u)

    expect(calls).toHaveLength(0)

    teardown()
  })

  it("keeps the ribbon on a default sparkline", async () => {
    const { u, instance, teardown } = await mountUplot({ sparkline: true })
    const calls = record(u.ctx)

    makeAnomaly(instance)(u)

    expect(only(calls, "fillRect")).toHaveLength(anomalousRows.length)

    teardown()
  })
})
