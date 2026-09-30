import { makeTestChart } from "@jest/testUtilities"
import { makePayload, makeWave } from "@/helpers/makeWavePayload"
import uplotChart from "../index"
import alarm from "./alarm"
import alarmRange from "./alarmRange"
import alertTransitions from "./alertTransitions"
import annotation from "./annotation"
import threshold, { formatThreshold, getLevels, placeLabels } from "./threshold"
import types from "./types"
import { getStatusColor, isModern, roundedRectPath } from "./modern"

const payload = makePayload({
  context: "overlays.cpu",
  title: "CPU",
  unit: "percentage",
  dimensions: [{ id: "user", values: makeWave({ center: 50, amplitude: 30 }) }],
})

const { after, before } = payload.view
const middle = Math.round((after + before) / 2)

const light = { warning: "#c98a00", critical: "#d63f3f", clear: "#00914a" }
const dark = { warning: "#e0a526", critical: "#e5484d" }

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
const record = (ctx, names = ["stroke", "fill", "fillRect", "fillText", "arc", "moveTo"]) => {
  const calls = []

  names.forEach(name => {
    const original = ctx[name].bind(ctx)
    ctx[name] = (...args) => {
      calls.push({
        name,
        args,
        strokeStyle: ctx.strokeStyle,
        fillStyle: ctx.fillStyle,
        globalAlpha: ctx.globalAlpha,
        lineWidth: ctx.lineWidth,
        dash: ctx.getLineDash(),
      })
      return original(...args)
    }
  })

  return calls
}

const only = (calls, name) => calls.filter(call => call.name === name)

describe("modern overlay helpers", () => {
  it("is modern only for the modern flavour", async () => {
    const { chart } = makeTestChart()

    expect(isModern(chart)).toBe(false)
    chart.updateAttribute("designFlavour", "minimal")
    expect(isModern(chart)).toBe(false)
    chart.updateAttribute("designFlavour", "modern")
    expect(isModern(chart)).toBe(true)
  })

  it("reads alert colours from the chart theme", () => {
    const { chart } = makeTestChart()

    expect(getStatusColor(chart, "warning")).toBe("#C98A00")
    expect(getStatusColor(chart, "CRITICAL")).toBe("#D63F3F")
    expect(getStatusColor(chart, "clear")).toBe("#00914A")
    expect(getStatusColor(chart, "undefined-status")).toBeNull()

    chart.updateAttribute("theme", "dark")
    expect(getStatusColor(chart, "warning")).toBe("#E0A526")
    expect(getStatusColor(chart, "critical")).toBe("#E5484D")
  })

  it("never asks for a radius larger than half the rectangle", () => {
    const ctx = document.createElement("canvas").getContext("2d")
    const calls = record(ctx, ["arcTo"])

    roundedRectPath(ctx, 0, 0, 4, 2, 10)

    expect(calls).toHaveLength(4)
    calls.forEach(call => expect(call.args[4]).toBe(1))
  })
})

describe("threshold levels", () => {
  it("bands each threshold up to the next one, the last up to the edge", () => {
    expect(getLevels({ warning: 80, critical: 90 })).toEqual([
      { status: "warning", value: 80, direction: "above", until: 90 },
      { status: "critical", value: 90, direction: "above", until: null },
    ])
  })

  it("reads a critical value below the warning one as a low threshold", () => {
    expect(getLevels({ warning: 20, critical: 10 })).toEqual([
      { status: "warning", value: 20, direction: "below", until: 10 },
      { status: "critical", value: 10, direction: "below", until: null },
    ])
  })

  it("keeps an explicit direction and never bands backwards", () => {
    expect(getLevels({ warning: 20, critical: 10, direction: "above" })).toEqual([
      { status: "warning", value: 20, direction: "above", until: null },
      { status: "critical", value: 10, direction: "above", until: null },
    ])
  })

  it("draws only the thresholds that are numbers", () => {
    expect(getLevels({ critical: 90 })).toEqual([
      { status: "critical", value: 90, direction: "above", until: null },
    ])
    expect(getLevels({ warning: "80" })).toEqual([])
    expect(getLevels()).toEqual([])
  })

  it("slides a label right when it would cover the previous one", () => {
    expect(
      placeLabels([
        { y: 100, width: 90 },
        { y: 110, width: 80 },
        { y: 200, width: 80 },
      ]).map(label => label.shift)
    ).toEqual([0, 98, 0])
  })

  it("formats the threshold like the y axis", async () => {
    const { chart, teardown } = await mountUplot()

    expect(formatThreshold(chart, 80)).toBe("80 %")

    teardown()
  })
})

