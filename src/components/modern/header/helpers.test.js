import { getScopeParts, getGroupByLabel, getTimeAggregationLabel } from "./scopeSummary"
import { getAttention } from "./getAttention"
import { getZoomLabel } from "./zoomLabel"

const intl = (key, { count = 1 } = {}) => (count === 1 ? key : `${key}s`)

describe("getScopeParts", () => {
  it("summarises group by, aggregation, counts and time aggregation", () => {
    expect(
      getScopeParts(
        {
          groupBy: ["dimension"],
          groupByLabel: [],
          aggregationMethod: "avg",
          nodesTotals: { sl: 1, qr: 1 },
          instancesTotals: { sl: 2, qr: 2 },
          dimensionsTotals: { sl: 3, qr: 3 },
          labelsTotals: { sl: 2, qr: 2 },
          groupingMethod: "average",
          viewUpdateEvery: 5,
        },
        intl
      )
    ).toEqual([
      "Group by dimension",
      "Average",
      "1 node",
      "2 instances",
      "3 dimensions",
      "2 labels",
      "Average every 5s",
    ])
  })

  it("skips parts the payload has not provided yet", () => {
    expect(getScopeParts({ groupBy: [], aggregationMethod: "sum" }, intl)).toEqual(["Sum"])
  })

  it("labels group by like the group by dropdown", () => {
    expect(getGroupByLabel(["node", "dimension"], [])).toBe("Group by dimension, node")
    expect(getGroupByLabel(["label"], ["a", "b"])).toBe("Group by 2 labels")
    expect(getGroupByLabel(["label"], ["mount"])).toBe("Group by mount")
    expect(getGroupByLabel([], [])).toBe("")
  })

  it("keeps the percentile alias", () => {
    expect(getTimeAggregationLabel("percentile95", 2)).toBe("Percentile 95 every 2s")
    expect(getTimeAggregationLabel("", 2)).toBe("")
  })
})

describe("getAttention", () => {
  it("returns null when the chart has no alert data", () => {
    expect(getAttention({ overlays: {}, alerts: {} })).toBeNull()
    expect(getAttention({ overlays: { proceeded: { type: "proceeded" } } })).toBeNull()
  })

  it("is clear when every attached alert is clear", () => {
    expect(getAttention({ alerts: { load: { nm: "load", cl: 1 } } })).toEqual({ status: "clear" })
  })

  it("lists raised alerts from the summary, critical first", () => {
    expect(
      getAttention({
        alerts: {
          a: { nm: "a", wr: 1 },
          b: { nm: "b", cr: 1 },
          c: { nm: "c", cl: 1 },
        },
      })
    ).toEqual({ status: "critical", names: ["b", "a"], value: null, when: null })
  })

  it("takes the triggered value and time from an alarm overlay", () => {
    expect(
      getAttention({
        overlays: { alarm: { type: "alarm", status: "warning", value: 538, when: 1000 } },
        alerts: { load: { nm: "load", wr: 1 } },
      })
    ).toEqual({ status: "warning", names: ["load"], value: 538, when: 1000 })
  })

  it("reads alarmRange and the latest alert transition", () => {
    expect(
      getAttention({
        overlays: {
          range: { type: "alarmRange", status: "critical", valueTriggered: 7, whenTriggered: 50 },
        },
      })
    ).toEqual({ status: "critical", names: [], value: 7, when: 50 })

    expect(
      getAttention({
        overlays: {
          t: {
            type: "alertTransitions",
            transitions: [
              { timestamp: 200, to: "CLEAR", value: 1 },
              { timestamp: 100, to: "CRITICAL", value: 9 },
            ],
          },
        },
      })
    ).toEqual({ status: "clear" })
  })
})

describe("getZoomLabel", () => {
  const formatTime = date => date.toISOString().slice(11, 19)

  it("is null for relative windows", () => {
    expect(getZoomLabel({ after: -900, before: 0, formatTime })).toBeNull()
    expect(getZoomLabel({ after: -3600, before: 0, formatTime })).toBeNull()
  })

  it("names an absolute window in hours and minutes", () => {
    const after = Date.UTC(2026, 0, 1, 17, 24, 10) / 1000
    const before = Date.UTC(2026, 0, 1, 17, 36, 50) / 1000

    expect(getZoomLabel({ after, before, formatTime })).toBe("Zoomed to 17:24–17:36")
  })
})
