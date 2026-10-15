import { getCorrelationBaseline, getWeightsBaseline } from "./correlationBaseline"

test.each([
  [3599, 4],
  [3600, 2],
  [21599, 2],
  [21600, 1],
  [86400, 1],
])("uses %s seconds to select a %s× baseline", (duration, multiplier) => {
  expect(getCorrelationBaseline({ after: 100000, before: 100000 + duration })).toEqual({
    after: 100000 - duration * multiplier,
    before: 100000,
    multiplier,
  })
})

test("chooses the policy after normalizing backend seconds", () => {
  expect(getCorrelationBaseline({ after: 100000.9, before: 103600.1 }).multiplier).toBe(2)
})

test.each(["volume", "ks2", undefined])("applies the policy to %s weights", method => {
  expect(
    getWeightsBaseline({
      method,
      after: 100000,
      before: 103600,
      baselineAfter: 1,
      baselineBefore: 2,
    })
  ).toEqual({ after: 92800, before: 100000 })
})

test.each(["anomaly-rate", "value"])("preserves %s baselines", method => {
  expect(
    getWeightsBaseline({
      method,
      after: 100000,
      before: 103600,
      baselineAfter: 1.5,
      baselineBefore: 2.5,
    })
  ).toEqual({ after: 1, before: 2 })
})
