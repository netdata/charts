import { makeTestChart } from "@jest/testUtilities"
import initialAttributes from "@/sdk/initialAttributes"
import { formatReadout } from "@/components/modern/format"
import { makePayload } from "../../fixtures/makeWavePayload"
import {
  valueFocusOptions,
  getSupportedValueFocus,
  getDefaultValueFocus,
  resolveValueFocus,
  getWindowDelta,
  formatSignedDelta,
  formatWindowDuration,
  getWindowSeconds,
  describeWindowChange,
  isPercentUnit,
  isWindowActive,
} from "./valueFocus"

const loadChart = async (values, unit = "requests/s") => {
  const { chart } = makeTestChart({ attributes: { designFlavour: "modern", locale: "en-US" } })
  chart.doneFetch(
    makePayload({
      context: "modern.requests",
      title: "Requests",
      unit,
      dimensions: [{ id: "requests", values }],
    })
  )
  await new Promise(resolve => setTimeout(resolve, 0))
  return chart
}

const flat = value => Array(97).fill(value)

describe("valueFocus attribute", () => {
  it("defaults to null so the chart default applies and a parent can set it", () => {
    expect(initialAttributes).toHaveProperty("valueFocus", null)
  })

  it("has a null root default", () => {
    expect(initialAttributes).toHaveProperty("valueFocusDefault", null)
  })
})

describe("valueFocusOptions", () => {
  it("lists the three modes with their questions", () => {
    expect(valueFocusOptions).toEqual([
      { value: "totals", label: "Totals", question: "which has the most?" },
      { value: "changes", label: "Changes", question: "did anything just change?" },
      { value: "trends", label: "Trends", question: "both, and the shape" },
    ])
  })
})

describe("getSupportedValueFocus", () => {
  it.each(["number", "gauge", "table"])("supports all three modes on %s", chartType =>
    expect(getSupportedValueFocus(chartType)).toEqual(["totals", "changes", "trends"])
  )

  it.each(["dygraph", "uplot", "bars", "easypie", undefined])("supports nothing on %s", chartType =>
    expect(getSupportedValueFocus(chartType)).toEqual([])
  )
})

describe("getDefaultValueFocus", () => {
  it.each(["number", "gauge", "table"])("keeps today's look on %s with trends", chartType =>
    expect(getDefaultValueFocus(chartType)).toBe("trends")
  )

  it("has no default without support", () => expect(getDefaultValueFocus("dygraph")).toBeNull())
})

describe("resolveValueFocus", () => {
  it("uses the chart default when nothing is requested", () => {
    expect(resolveValueFocus("number", null)).toBe("trends")
    expect(resolveValueFocus("table", undefined)).toBe("trends")
  })

  it.each(["totals", "changes", "trends"])("keeps a supported request %s", mode =>
    expect(resolveValueFocus("gauge", mode)).toBe(mode)
  )

  it("ignores an unknown request", () =>
    expect(resolveValueFocus("number", "share")).toBe("trends"))

  it("resolves to null where focus does not apply", () => {
    expect(resolveValueFocus("dygraph", "trends")).toBeNull()
    expect(resolveValueFocus("uplot", null)).toBeNull()
  })

  it("uses the inherited default when the chart has no own focus", () => {
    expect(resolveValueFocus("number", null, { inherited: "totals" })).toBe("totals")
    expect(resolveValueFocus("table", undefined, { inherited: "changes" })).toBe("changes")
  })

  it("prefers the chart's own focus over the inherited default", () =>
    expect(resolveValueFocus("number", "changes", { inherited: "totals" })).toBe("changes"))

  it("ignores an unknown inherited default", () =>
    expect(resolveValueFocus("gauge", null, { inherited: "share" })).toBe("trends"))

  it("applies the fallback to the inherited default", () =>
    expect(
      resolveValueFocus("pie", null, {
        inherited: "trends",
        support: { pie: ["totals", "changes"] },
      })
    ).toBe("changes"))

  it("falls back trends to changes to totals", () => {
    const support = { pie: ["totals", "changes"], ring: ["totals"] }

    expect(resolveValueFocus("pie", "trends", { support })).toBe("changes")
    expect(resolveValueFocus("ring", "trends", { support })).toBe("totals")
    expect(resolveValueFocus("ring", "changes", { support })).toBe("totals")
  })

  it("never climbs above the request when falling back", () => {
    expect(resolveValueFocus("only", "totals", { support: { only: ["changes", "trends"] } })).toBe(
      "changes"
    )
  })
})

