import { getConversionAttributes } from "./getConversionUnits"
import { makeTestChart } from "@jest/testUtilities"

// Every unit/scale pair a user can pick from chart Settings -> Display -> Value formatting -> Scale.
// Expected labels are hardcoded on purpose: they must not be derived from the same tables the
// implementation reads, or the assertions would be tautological.
// Compact duration targets expect "" because the formatted value already carries its units ("1h1m40s").
const C = "°C"
const F = "°F"
const NS = "ns"
const US = "µs"
const MS = "ms"
const S = "s"
const NONE = ""

const cases = [
  ["Cel", "[degF]", F],
  ["[degF]", "Cel", C],

  ["ns", "ns", NS],
  ["ns", "us", US],
  ["ns", "ms", MS],
  ["ns", "s", S],

  ["ms", "ns", NS],
  ["ms", "us", US],
  ["ms", "ms", MS],
  ["ms", "s", S],
  ["ms", "a:mo:d", NONE],
  ["ms", "mo:d:h", NONE],
  ["ms", "d:h:mm", NONE],
  ["ms", "h:mm:ss", NONE],
  ["ms", "mm:ss", NONE],

  ["s", "ns", NS],
  ["s", "us", US],
  ["s", "ms", MS],
  ["s", "s", S],
  ["s", "a:mo:d", NONE],
  ["s", "mo:d:h", NONE],
  ["s", "d:h:mm", NONE],
  ["s", "h:mm:ss", NONE],
  ["s", "mm:ss", NONE],
  ["s", "dHH:MM:ss", NONE],

  ["min", "ns", NS],
  ["min", "us", US],
  ["min", "ms", MS],
  ["min", "s", S],
  ["min", "a:mo:d", NONE],
  ["min", "mo:d:h", NONE],
  ["min", "d:h:mm", NONE],
  ["min", "h:mm:ss", NONE],
  ["min", "mm:ss", NONE],
  ["min", "dHH:MM:ss", NONE],

  ["h", "ns", NS],
  ["h", "us", US],
  ["h", "ms", MS],
  ["h", "s", S],
  ["h", "a:mo:d", NONE],
  ["h", "mo:d:h", NONE],
  ["h", "d:h:mm", NONE],
  ["h", "h:mm:ss", NONE],
  ["h", "mm:ss", NONE],
  ["h", "dHH:MM:ss", NONE],

  ["d", "ns", NS],
  ["d", "us", US],
  ["d", "ms", MS],
  ["d", "s", S],
  ["d", "a:mo:d", NONE],
  ["d", "mo:d:h", NONE],
  ["d", "d:h:mm", NONE],
  ["d", "h:mm:ss", NONE],
  ["d", "mm:ss", NONE],
  ["d", "dHH:MM:ss", NONE],

  ["wk", "ns", NS],
  ["wk", "us", US],
  ["wk", "ms", MS],
  ["wk", "s", S],
  ["wk", "a:mo:d", NONE],
  ["wk", "mo:d:h", NONE],
  ["wk", "d:h:mm", NONE],
  ["wk", "h:mm:ss", NONE],
  ["wk", "mm:ss", NONE],
  ["wk", "dHH:MM:ss", NONE],

  ["mo", "ns", NS],
  ["mo", "us", US],
  ["mo", "ms", MS],
  ["mo", "s", S],
  ["mo", "a:mo:d", NONE],
  ["mo", "mo:d:h", NONE],
  ["mo", "d:h:mm", NONE],
  ["mo", "h:mm:ss", NONE],
  ["mo", "mm:ss", NONE],
  ["mo", "dHH:MM:ss", NONE],

  ["a", "ns", NS],
  ["a", "us", US],
  ["a", "ms", MS],
  ["a", "s", S],
  ["a", "a:mo:d", NONE],
  ["a", "mo:d:h", NONE],
  ["a", "d:h:mm", NONE],
  ["a", "h:mm:ss", NONE],
  ["a", "mm:ss", NONE],
  ["a", "dHH:MM:ss", NONE],
]

const getLabel = (sourceUnits, desiredUnits) => {
  const { chart } = makeTestChart({
    attributes: { units: [sourceUnits], desiredUnits: [desiredUnits] },
  })

  const unitAttributes = getConversionAttributes(chart, sourceUnits, { min: 0, max: 1000 })

  return chart.getUnitSign({ unitAttributes })
}

describe("explicit unit selection renders the target unit's label", () => {
  it("covers every selectable pair", () => {
    expect(cases).toHaveLength(85)
  })

  it.each(cases)("%s -> %s shows %p", (sourceUnits, desiredUnits, expected) => {
    expect(getLabel(sourceUnits, desiredUnits)).toBe(expected)
  })
})
