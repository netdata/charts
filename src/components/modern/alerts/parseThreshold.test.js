import { parseExpression, parseThresholds } from "./parseThreshold"

describe("parseExpression", () => {
  it("reads a fixed comparison", () => {
    expect(parseExpression("$this > 80")).toEqual({ direction: "above", value: 80 })
    expect(parseExpression("$this < (10.5)")).toEqual({ direction: "below", value: 10.5 })
  })

  it("reads the stock hysteresis form, raising at the else branch", () => {
    expect(parseExpression("$this > (($status >= $WARNING) ? (75) : (85))")).toEqual({
      direction: "above",
      value: 85,
      hold: 75,
    })
  })

  it("refuses expressions that depend on other variables", () => {
    expect(parseExpression("$this > $green")).toBeNull()
    expect(parseExpression("$this * 100 / $active_processors > 175")).toBeNull()
    expect(parseExpression(null)).toBeNull()
  })
})

describe("parseThresholds", () => {
  it("combines warning and critical levels", () => {
    expect(parseThresholds({ warn: "$this > 80", crit: "$this > 90" })).toEqual({
      direction: "above",
      warning: 80,
      critical: 90,
    })
  })

  it("keeps a single parsable level", () => {
    expect(parseThresholds({ warn: "$this < 20", crit: "$this < $red" })).toEqual({
      direction: "below",
      warning: 20,
    })
  })

  it("gives up when the levels point in different directions or nothing parses", () => {
    expect(parseThresholds({ warn: "$this > 80", crit: "$this < 5" })).toBeNull()
    expect(parseThresholds({ warn: "$this > $green", crit: "$this > $red" })).toBeNull()
  })
})