describe("getWindowDelta", () => {
  it("is the last value minus the first", () =>
    expect(getWindowDelta([40, 42, 44, 46, 48])).toEqual({ from: 40, to: 48, delta: 8 }))

  it("is the shown value minus the first when an index is given", () =>
    expect(getWindowDelta([40, 40, 40, 44, 48, 52, 56], { index: 4 })).toEqual({
      from: 40,
      to: 48,
      delta: 8,
    }))

  it("skips gaps at both ends", () =>
    expect(getWindowDelta([null, 40, 40, 40, 48, 48, 48, null])).toEqual({
      from: 40,
      to: 48,
      delta: 8,
    }))

  it("uses the compare reference instead of the window start", () =>
    expect(getWindowDelta([50, 50, 50, 50], { compare: 40 })).toEqual({
      from: 40,
      to: 50,
      delta: 10,
    }))

  it("returns null when a hovered early point sits within the noise of the compare reference", () =>
    expect(
      getWindowDelta([100, 105, 110, 115, 120, 125, 130], { index: 0, compare: 100.5 })
    ).toBeNull())

  it("returns null for a flat window", () => expect(getWindowDelta([5, 5, 5, 5, 5])).toBeNull())

  it("returns null when the change is under 1% of the window maximum", () =>
    expect(getWindowDelta([1000, 1000, 1000, 1009, 1009, 1009])).toBeNull())

  it("reports a change of 1% of the window maximum", () =>
    expect(getWindowDelta([990, 990, 990, 1000, 1000, 1000])).toEqual({
      from: 990,
      to: 1000,
      delta: 10,
    }))

  it("averages the first and last three points so a lone spike is noise", () =>
    expect(getWindowDelta([100, 100, 100, 100, 100, 100, 100, 102])).toBeNull())

  it("judges the noise on the edge means, not the single points", () =>
    expect(getWindowDelta([100, 103, 103, 103, 103, 103, 103, 100])).toBeNull())

  it("returns null without two numbers", () => {
    expect(getWindowDelta([])).toBeNull()
    expect(getWindowDelta([7])).toBeNull()
    expect(getWindowDelta([null, null])).toBeNull()
    expect(getWindowDelta()).toBeNull()
  })

  it("returns null when the shown point is a gap", () =>
    expect(getWindowDelta([40, 48, null], { index: 2 })).toBeNull())

  it("reports decreases with a negative delta", () =>
    expect(getWindowDelta([64, 64, 64, 62, 62, 62])).toEqual({ from: 64, to: 62, delta: -2 }))

  it("treats an all-zero window as unchanged", () => expect(getWindowDelta([0, 0, 0])).toBeNull())

  it("compares the endpoints of a two-point window", () =>
    expect(getWindowDelta([40, 80])).toEqual({ from: 40, to: 80, delta: 40 }))

  it("compares the outer points of a three-point window", () =>
    expect(getWindowDelta([40, 60, 80])).toEqual({ from: 40, to: 80, delta: 40 }))

  it("keeps the edges of a short window apart", () =>
    expect(getWindowDelta([100, 100, 100, 101.25, 101.25])).toEqual({
      from: 100,
      to: 101.25,
      delta: 1.25,
    }))
})

describe("isWindowActive", () => {
  it("sees a spike that returns to where it started", () =>
    expect(
      isWindowActive([...Array(30).fill(40), ...Array(37).fill(90), ...Array(30).fill(40)])
    ).toBe(true))

  it("sees a steady change", () => expect(isWindowActive([40, 42, 44, 46, 48])).toBe(true))

  it("is quiet on a flat window", () => expect(isWindowActive([5, 5, 5, 5, 5])).toBe(false))

  it("is quiet when the spread is under 1% of the window maximum", () =>
    expect(isWindowActive([1000, 1009, 1000, 1009])).toBe(false))

  it("is quiet without two numbers", () => {
    expect(isWindowActive([7, null])).toBe(false)
    expect(isWindowActive([0, 0, 0])).toBe(false)
    expect(isWindowActive()).toBe(false)
  })
})

