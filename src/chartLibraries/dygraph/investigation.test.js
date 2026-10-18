import { makeTestChart } from "@jest/testUtilities"
import { makePayload, makeWave } from "../../../fixtures/makeWavePayload"
import highlight from "./overlays/highlight"

const payload = makePayload({
  context: "anomaly_detection.dimensions",
  title: "Anomalous dimensions",
  unit: "dimensions",
  dimensions: [{ id: "anomalous", values: makeWave({ center: 50, amplitude: 30 }) }],
})
const { after, before } = payload.view
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

const mount = async (attributes = {}) => {
  const { sdk, chart } = makeTestChart({
    attributes: {
      chartLibrary: "dygraph",
      chartType: "line",
      autoPlay: false,
      after,
      before,
      ...attributes,
    },
  })
  chart.doneFetch(payload)
  await new Promise(resolve => setTimeout(resolve, 0))
  const ui = chart.getUI()
  const element = document.createElement("div")
  element.style.width = "800px"
  element.style.height = "280px"
  document.body.appendChild(element)
  ui.mount(element)
  await nextFrame()
  return { sdk, chart, ui, teardown: () => (chart.destroy(), element.remove()) }
}

const tap = ui => {
  const target = ui.getElement()
  const touch = { target, pageX: 60, pageY: 50, clientX: 60, clientY: 50, screenX: 60, screenY: 50 }
  const context = {}
  const event = { preventDefault: () => {}, stopPropagation: () => {} }
  ui.trigger(
    "touchstart",
    { ...event, touches: [touch], changedTouches: [touch] },
    ui.getDygraph(),
    context
  )
  ui.trigger(
    "touchend",
    { ...event, touches: [], changedTouches: [touch] },
    ui.getDygraph(),
    context
  )
  return context.initialTouches[0].dataX
}

test("annotations are enabled by default", () => {
  const { chart } = makeTestChart()
  expect(chart.getAttribute("annotationsEnabled")).toBe(true)
  chart.destroy()
})

test.each([true, false])(
  "dygraph clicks pin and draft only while annotations are enabled (%s)",
  async enabled => {
    const { sdk, chart, ui, teardown } = await mount({ annotationsEnabled: enabled })
    try {
      const pins = []
      const drafts = []
      const offPin = sdk.on("highlightClick", () => pins.push(true))
      const offDraft = sdk.on("annotationCreate", () => drafts.push(true))
      const x = (after + 100) * 1000
      ui.trigger("click", { target: ui.getElement(), clientX: 200, clientY: 100 }, x, [])
      expect(pins).toHaveLength(enabled ? 1 : 0)
      expect(drafts).toHaveLength(enabled ? 1 : 0)
      expect(chart.getAttribute("draftAnnotation") == null).toBe(!enabled)
      offPin()
      offDraft()
    } finally {
      teardown()
    }
  }
)

test.each([true, false])("dygraph touch taps follow the annotation setting (%s)", async enabled => {
  const { chart, ui, teardown } = await mount({ annotationsEnabled: enabled })
  try {
    const clicks = []
    ui.on("click", (event, x) => clicks.push(x))
    const dataX = tap(ui)
    expect(Number.isFinite(dataX)).toBe(true)
    expect(clicks).toEqual(enabled ? [] : [dataX])
    expect(chart.getAttribute("clickX") ?? null).toEqual(enabled ? [dataX, null] : null)
  } finally {
    teardown()
  }
})

test("dygraph canvas skips saved and draft annotations when annotations are disabled", async () => {
  const { chart, ui, teardown } = await mount({
    annotationsEnabled: false,
    overlays: {
      saved: { type: "annotation", timestamp: after + 100 },
      highlight: { type: "highlight", range: [after + 50, after + 150] },
    },
    draftAnnotation: { timestamp: after + 200, status: "draft" },
  })
  try {
    const areas = []
    const offs = ["saved", "draftAnnotation", "highlight"].map(id =>
      ui.on(`overlayedAreaChanged:${id}`, () => areas.push(id))
    )
    ui.getDygraph().renderGraph_(false)
    await nextFrame()
    expect(new Set(areas)).toEqual(new Set(["highlight"]))
    areas.length = 0
    chart.updateAttribute("annotationsEnabled", true)
    ui.getDygraph().renderGraph_(false)
    await nextFrame()
    expect(new Set(areas)).toEqual(new Set(["saved", "highlight", "draftAnnotation"]))
    offs.forEach(off => off())
  } finally {
    teardown()
  }
})

test("dygraph forwards the post-underlay callback after its own underlay", async () => {
  const { ui, teardown } = await mount()
  try {
    const order = []
    const offUnderlay = ui.on("underlayCallback", () => order.push("underlay"))
    const offAfter = ui.on("afterUnderlayCallback", (ctx, area, dygraph) => {
      order.push("after")
      expect(dygraph).toBe(ui.getDygraph())
    })
    ui.getDygraph().renderGraph_(false)
    expect(order).toEqual(["underlay", "after"])
    expect(ui.getYCoord(50)).toBe(ui.getDygraph().toDomYCoord(50))
    offUnderlay()
    offAfter()
  } finally {
    teardown()
  }
})

const alphasAtDraw = events =>
  events.reduce(
    (state, { type, props }) => {
      if (type === "save") state.stack.push(state.alpha)
      if (type === "restore") state.alpha = state.stack.pop() ?? 1
      if (type === "globalAlpha") state.alpha = props.value
      if (type === "fill" || type === "stroke") state.alphas.push(state.alpha)
      return state
    },
    { alpha: 1, stack: [], alphas: [] }
  ).alphas

test.each([
  [0.25, 0.25],
  [-1, 0],
  [2, 1],
  [NaN, 1],
  ["0.25", 1],
])(
  "dygraph highlight opacity %s dims fill and borders without leaking canvas state",
  async (value, expected) => {
    const { chart, ui, teardown } = await mount({
      highlightOpacity: value,
      overlays: { highlight: { type: "highlight", range: [after + 50, after + 150] } },
    })
    try {
      const ctx = ui.getDygraph().hidden_ctx_
      ctx.__clearEvents()
      highlight(ui, "highlight")
      expect(alphasAtDraw(ctx.__getEvents())).toEqual([expected, expected, expected, expected])
      expect(ctx.globalAlpha).toBe(1)
      expect(chart.getAttribute("overlays").highlight.range).toEqual([after + 50, after + 150])
    } finally {
      teardown()
    }
  }
)
