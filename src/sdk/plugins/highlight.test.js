import { makeTestChart } from "@jest/testUtilities"

describe("highlight navigation", () => {
  it("preserves the chart's paused window when the dashboard is live", () => {
    const { sdk, chart } = makeTestChart({ attributes: { navigation: "highlight" } })
    const pausedWindow = { after: 1617946860, before: 1617947340 }
    const range = [1617946980, 1617947100]
    chart.updateAttributes(pausedWindow)

    sdk.trigger("highlightStart", chart)
    sdk.trigger("highlightEnd", chart, range)

    expect(chart.getAttributes()).toMatchObject(pausedWindow)
    expect(sdk.getRoot().getAttribute("after")).toBe(-900)
    expect(chart.getAttribute("overlays").highlight.range).toEqual(range)
    expect(sdk.getRoot().getAttribute("overlays").highlight.range).toEqual(range)
  })

  it("freezes a live chart at its current duration and preserves paused peer windows", () => {
    const { sdk, chart } = makeTestChart({ attributes: { navigation: "highlight" } })
    const liveAfter = -300
    const peer = sdk.makeChart()
    sdk.appendChild(peer)
    const peerWindow = { after: 1617946860, before: 1617947340 }
    peer.updateAttributes(peerWindow)
    chart.updateAttribute("after", liveAfter)
    const now = Math.floor(Date.now() / 1000)

    sdk.trigger("highlightStart", chart)
    sdk.trigger("highlightEnd", chart, [now - 90, now - 60])

    const { after, before } = chart.getAttributes()
    expect(before).toBeGreaterThanOrEqual(now)
    expect(before - after).toBe(-liveAfter)
    expect(peer.getAttributes()).toMatchObject(peerWindow)
  })
})