describe("isPercentUnit", () => {
  it("detects percentages through their aliases", () => {
    expect(isPercentUnit("%")).toBe(true)
    expect(isPercentUnit("percentage")).toBe(true)
    expect(isPercentUnit("KiB/s")).toBe(false)
    expect(isPercentUnit(undefined)).toBe(false)
  })
})

describe("formatSignedDelta", () => {
  it("signs an increase with + through the chart readout", async () => {
    const chart = await loadChart(flat(40))

    expect(formatSignedDelta(chart, 8, { dimensionId: "requests" })).toBe(
      `+${formatReadout(chart, 8, { dimensionId: "requests" })}`
    )
  })

  it("signs a decrease with the minus sign U+2212", async () => {
    const chart = await loadChart(flat(40))

    expect(formatSignedDelta(chart, -2, { dimensionId: "requests" })).toBe(
      `−${formatReadout(chart, 2, { dimensionId: "requests" })}`
    )
  })

  it("appends the percent sign on percentage units", async () => {
    const chart = await loadChart(flat(40))

    expect(formatSignedDelta(chart, 23.2, { dimensionId: "requests", unit: "%" })).toBe(
      `+${formatReadout(chart, 23.2, { dimensionId: "requests" })}%`
    )
  })

  it("signs an increase written in locale digits", async () => {
    const chart = await loadChart(flat(40))
    chart.updateAttribute("locale", "ar-EG")
    const text = formatReadout(chart, 8, { dimensionId: "requests" })

    expect(text).not.toMatch(/[0-9]/)
    expect(formatSignedDelta(chart, 8, { dimensionId: "requests" })).toBe(`+${text}`)
  })

  it("returns null when the change rounds to zero in locale digits", async () => {
    const chart = await loadChart(flat(40))
    chart.updateAttribute("locale", "ar-EG")
    chart.updateAttribute("staticFractionDigits", 0)

    expect(formatSignedDelta(chart, 0.2, { dimensionId: "requests" })).toBeNull()
  })

  it("signs a change that only shows at the sixth decimal", async () => {
    const chart = await loadChart(flat(40))
    chart.updateAttribute("staticFractionDigits", 6)
    const text = formatReadout(chart, 0.0000005, { dimensionId: "requests" })

    expect(text).toBe("0.000001")
    expect(formatSignedDelta(chart, 0.0000005, { dimensionId: "requests" })).toBe(`+${text}`)
  })

  it("returns null when a duration change shows as zero seconds", async () => {
    const chart = await loadChart(flat(4000), "s")
    const unitAttributes = chart.getUnitAttributesForValue(4000, { dimensionId: "requests" })

    expect(formatReadout(chart, 0.001, { dimensionId: "requests", unitAttributes })).toBe("0s")
    expect(formatSignedDelta(chart, 0.001, { dimensionId: "requests", unitAttributes })).toBeNull()
  })

  it("signs a duration change that shows as a non-zero duration", async () => {
    const chart = await loadChart(flat(4000), "s")
    const unitAttributes = chart.getUnitAttributesForValue(4000, { dimensionId: "requests" })
    const text = formatReadout(chart, 75, { dimensionId: "requests", unitAttributes })

    expect(text).toBe("1m15s")
    expect(formatSignedDelta(chart, 75, { dimensionId: "requests", unitAttributes })).toBe(
      `+${text}`
    )
  })

  it("returns null when the change rounds to zero", async () => {
    const chart = await loadChart(flat(40))
    chart.updateAttribute("staticFractionDigits", 0)

    expect(formatSignedDelta(chart, 0.2, { dimensionId: "requests" })).toBeNull()
    expect(formatSignedDelta(chart, 0, { dimensionId: "requests" })).toBeNull()
    expect(formatSignedDelta(chart, null, { dimensionId: "requests" })).toBeNull()
  })
})

describe("formatWindowDuration", () => {
  it.each([
    [0, ""],
    [undefined, ""],
    [45, "45 s"],
    [60, "1 min"],
    [900, "15 min"],
    [899, "15 min"],
    [3600, "1 h"],
    [5400, "2 h"],
    [86400, "1 d"],
    [7 * 86400, "7 d"],
  ])("formats %p seconds as %p", (seconds, text) =>
    expect(formatWindowDuration(seconds)).toBe(text)
  )
})