describe("threshold overlay", () => {
  const overlays = { alert: { type: "threshold", warning: 60, critical: 70 } }

  it("is registered as an overlay type", () => {
    expect(types.threshold).toBe(threshold)
  })

  it("draws nothing in the default flavour", async () => {
    const { u, instance, teardown } = await mountUplot({ overlays })
    const calls = record(u.ctx)

    threshold(instance, "alert")

    expect(calls).toHaveLength(0)

    teardown()
  })

  it("draws nothing in the minimal flavour", async () => {
    const { u, instance, teardown } = await mountUplot({ overlays, designFlavour: "minimal" })
    const calls = record(u.ctx)

    threshold(instance, "alert")

    expect(calls).toHaveLength(0)

    teardown()
  })

  it("labels each threshold with its value", async () => {
    const { u, instance, teardown } = await mountUplot({ overlays, designFlavour: "modern" })
    const calls = record(u.ctx)

    threshold(instance, "alert")

    const texts = only(calls, "fillText")
    expect(texts.map(call => call.args[0])).toEqual(["Warning at 60 %", "Critical at 70 %"])
    expect(texts.map(call => call.fillStyle)).toEqual([light.warning, light.critical])
    expect(texts.every(call => call.globalAlpha === 1)).toBe(true)

    teardown()
  })

  it("fills a faint band above each threshold, warning then critical", async () => {
    const { u, instance, teardown } = await mountUplot({ overlays, designFlavour: "modern" })
    const { top } = instance.getPlotArea()
    const toY = value => top + u.valToPos(value, "y")
    const calls = record(u.ctx)

    threshold(instance, "alert")

    const [warning, critical] = only(calls, "fillRect")
    expect(warning.fillStyle).toBe(light.warning)
    expect(warning.globalAlpha).toBeCloseTo(0.07)
    expect(warning.args[1]).toBeCloseTo(toY(70))
    expect(warning.args[1] + warning.args[3]).toBeCloseTo(toY(60))

    expect(critical.fillStyle).toBe(light.critical)
    expect(critical.args[1]).toBeCloseTo(top)
    expect(critical.args[1] + critical.args[3]).toBeCloseTo(toY(70))

    teardown()
  })

  it("draws dashed threshold lines that stop at the label pill", async () => {
    const { u, instance, teardown } = await mountUplot({ overlays, designFlavour: "modern" })
    const { left, width } = instance.getPlotArea()
    const calls = record(u.ctx)

    threshold(instance, "alert")

    const dashed = only(calls, "stroke").filter(call => call.dash.join() === "3,4")
    expect(dashed).toHaveLength(4)
    expect(dashed.map(call => call.strokeStyle)).toEqual([
      light.warning,
      light.warning,
      light.critical,
      light.critical,
    ])

    const starts = only(calls, "moveTo").map(call => call.args[0])
    expect(starts).toContain(left)
    expect(starts.every(x => x <= left + width)).toBe(true)

    teardown()
  })

  it("offsets labels whose thresholds are close together", async () => {
    const { u, instance, teardown } = await mountUplot({
      overlays: { alert: { type: "threshold", warning: 60, critical: 61 } },
      designFlavour: "modern",
    })
    const calls = record(u.ctx)

    threshold(instance, "alert")

    const [warning, critical] = only(calls, "fillText")
    const warningPill = u.ctx.measureText(warning.args[0]).width + 12
    expect(critical.args[1]).toBe(warning.args[1] + warningPill + 8)

    teardown()
  })

  it("bands downwards for a low threshold", async () => {
    const { u, instance, teardown } = await mountUplot({
      overlays: { alert: { type: "threshold", warning: 30, critical: 20 } },
      designFlavour: "modern",
    })
    const { top, height } = instance.getPlotArea()
    const toY = value => top + u.valToPos(value, "y")
    const calls = record(u.ctx)

    threshold(instance, "alert")

    const [warning, critical] = only(calls, "fillRect")
    expect(warning.args[1]).toBeCloseTo(toY(30))
    expect(warning.args[1] + warning.args[3]).toBeCloseTo(toY(20))
    expect(critical.args[1] + critical.args[3]).toBeCloseTo(top + height)

    teardown()
  })

  it("skips the line and label of a threshold above the visible range", async () => {
    const { u, instance, teardown } = await mountUplot({
      overlays: { alert: { type: "threshold", warning: 80, critical: 500 } },
      designFlavour: "modern",
    })
    const calls = record(u.ctx)

    threshold(instance, "alert")

    expect(only(calls, "fillText").map(call => call.args[0])).toEqual(["Warning at 80 %"])
    expect(only(calls, "fillRect")).toHaveLength(1)

    teardown()
  })

  it("draws full lines without labels on a sparkline", async () => {
    const { u, instance, teardown } = await mountUplot({
      overlays,
      designFlavour: "modern",
      sparkline: true,
    })
    const calls = record(u.ctx)

    threshold(instance, "alert")

    expect(only(calls, "fillText")).toHaveLength(0)
    expect(only(calls, "stroke").filter(call => call.dash.join() === "3,4")).toHaveLength(2)

    teardown()
  })

  it("uses the dark theme colours", async () => {
    const { u, instance, teardown } = await mountUplot({
      overlays,
      designFlavour: "modern",
      theme: "dark",
    })
    const calls = record(u.ctx)

    threshold(instance, "alert")

    expect(only(calls, "fillText").map(call => call.fillStyle)).toEqual([
      dark.warning,
      dark.critical,
    ])

    teardown()
  })

  it("is drawn by the overlay layer on redraw", async () => {
    const { u, teardown } = await mountUplot({ overlays, designFlavour: "modern" })
    const calls = record(u.ctx)

    u.redraw(false)
    await Promise.resolve()

    const labels = only(calls, "fillText").filter(call => / at /.test(call.args[0]))
    expect(labels.map(call => call.args[0])).toEqual(["Warning at 60 %", "Critical at 70 %"])

    teardown()
  })
})

