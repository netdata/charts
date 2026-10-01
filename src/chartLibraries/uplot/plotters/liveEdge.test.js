import { makeTestChart } from "@jest/testUtilities"
import { makePayload, makeWave } from "@/helpers/makeWavePayload"
import uplotChart from "../index"
import getPxRatio from "../pxRatio"
import makeLiveEdge, {
  dotRadius,
  glowBlur,
  haloAlpha,
  haloRadius,
  isFollowingNow,
  maxGlowSeries,
  shouldGlow,
} from "./liveEdge"

const makeSeries = count =>
  makePayload({
    context: "live.edge",
    title: "Live edge",
    unit: "percentage",
    dimensions: Array.from({ length: count }, (_, index) => ({
      id: `dim${index}`,
      values: makeWave({ center: 20 + index * 5, amplitude: 3, phase: index }),
    })),
  })

const mountUplot = async (attributes = {}, payload = makeSeries(3)) => {
  const { after, before } = payload.view
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

  chart.setAttribute("after", -900)

  return {
    chart,
    instance,
    u: instance.getUPlot(),
    teardown: () => (instance.unmount(), document.body.removeChild(element)),
  }
}

const record = ctx => {
  const calls = []
  const original = ctx.arc.bind(ctx)
  ctx.arc = (...args) => {
    calls.push({
      args,
      fillStyle: ctx.fillStyle,
      globalAlpha: ctx.globalAlpha,
      shadowBlur: ctx.shadowBlur,
    })
    return original(...args)
  }
  return calls
}

const live = { designFlavour: "modern", legendMode: "live" }

describe("live edge gating", () => {
  it("follows now only for a relative, unpaused window", async () => {
    const { chart, teardown } = await mountUplot(live)

    expect(isFollowingNow(chart)).toBe(true)
    chart.getRoot().setAttribute("paused", true)
    expect(isFollowingNow(chart)).toBe(false)
    chart.getRoot().setAttribute("paused", false)
    chart.setAttribute("after", 1000)
    expect(isFollowingNow(chart)).toBe(false)

    teardown()
  })

  it.each([
    ["the default flavour", { legendMode: "live" }],
    ["the minimal flavour", { designFlavour: "minimal", legendMode: "live" }],
    ["another legend layout", { designFlavour: "modern", legendMode: "direct" }],
    ["a stacked chart", { ...live, chartType: "stacked" }],
    ["a sparkline", { ...live, sparkline: true }],
  ])("draws nothing for %s", async (_, attributes) => {
    const { chart, u, instance, teardown } = await mountUplot(attributes)
    const calls = record(u.ctx)

    makeLiveEdge(instance)(u)

    expect(shouldGlow(chart)).toBe(false)
    expect(calls).toHaveLength(0)

    teardown()
  })

  it("draws nothing while paused or on a fixed window", async () => {
    const { chart, u, instance, teardown } = await mountUplot(live)
    const calls = record(u.ctx)

    chart.getRoot().setAttribute("paused", true)
    makeLiveEdge(instance)(u)
    chart.getRoot().setAttribute("paused", false)
    chart.setAttribute("after", 1000)
    makeLiveEdge(instance)(u)

    expect(calls).toHaveLength(0)

    teardown()
  })
})

describe("live edge glow", () => {
  it("draws a halo and a glowing dot on each visible series' newest point", async () => {
    const { chart, u, instance, teardown } = await mountUplot(live)
    const calls = record(u.ctx)

    makeLiveEdge(instance)(u)

    const dpr = getPxRatio()
    expect(calls).toHaveLength(6)

    chart.getPayloadDimensionIds().forEach((id, index) => {
      const [halo, dot] = calls.slice(index * 2, index * 2 + 2)
      const values = u.data[index + 1]
      const last = values.length - 1

      expect(halo.args[0]).toBeCloseTo(u.valToPos(u.data[0][last], "x", true))
      expect(halo.args[1]).toBeCloseTo(u.valToPos(values[last], "y", true))
      expect(halo.args[2]).toBe(haloRadius * dpr)
      expect(halo.globalAlpha).toBeCloseTo(haloAlpha)
      expect(halo.shadowBlur).toBe(0)
      expect(dot.args[2]).toBe(dotRadius * dpr)
      expect(dot.globalAlpha).toBe(1)
      expect(dot.shadowBlur).toBe(glowBlur * dpr)
      expect(dot.fillStyle.toLowerCase()).toBe(chart.selectDimensionColor(id).toLowerCase())
    })

    teardown()
  })

  it("skips hidden series", async () => {
    const { chart, u, instance, teardown } = await mountUplot(live)
    u.series[2].show = false
    const calls = record(u.ctx)

    makeLiveEdge(instance)(u)

    expect(calls).toHaveLength(4)
    expect(chart.getAttribute("legendMode")).toBe("live")

    teardown()
  })

  it("never glows more than the labelled series cap", async () => {
    const { u, instance, teardown } = await mountUplot(live, makeSeries(12))
    const calls = record(u.ctx)

    makeLiveEdge(instance)(u)

    expect(calls).toHaveLength(maxGlowSeries * 2)

    teardown()
  })

  it("reserves the halo's room on the right only in the live layout", async () => {
    const modern = await mountUplot(live)
    expect(modern.u.padding[1](modern.u, 1, [], 0)).toBe(haloRadius)
    modern.teardown()

    const classic = await mountUplot({ legendMode: "live" })
    expect(classic.u.padding[1](classic.u, 1, [], 0)).toBe(0)
    classic.teardown()
  })
})

describe("live edge in the uPlot draw cycle", () => {
  const spyRedraw = u => {
    const calls = []
    const original = u.redraw
    u.redraw = (...args) => {
      calls.push(args)
      return original(...args)
    }
    return calls
  }

  it("runs on every redraw of a live modern chart", async () => {
    const { u, teardown } = await mountUplot(live)
    const calls = record(u.ctx)

    u.redraw(false, false)
    await Promise.resolve()

    expect(calls.filter(call => call.args[2] === haloRadius * getPxRatio())).toHaveLength(3)

    teardown()
  })

  it("re-lays out when the modern legend enters or leaves the live layout", async () => {
    const { chart, u, teardown } = await mountUplot({
      designFlavour: "modern",
      legendMode: "table",
    })
    const calls = spyRedraw(u)

    chart.updateAttribute("legendMode", "below")
    expect(calls).toHaveLength(0)
    chart.updateAttribute("legendMode", "live")
    chart.updateAttribute("legendMode", "table")
    expect(calls).toEqual([
      [false, true],
      [false, true],
    ])

    teardown()
  })

  it("repaints when the root pauses, only in the live layout", async () => {
    const modern = await mountUplot(live)
    const modernCalls = spyRedraw(modern.u)
    modern.chart.getRoot().updateAttribute("paused", true)
    expect(modernCalls).toEqual([[false, false]])
    modern.teardown()

    const classic = await mountUplot({ legendMode: "live" })
    const classicCalls = spyRedraw(classic.u)
    classic.chart.getRoot().updateAttribute("paused", true)
    classic.chart.updateAttribute("legendMode", "table")
    expect(classicCalls).toHaveLength(0)
    classic.teardown()
  })
})