describe("getWindowSeconds", () => {
  it("measures the window from the payload points", async () => {
    const chart = await loadChart(flat(40))

    expect(getWindowSeconds(chart)).toBe(97 * 5)
  })

  it("is zero without data", () => {
    const { chart } = makeTestChart()
    expect(getWindowSeconds(chart)).toBe(0)
  })
})

describe("describeWindowChange", () => {
  const rising = [...Array(50).fill(40), ...Array(47).fill(48)]

  it("describes a change across the window", async () => {
    const chart = await loadChart(rising)
    const delta = formatSignedDelta(chart, 8, { dimensionId: "requests" })
    const from = formatReadout(chart, 40, { dimensionId: "requests" })
    const to = formatReadout(chart, 48, { dimensionId: "requests" })

    expect(describeWindowChange(chart, rising, { dimensionId: "requests" })).toEqual({
      moved: true,
      varied: true,
      direction: "up",
      delta,
      from,
      to,
      window: "8 min",
      text: `${delta} in 8 min`,
      detail: `${from} → ${to}, ${delta} in 8 min`,
      label: `Up ${delta.slice(1)} in 8 min, from ${from} to ${to}`,
    })
  })

  it("scans an unchanged series once however often the hover index moves", async () => {
    const chart = await loadChart(rising)
    let reads = 0
    const series = new Proxy([...rising], {
      get: (target, key, receiver) => {
        if (typeof key === "string" && /^\d+$/.test(key)) reads++
        return Reflect.get(target, key, receiver)
      },
    })
    const describeAt = index =>
      describeWindowChange(chart, series, { dimensionId: "requests", index })

    describeAt(10)
    const firstReads = reads
    reads = 0
    ;[20, 30, 40, 50, 60].forEach(describeAt)

    expect(firstReads).toBeGreaterThan(rising.length)
    expect(reads).toBeLessThan(rising.length)
  })

  it("names a decrease in its label", async () => {
    const falling = [...Array(50).fill(64), ...Array(47).fill(62)]
    const chart = await loadChart(falling)
    const size = formatReadout(chart, 2, { dimensionId: "requests" })

    expect(describeWindowChange(chart, falling, { dimensionId: "requests" })).toMatchObject({
      direction: "down",
      label: `Down ${size} in 8 min, from ${formatReadout(chart, 64, {
        dimensionId: "requests",
      })} to ${formatReadout(chart, 62, { dimensionId: "requests" })}`,
    })
  })

  it("says there was no change on a flat window", async () => {
    const chart = await loadChart(flat(48))
    const to = formatReadout(chart, 48, { dimensionId: "requests" })

    expect(describeWindowChange(chart, flat(48), { dimensionId: "requests" })).toEqual({
      moved: false,
      varied: false,
      direction: null,
      delta: null,
      from: to,
      to,
      window: "8 min",
      text: "no change in 8 min",
      detail: `${to} → ${to}, no change in 8 min`,
      label: `No change in 8 min, steady at ${to}`,
    })
  })

  it("says there was no change but not steady when the window moved and came back", async () => {
    const spike = [...Array(30).fill(40), ...Array(37).fill(90), ...Array(30).fill(40)]
    const chart = await loadChart(spike)
    const now = formatReadout(chart, 40, { dimensionId: "requests" })

    expect(describeWindowChange(chart, spike, { dimensionId: "requests" })).toMatchObject({
      moved: false,
      varied: true,
      delta: null,
      text: "no change in 8 min",
      label: `No change in 8 min, now at ${now}`,
    })
  })

  it("marks a flat window as not varied", async () => {
    const chart = await loadChart(flat(48))

    expect(describeWindowChange(chart, flat(48), { dimensionId: "requests" })).toHaveProperty(
      "varied",
      false
    )
  })

  it("returns null without values", async () => {
    const chart = await loadChart(flat(48))

    expect(describeWindowChange(chart, [], { dimensionId: "requests" })).toBeNull()
  })
})