describe("alarm overlay flavours", () => {
  const overlays = { a: { type: "alarm", when: middle, status: "critical", value: "72 %" } }

  it("keeps the 2px dashed line in the default flavour", async () => {
    const { u, instance, teardown } = await mountUplot({ overlays })
    const calls = record(u.ctx)

    alarm(instance, "a")

    const [line] = only(calls, "stroke")
    expect(line).toMatchObject({ strokeStyle: "#ff4136", lineWidth: 2, globalAlpha: 1 })
    expect(line.dash).toEqual([4, 4])

    teardown()
  })

  it("draws a thin themed rule in the modern flavour", async () => {
    const { u, instance, teardown } = await mountUplot({ overlays, designFlavour: "modern" })
    const calls = record(u.ctx)

    alarm(instance, "a")

    const [line] = only(calls, "stroke")
    expect(line).toMatchObject({ strokeStyle: light.critical, lineWidth: 1 })
    expect(line.dash).toEqual([3, 4])

    teardown()
  })
})

describe("alarm range overlay flavours", () => {
  const overlays = {
    r: { type: "alarmRange", whenTriggered: middle - 60, whenLast: middle, status: "warning" },
  }

  it("keeps the tinted range in the default flavour", async () => {
    const { u, instance, teardown } = await mountUplot({ overlays })
    const calls = record(u.ctx)

    alarmRange(instance, "r")

    const [fill] = only(calls, "fill")
    expect(fill).toMatchObject({ fillStyle: "#ffc300" })
    expect(fill.globalAlpha).toBeCloseTo(0.1)
    expect(only(calls, "stroke").map(call => call.strokeStyle)).toEqual(["#fff8e1", "#f9a825"])
    expect(only(calls, "fillRect")).toHaveLength(0)

    teardown()
  })

  it("draws a faint themed band with dashed edges in the modern flavour", async () => {
    const { u, instance, teardown } = await mountUplot({ overlays, designFlavour: "modern" })
    const calls = record(u.ctx)

    alarmRange(instance, "r")

    const [band] = only(calls, "fillRect")
    expect(band.fillStyle).toBe(light.warning)
    expect(band.globalAlpha).toBeCloseTo(0.07)
    const edges = only(calls, "stroke")
    expect(edges).toHaveLength(2)
    edges.forEach(edge => expect(edge).toMatchObject({ strokeStyle: light.warning, lineWidth: 1 }))

    teardown()
  })
})

