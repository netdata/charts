import { makeTestChart } from "@jest/testUtilities"
import { applyHighlightOpacity } from "./highlightOpacity"

test.each([
  [0.25, 0.125],
  [-1, 0],
  [2, 0.5],
  [NaN, 0.5],
  ["0.25", 0.5],
  [undefined, 0.5],
])("highlight opacity %s multiplies the current canvas alpha into %s", (value, expected) => {
  const { chart } = makeTestChart({ attributes: { highlightOpacity: value } })
  const ctx = document.createElement("canvas").getContext("2d")
  ctx.globalAlpha = 0.5
  applyHighlightOpacity(ctx, chart)
  expect(ctx.globalAlpha).toBe(expected)
  chart.destroy()
})
