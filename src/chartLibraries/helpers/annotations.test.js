import { makeTestChart } from "@jest/testUtilities"
import { areAnnotationsDisabled } from "./annotations"

test.each([
  [true, false],
  [undefined, false],
  [null, false],
  [0, false],
  [false, true],
])("enabledAnnotations %s disables annotations: %s", (value, disabled) => {
  const { chart } = makeTestChart({ attributes: { enabledAnnotations: value } })
  expect(areAnnotationsDisabled(chart)).toBe(disabled)
  chart.destroy()
})
