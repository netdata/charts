import uPlot from "uplot"
import { fireEvent } from "@testing-library/react"
import { makeTestChart } from "@jest/testUtilities"
import { makePayload, makeWave } from "../../../fixtures/makeWavePayload"
import makeOverlays from "./overlays"
import highlight from "./overlays/highlight"

const payload = makePayload({
  context: "anomaly_detection.dimensions",
  title: "Anomalous dimensions",
  unit: "dimensions",
  dimensions: [{ id: "anomalous", values: makeWave({ center: 50, amplitude: 30 }) }],
})
const { after, before } = payload.view
const settle = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

const mount = async (attributes = {}, onUI = () => {}) => {
  const { sdk, chart } = makeTestChart({
    attributes: {
      chartLibrary: "uplot",
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
  onUI(ui)
  ui.mount(element)
  await settle()
  return { sdk, chart, ui, teardown: () => (chart.destroy(), element.remove()) }
}

test("post-underlay geometry and baseline use CSS pixels at the native DPR", async () => {
  const ratio = uPlot.pxRatio
  let mounted
  try {
    const drawings = []
    mounted = await mount({}, ui => {
      ui.on("afterUnderlayCallback", (ctx, area, native) => {
        drawings.push({ area, native, transform: ctx.getTransform() })
      })
    })
    const { ui } = mounted
    const u = ui.getUPlot()
    u.redraw()
    await settle()
    expect(drawings.length).toBeGreaterThan(0)
    const last = drawings[drawings.length - 1]
    expect(last.native).toBe(u)
    expect(last.area).toEqual({
      x: u.bbox.left / ratio,
      y: u.bbox.top / ratio,
      w: u.bbox.width / ratio,
      h: u.bbox.height / ratio,
    })
    expect(last.transform.a).toBe(ratio)
    expect(last.transform.d).toBe(ratio)
    expect(ui.getYCoord(50)).toBeCloseTo(u.bbox.top / ratio + u.valToPos(50, "y"))
    expect(u.ctx.getTransform().a).toBe(1)
    const old = u
    mounted.chart.updateAttribute("theme", "dark")
    await settle()
    expect(ui.getUPlot()).not.toBe(old)
    expect(drawings[drawings.length - 1].native).toBe(ui.getUPlot())
  } finally {
    mounted?.teardown()
  }
})

test("underlay extension restores the canvas if a listener throws", async () => {
  const { ui, teardown } = await mount()
  try {
    const u = ui.getUPlot()
    const original = u.ctx.getTransform()
    const off = ui.on("afterUnderlayCallback", ctx => {
      ctx.globalAlpha = 0.1
      ctx.translate(10, 20)
      throw new Error("extension failed")
    })
    expect(() => u.hooks.drawClear[u.hooks.drawClear.length - 1](u)).toThrow("extension failed")
    off()
    expect(u.ctx.getTransform()).toEqual(original)
    expect(u.ctx.globalAlpha).toBe(1)
  } finally {
    teardown()
  }
})

test.each([false, true])(
  "stationary clicks are forwarded; annotation opt-out is %s",
  async enabled => {
    const { sdk, chart, ui, teardown } = await mount({ annotationsEnabled: enabled })
    try {
      const clicks = []
      const pins = []
      const drafts = []
      ui.on("click", event => clicks.push(event))
      const offPin = sdk.on("highlightClick", () => pins.push(true))
      const offDraft = sdk.on("annotationCreate", () => drafts.push(true))
      const over = ui.getUPlot().over
      fireEvent.mouseDown(over, { clientX: 60, clientY: 50, button: 0 })
      fireEvent.mouseUp(document, { clientX: 60, clientY: 50, button: 0 })
      expect(clicks).toHaveLength(1)
      expect(clicks[0].clientX).toBe(60)
      expect(pins).toHaveLength(enabled ? 1 : 0)
      expect(drafts).toHaveLength(enabled ? 1 : 0)
      expect(chart.getAttribute("draftAnnotation") == null).toBe(!enabled)
      if (!enabled) expect(chart.getAttribute("clickX") == null).toBe(true)
      expect(sdk.getRoot().getAttributes()).toMatchObject({ after, before })
      offPin()
      offDraft()
    } finally {
      teardown()
    }
  }
)

test("drag and modifier gestures do not emit finding clicks", async () => {
  const { ui, teardown } = await mount({ annotationsEnabled: false })
  try {
    const clicks = []
    ui.on("click", event => clicks.push(event))
    const over = ui.getUPlot().over
    fireEvent.mouseDown(over, { clientX: 50, clientY: 50, button: 0 })
    fireEvent.mouseMove(document, { clientX: 70, clientY: 50 })
    fireEvent.mouseUp(document, { clientX: 70, clientY: 50, button: 0 })
    fireEvent.mouseDown(over, { clientX: 50, clientY: 50, button: 0, altKey: true })
    fireEvent.mouseUp(document, { clientX: 50, clientY: 50, button: 0, altKey: true })
    expect(clicks).toEqual([])
    await settle()
  } finally {
    teardown()
  }
})

test("touch taps forward finding selection without pinning when annotations are disabled", async () => {
  const { chart, ui, teardown } = await mount({ annotationsEnabled: false })
  try {
    const clicks = []
    ui.on("click", event => clicks.push(event))
    const over = ui.getUPlot().over
    const touch = { clientX: 60, clientY: 50, target: over }
    fireEvent.touchStart(over, { touches: [touch] })
    fireEvent.touchEnd(over, { touches: [], changedTouches: [touch] })
    expect(clicks).toHaveLength(1)
    expect(chart.getAttribute("clickX") == null).toBe(true)
    expect(chart.getAttribute("draftAnnotation")).toBeNull()
  } finally {
    teardown()
  }
})

test("strict annotation opt-out suppresses saved and draft drawings, not highlights", async () => {
  const { chart, ui, teardown } = await mount({
    annotationsEnabled: false,
    overlays: {
      saved: { type: "annotation", timestamp: after + 100 },
      highlight: { type: "highlight", range: [after + 50, after + 150] },
    },
    draftAnnotation: { timestamp: after + 200, status: "draft" },
  })
  try {
    await new Promise(resolve => requestAnimationFrame(resolve))
    const areas = []
    const offs = ["saved", "draftAnnotation", "highlight"].map(id =>
      ui.on(`overlayedAreaChanged:${id}`, () => areas.push(id))
    )
    makeOverlays(ui).draw(ui.getUPlot())
    await new Promise(resolve => requestAnimationFrame(resolve))
    expect(areas.length).toBeGreaterThan(0)
    expect(new Set(areas)).toEqual(new Set(["highlight"]))
    areas.length = 0
    chart.updateAttribute("annotationsEnabled", true)
    makeOverlays(ui).draw(ui.getUPlot())
    await new Promise(resolve => requestAnimationFrame(resolve))
    expect(new Set(areas)).toEqual(new Set(["saved", "highlight", "draftAnnotation"]))
    offs.forEach(off => off())
  } finally {
    teardown()
  }
})

test.each([
  [0.25, 0.25],
  [-1, 0],
  [2, 1],
  [NaN, 1],
  ["0.25", 1],
])(
  "highlight opacity %s affects fill and borders without leaking canvas state",
  async (value, expected) => {
    const { ui, teardown } = await mount({
      highlightOpacity: value,
      overlays: { highlight: { type: "highlight", range: [after + 50, after + 150] } },
    })
    try {
      const ctx = ui.getUPlot().ctx
      const alphas = []
      const fill = ctx.fill.bind(ctx)
      const stroke = ctx.stroke.bind(ctx)
      ctx.fill = (...args) => (alphas.push(ctx.globalAlpha), fill(...args))
      ctx.stroke = (...args) => (alphas.push(ctx.globalAlpha), stroke(...args))
      highlight(ui, "highlight")
      expect(alphas).toEqual([expected, expected, expected, expected])
      expect(ctx.globalAlpha).toBe(1)
    } finally {
      teardown()
    }
  }
)
