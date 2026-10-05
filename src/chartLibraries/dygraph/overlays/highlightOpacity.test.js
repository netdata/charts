import { makeTestChart } from "@jest/testUtilities"
import highlight from "./highlight"

test("secondary highlight dims fill and borders without changing the selection", () => {
  const { chart } = makeTestChart({
    attributes: {
      overlays: { highlight: { type: "highlight", range: [100, 200] } },
      highlightOpacity: 0.25,
    },
  })
  const ctx = document.createElement("canvas").getContext("2d")
  const ui = {
    chart,
    trigger: () => {},
    getDygraph: () => ({
      getArea: () => ({ h: 100 }),
      hidden_ctx_: ctx,
      xAxisRange: () => [100000, 200000],
      toDomXCoord: value => value / 1000,
    }),
  }
  highlight(ui, "highlight")
  expect(
    ctx
      .__getEvents()
      .filter(event => event.type === "globalAlpha")
      .map(event => event.props.value)
  ).toContain(0.25)
  expect(ctx.globalAlpha).toBe(1)
  expect(chart.getAttribute("overlays").highlight.range).toEqual([100, 200])
  chart.destroy()
})