describe("describeWindowChange across series shapes and hover positions", () => {
  const series = {
    flat: Array(97).fill(48),
    rising: [...Array(50).fill(40), ...Array(47).fill(48)],
    falling: [...Array(50).fill(64), ...Array(47).fill(62)],
    spike: [...Array(30).fill(40), ...Array(37).fill(90), ...Array(30).fill(40)],
    short: [5, 9],
    single: [5],
    gaps: [
      ...Array(10).fill(null),
      ...Array(40).fill(10),
      ...Array(10).fill(null),
      ...Array(37).fill(30),
    ],
    allnull: Array(97).fill(null),
    negative: [...Array(50).fill(-10), ...Array(47).fill(-30)],
    zeros: Array(97).fill(0),
  }

  const expected = {
    "flat@undefined": [
      false,
      false,
      null,
      null,
      "48",
      "48",
      "8 min",
      "48 → 48, no change in 8 min",
      "No change in 8 min, steady at 48",
    ],
    "flat@-1": [
      false,
      false,
      null,
      null,
      "48",
      "48",
      "8 min",
      "48 → 48, no change in 8 min",
      "No change in 8 min, steady at 48",
    ],
    "flat@0": [
      false,
      false,
      null,
      null,
      "48",
      "48",
      "8 min",
      "48 → 48, no change in 8 min",
      "No change in 8 min, steady at 48",
    ],
    "flat@1": [
      false,
      false,
      null,
      null,
      "48",
      "48",
      "8 min",
      "48 → 48, no change in 8 min",
      "No change in 8 min, steady at 48",
    ],
    "flat@40": [
      false,
      false,
      null,
      null,
      "48",
      "48",
      "8 min",
      "48 → 48, no change in 8 min",
      "No change in 8 min, steady at 48",
    ],
    "flat@96": [
      false,
      false,
      null,
      null,
      "48",
      "48",
      "8 min",
      "48 → 48, no change in 8 min",
      "No change in 8 min, steady at 48",
    ],
    "flat@200": [
      false,
      false,
      null,
      null,
      "48",
      "48",
      "8 min",
      "48 → 48, no change in 8 min",
      "No change in 8 min, steady at 48",
    ],
    "flat+compare": [
      true,
      true,
      "up",
      "+28",
      "20",
      "48",
      "8 min",
      "20 → 48, +28 in 8 min",
      "Up 28 in 8 min, from 20 to 48",
    ],
    "rising@undefined": [
      true,
      true,
      "up",
      "+8",
      "40",
      "48",
      "8 min",
      "40 → 48, +8 in 8 min",
      "Up 8 in 8 min, from 40 to 48",
    ],
    "rising@-1": [
      true,
      true,
      "up",
      "+8",
      "40",
      "48",
      "8 min",
      "40 → 48, +8 in 8 min",
      "Up 8 in 8 min, from 40 to 48",
    ],
    "rising@0": [
      false,
      true,
      null,
      null,
      "40",
      "40",
      "8 min",
      "40 → 40, no change in 8 min",
      "No change in 8 min, now at 40",
    ],
    "rising@1": [
      false,
      true,
      null,
      null,
      "40",
      "40",
      "8 min",
      "40 → 40, no change in 8 min",
      "No change in 8 min, now at 40",
    ],
    "rising@40": [
      false,
      true,
      null,
      null,
      "40",
      "40",
      "8 min",
      "40 → 40, no change in 8 min",
      "No change in 8 min, now at 40",
    ],
    "rising@96": [
      true,
      true,
      "up",
      "+8",
      "40",
      "48",
      "8 min",
      "40 → 48, +8 in 8 min",
      "Up 8 in 8 min, from 40 to 48",
    ],
    "rising@200": [
      true,
      true,
      "up",
      "+8",
      "40",
      "48",
      "8 min",
      "40 → 48, +8 in 8 min",
      "Up 8 in 8 min, from 40 to 48",
    ],
    "rising+compare": [
      true,
      true,
      "up",
      "+28",
      "20",
      "48",
      "8 min",
      "20 → 48, +28 in 8 min",
      "Up 28 in 8 min, from 20 to 48",
    ],
    "falling@undefined": [
      true,
      true,
      "down",
      "−2",
      "64",
      "62",
      "8 min",
      "64 → 62, −2 in 8 min",
      "Down 2 in 8 min, from 64 to 62",
    ],
    "falling@-1": [
      true,
      true,
      "down",
      "−2",
      "64",
      "62",
      "8 min",
      "64 → 62, −2 in 8 min",
      "Down 2 in 8 min, from 64 to 62",
    ],
    "falling@0": [
      false,
      true,
      null,
      null,
      "64",
      "64",
      "8 min",
      "64 → 64, no change in 8 min",
      "No change in 8 min, now at 64",
    ],
    "falling@1": [
      false,
      true,
      null,
      null,
      "64",
      "64",
      "8 min",
      "64 → 64, no change in 8 min",
      "No change in 8 min, now at 64",
    ],
    "falling@40": [
      false,
      true,
      null,
      null,
      "64",
      "64",
      "8 min",
      "64 → 64, no change in 8 min",
      "No change in 8 min, now at 64",
    ],
    "falling@96": [
      true,
      true,
      "down",
      "−2",
      "64",
      "62",
      "8 min",
      "64 → 62, −2 in 8 min",
      "Down 2 in 8 min, from 64 to 62",
    ],
    "falling@200": [
      true,
      true,
      "down",
      "−2",
      "64",
      "62",
      "8 min",
      "64 → 62, −2 in 8 min",
      "Down 2 in 8 min, from 64 to 62",
    ],
    "falling+compare": [
      true,
      true,
      "up",
      "+42",
      "20",
      "62",
      "8 min",
      "20 → 62, +42 in 8 min",
      "Up 42 in 8 min, from 20 to 62",
    ],
    "spike@undefined": [
      false,
      true,
      null,
      null,
      "40",
      "40",
      "8 min",
      "40 → 40, no change in 8 min",
      "No change in 8 min, now at 40",
    ],
    "spike@-1": [
      false,
      true,
      null,
      null,
      "40",
      "40",
      "8 min",
      "40 → 40, no change in 8 min",
      "No change in 8 min, now at 40",
    ],
    "spike@0": [
      false,
      true,
      null,
      null,
      "40",
      "40",
      "8 min",
      "40 → 40, no change in 8 min",
      "No change in 8 min, now at 40",
    ],
    "spike@1": [
      false,
      true,
      null,
      null,
      "40",
      "40",
      "8 min",
      "40 → 40, no change in 8 min",
      "No change in 8 min, now at 40",
    ],
    "spike@40": [
      true,
      true,
      "up",
      "+50",
      "40",
      "90",
      "8 min",
      "40 → 90, +50 in 8 min",
      "Up 50 in 8 min, from 40 to 90",
    ],
    "spike@96": [
      false,
      true,
      null,
      null,
      "40",
      "40",
      "8 min",
      "40 → 40, no change in 8 min",
      "No change in 8 min, now at 40",
    ],
    "spike@200": [
      false,
      true,
      null,
      null,
      "40",
      "40",
      "8 min",
      "40 → 40, no change in 8 min",
      "No change in 8 min, now at 40",
    ],
    "spike+compare": [
      true,
      true,
      "up",
      "+20",
      "20",
      "40",
      "8 min",
      "20 → 40, +20 in 8 min",
      "Up 20 in 8 min, from 20 to 40",
    ],
    "short@undefined": [
      true,
      true,
      "up",
      "+4",
      "5",
      "9",
      "8 min",
      "5 → 9, +4 in 8 min",
      "Up 4 in 8 min, from 5 to 9",
    ],
    "short@-1": [
      true,
      true,
      "up",
      "+4",
      "5",
      "9",
      "8 min",
      "5 → 9, +4 in 8 min",
      "Up 4 in 8 min, from 5 to 9",
    ],
    "short@0": [
      false,
      true,
      null,
      null,
      "5",
      "5",
      "8 min",
      "5 → 5, no change in 8 min",
      "No change in 8 min, now at 5",
    ],
    "short@1": [
      true,
      true,
      "up",
      "+4",
      "5",
      "9",
      "8 min",
      "5 → 9, +4 in 8 min",
      "Up 4 in 8 min, from 5 to 9",
    ],
    "short@40": [
      false,
      true,
      null,
      null,
      "9",
      "9",
      "8 min",
      "9 → 9, no change in 8 min",
      "No change in 8 min, now at 9",
    ],
    "short@96": [
      false,
      true,
      null,
      null,
      "9",
      "9",
      "8 min",
      "9 → 9, no change in 8 min",
      "No change in 8 min, now at 9",
    ],
    "short@200": [
      true,
      true,
      "up",
      "+4",
      "5",
      "9",
      "8 min",
      "5 → 9, +4 in 8 min",
      "Up 4 in 8 min, from 5 to 9",
    ],
    "short+compare": [
      true,
      true,
      "down",
      "−11",
      "20",
      "9",
      "8 min",
      "20 → 9, −11 in 8 min",
      "Down 11 in 8 min, from 20 to 9",
    ],
    "single@undefined": [
      false,
      false,
      null,
      null,
      "5",
      "5",
      "8 min",
      "5 → 5, no change in 8 min",
      "No change in 8 min, steady at 5",
    ],
    "single@-1": [
      false,
      false,
      null,
      null,
      "5",
      "5",
      "8 min",
      "5 → 5, no change in 8 min",
      "No change in 8 min, steady at 5",
    ],
    "single@0": [
      false,
      false,
      null,
      null,
      "5",
      "5",
      "8 min",
      "5 → 5, no change in 8 min",
      "No change in 8 min, steady at 5",
    ],
    "single@1": [
      false,
      false,
      null,
      null,
      "5",
      "5",
      "8 min",
      "5 → 5, no change in 8 min",
      "No change in 8 min, steady at 5",
    ],
    "single@40": [
      false,
      false,
      null,
      null,
      "5",
      "5",
      "8 min",
      "5 → 5, no change in 8 min",
      "No change in 8 min, steady at 5",
    ],
    "single@96": [
      false,
      false,
      null,
      null,
      "5",
      "5",
      "8 min",
      "5 → 5, no change in 8 min",
      "No change in 8 min, steady at 5",
    ],
    "single@200": [
      false,
      false,
      null,
      null,
      "5",
      "5",
      "8 min",
      "5 → 5, no change in 8 min",
      "No change in 8 min, steady at 5",
    ],
    "single+compare": [
      true,
      true,
      "down",
      "−15",
      "20",
      "5",
      "8 min",
      "20 → 5, −15 in 8 min",
      "Down 15 in 8 min, from 20 to 5",
    ],
    "gaps@undefined": [
      true,
      true,
      "up",
      "+20",
      "10",
      "30",
      "8 min",
      "10 → 30, +20 in 8 min",
      "Up 20 in 8 min, from 10 to 30",
    ],
    "gaps@-1": [
      true,
      true,
      "up",
      "+20",
      "10",
      "30",
      "8 min",
      "10 → 30, +20 in 8 min",
      "Up 20 in 8 min, from 10 to 30",
    ],
    "gaps@0": [
      false,
      true,
      null,
      null,
      "30",
      "30",
      "8 min",
      "30 → 30, no change in 8 min",
      "No change in 8 min, now at 30",
    ],
    "gaps@1": [
      false,
      true,
      null,
      null,
      "30",
      "30",
      "8 min",
      "30 → 30, no change in 8 min",
      "No change in 8 min, now at 30",
    ],
    "gaps@40": [
      false,
      true,
      null,
      null,
      "10",
      "10",
      "8 min",
      "10 → 10, no change in 8 min",
      "No change in 8 min, now at 10",
    ],
    "gaps@96": [
      true,
      true,
      "up",
      "+20",
      "10",
      "30",
      "8 min",
      "10 → 30, +20 in 8 min",
      "Up 20 in 8 min, from 10 to 30",
    ],
    "gaps@200": [
      true,
      true,
      "up",
      "+20",
      "10",
      "30",
      "8 min",
      "10 → 30, +20 in 8 min",
      "Up 20 in 8 min, from 10 to 30",
    ],
    "gaps+compare": [
      true,
      true,
      "up",
      "+10",
      "20",
      "30",
      "8 min",
      "20 → 30, +10 in 8 min",
      "Up 10 in 8 min, from 20 to 30",
    ],
    "allnull@undefined": null,
    "allnull@-1": null,
    "allnull@0": null,
    "allnull@1": null,
    "allnull@40": null,
    "allnull@96": null,
    "allnull@200": null,
    "allnull+compare": null,
    "negative@undefined": [
      true,
      true,
      "down",
      "−20",
      "-10",
      "-30",
      "8 min",
      "-10 → -30, −20 in 8 min",
      "Down 20 in 8 min, from -10 to -30",
    ],
    "negative@-1": [
      true,
      true,
      "down",
      "−20",
      "-10",
      "-30",
      "8 min",
      "-10 → -30, −20 in 8 min",
      "Down 20 in 8 min, from -10 to -30",
    ],
    "negative@0": [
      false,
      true,
      null,
      null,
      "-10",
      "-10",
      "8 min",
      "-10 → -10, no change in 8 min",
      "No change in 8 min, now at -10",
    ],
    "negative@1": [
      false,
      true,
      null,
      null,
      "-10",
      "-10",
      "8 min",
      "-10 → -10, no change in 8 min",
      "No change in 8 min, now at -10",
    ],
    "negative@40": [
      false,
      true,
      null,
      null,
      "-10",
      "-10",
      "8 min",
      "-10 → -10, no change in 8 min",
      "No change in 8 min, now at -10",
    ],
    "negative@96": [
      true,
      true,
      "down",
      "−20",
      "-10",
      "-30",
      "8 min",
      "-10 → -30, −20 in 8 min",
      "Down 20 in 8 min, from -10 to -30",
    ],
    "negative@200": [
      true,
      true,
      "down",
      "−20",
      "-10",
      "-30",
      "8 min",
      "-10 → -30, −20 in 8 min",
      "Down 20 in 8 min, from -10 to -30",
    ],
    "negative+compare": [
      true,
      true,
      "down",
      "−50",
      "20",
      "-30",
      "8 min",
      "20 → -30, −50 in 8 min",
      "Down 50 in 8 min, from 20 to -30",
    ],
    "zeros@undefined": [
      false,
      false,
      null,
      null,
      "0",
      "0",
      "8 min",
      "0 → 0, no change in 8 min",
      "No change in 8 min, steady at 0",
    ],
    "zeros@-1": [
      false,
      false,
      null,
      null,
      "0",
      "0",
      "8 min",
      "0 → 0, no change in 8 min",
      "No change in 8 min, steady at 0",
    ],
    "zeros@0": [
      false,
      false,
      null,
      null,
      "0",
      "0",
      "8 min",
      "0 → 0, no change in 8 min",
      "No change in 8 min, steady at 0",
    ],
    "zeros@1": [
      false,
      false,
      null,
      null,
      "0",
      "0",
      "8 min",
      "0 → 0, no change in 8 min",
      "No change in 8 min, steady at 0",
    ],
    "zeros@40": [
      false,
      false,
      null,
      null,
      "0",
      "0",
      "8 min",
      "0 → 0, no change in 8 min",
      "No change in 8 min, steady at 0",
    ],
    "zeros@96": [
      false,
      false,
      null,
      null,
      "0",
      "0",
      "8 min",
      "0 → 0, no change in 8 min",
      "No change in 8 min, steady at 0",
    ],
    "zeros@200": [
      false,
      false,
      null,
      null,
      "0",
      "0",
      "8 min",
      "0 → 0, no change in 8 min",
      "No change in 8 min, steady at 0",
    ],
    "zeros+compare": [
      true,
      true,
      "down",
      "−20",
      "20",
      "0",
      "8 min",
      "20 → 0, −20 in 8 min",
      "Down 20 in 8 min, from 20 to 0",
    ],
  }

  const summarize = change =>
    change && [
      change.moved,
      change.varied,
      change.direction,
      change.delta,
      change.from,
      change.to,
      change.window,
      change.detail,
      change.label,
    ]

  it("keeps every result identical", async () => {
    const actual = {}
    for (const [name, values] of Object.entries(series)) {
      const chart = await loadChart(values)
      const read = chart
        .getPayload()
        .all.map((_, i) => chart.getDimensionValue("requests", i, { abs: false }))
      for (const index of [undefined, -1, 0, 1, 40, 96, 200]) {
        actual[`${name}@${index}`] = summarize(
          describeWindowChange(chart, read, { dimensionId: "requests", index })
        )
      }
      actual[`${name}+compare`] = summarize(
        describeWindowChange(chart, read, { dimensionId: "requests", compare: 20 })
      )
    }

    expect(actual).toEqual(expected)
  })
})