describe("alert transitions overlay flavours", () => {
  const overlays = {
    t: {
      type: "alertTransitions",
      transitions: [
        { timestamp: middle - 120, to: "warning" },
        { timestamp: middle, to: "clear" },
      ],
    },
  }

  it("keeps the strong tint in the default flavour", async () => {
    const { u, instance, teardown } = await mountUplot({ overlays })
    const calls = record(u.ctx)

    alertTransitions(instance, "t")

    const fills = only(calls, "fill")
    expect(fills.map(call => call.fillStyle)).toEqual(["#ffc300", "#00ab44"])
    fills.forEach(call => expect(call.globalAlpha).toBeCloseTo(0.3))

    teardown()
  })

  it("uses a lighter themed tint in the modern flavour", async () => {
    const { u, instance, teardown } = await mountUplot({ overlays, designFlavour: "modern" })
    const calls = record(u.ctx)

    alertTransitions(instance, "t")

    const fills = only(calls, "fill")
    expect(fills.map(call => call.fillStyle)).toEqual([light.warning, light.clear])
    fills.forEach(call => expect(call.globalAlpha).toBeCloseTo(0.1))

    teardown()
  })
})

describe("annotation overlay flavours", () => {
  const overlays = {
    n: { type: "annotation", timestamp: middle, color: "#0075F2", position: "bottom" },
  }

  it("keeps the round marker in the default flavour", async () => {
    const { u, instance, teardown } = await mountUplot({ overlays })
    const { top, height } = instance.getPlotArea()
    const calls = record(u.ctx)

    annotation(instance, "n")

    const [marker] = only(calls, "arc")
    expect(marker.args[1]).toBeCloseTo(top + height)
    expect(only(calls, "fill")).toHaveLength(1)

    teardown()
  })

  it("hangs a flag from the plot top on a thin rule in the modern flavour", async () => {
    const { u, instance, teardown } = await mountUplot({ overlays, designFlavour: "modern" })
    const { top } = instance.getPlotArea()
    const calls = record(u.ctx)

    annotation(instance, "n")

    expect(only(calls, "arc")).toHaveLength(0)

    const [rule] = only(calls, "stroke")
    expect(rule).toMatchObject({ strokeStyle: "#0075f2", lineWidth: 1 })
    expect(rule.globalAlpha).toBeCloseTo(0.5)

    const [flag] = only(calls, "fill")
    expect(flag).toMatchObject({ fillStyle: "#0075f2", globalAlpha: 1 })

    const moves = only(calls, "moveTo").map(call => call.args[1])
    expect(moves.every(y => y === top)).toBe(true)

    teardown()
  })

  it("dashes a synced annotation in the modern flavour", async () => {
    const { u, instance, teardown } = await mountUplot({
      overlays: { n: { ...overlays.n, originallyFrom: "other-chart" } },
      designFlavour: "modern",
    })
    const calls = record(u.ctx)

    annotation(instance, "n")

    expect(only(calls, "stroke")[0].dash).toEqual([3, 3])
    expect(only(calls, "fill")[0].globalAlpha).toBeCloseTo(0.7)

    teardown()
  })

  it("draws the draft as a hollow muted flag in the modern flavour", async () => {
    const { chart, u, instance, teardown } = await mountUplot({ designFlavour: "modern" })
    chart.updateAttribute("draftAnnotation", { timestamp: middle })
    const calls = record(u.ctx)

    annotation(instance, "draftAnnotation")

    expect(only(calls, "arc")).toHaveLength(0)
    expect(only(calls, "fill")).toHaveLength(0)
    const strokes = only(calls, "stroke")
    expect(strokes).toHaveLength(2)
    strokes.forEach(call => expect(call.strokeStyle).toBe("#5c6c77"))

    teardown()
  })

  it("keeps the grey half circle for the draft in the default flavour", async () => {
    const { chart, u, instance, teardown } = await mountUplot()
    chart.updateAttribute("draftAnnotation", { timestamp: middle })
    const calls = record(u.ctx)

    annotation(instance, "draftAnnotation")

    expect(only(calls, "arc")).toHaveLength(1)
    only(calls, "stroke").forEach(call => expect(call.strokeStyle).toBe("#888888"))

    teardown()
  })
})
