import { makeTestChart } from "@jest/testUtilities"
import { getWeightsWindow } from "./helpers"
import { getWeightsBaseline } from "@/sdk/correlationBaseline"

test.each(["volume", "ks2", undefined])(
  "coarse live %s weights use the captured clock even when data requests remain relative",
  method => {
    const { chart } = makeTestChart({
      attributes: {
        after: -900,
        before: 0,
        renderedAt: 1791000000000,
        fetchStartedAt: 1791000000000,
        viewUpdateEvery: 3600,
        method,
      },
    })
    try {
      const window = getWeightsWindow(chart)
      expect(window).toEqual({ after: 1790999100, before: 1791000000 })
      expect(getWeightsBaseline({ method, ...window })).toEqual({
        after: 1790995500,
        before: 1790999100,
      })
      expect(getWeightsWindow(chart, { liveRequestBefore: 1791000100.1 })).toEqual({
        after: 1790999201,
        before: 1791000101,
      })
    } finally {
      chart.destroy()
    }
  }
)

test("fresh live charts without a captured clock retain a relative window and correctly encoded baseline", () => {
  const { chart } = makeTestChart({
    attributes: { after: -900, before: 0, fetchStartedAt: 0, renderedAt: null },
  })
  try {
    const window = getWeightsWindow(chart)
    expect(window).toEqual({ after: -900, before: 0 })
    expect(getWeightsBaseline(window)).toEqual({ after: -3600, before: 0 })
  } finally {
    chart.destroy()
  }
})

test.each(["anomaly-rate", "value"])(
  "coarse live %s requests retain their relative window",
  method => {
    const { chart } = makeTestChart({
      attributes: {
        after: -900,
        before: 0,
        fetchStartedAt: 1791000000000,
        viewUpdateEvery: 3600,
        method,
      },
    })
    try {
      const window = getWeightsWindow(chart)
      expect(window).toEqual({ after: -900, before: 0 })
      expect(
        getWeightsBaseline({ method, ...window, baselineAfter: -1800, baselineBefore: -900 })
      ).toEqual({
        after: -1800,
        before: -900,
      })
    } finally {
      chart.destroy()
    }
  }
)
