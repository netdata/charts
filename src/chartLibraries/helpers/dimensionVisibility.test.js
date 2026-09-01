import { isVisibleDimension } from "./dimensionVisibility"

const makeChart = (selection, visible) => ({
  getAttribute: () => selection,
  isDimensionVisible: id => visible.includes(id),
})

describe("isVisibleDimension", () => {
  it("treats every dimension as visible while no legend selection exists", () => {
    expect(isVisibleDimension(makeChart([], []), "a")).toBe(true)
  })

  it("defers to the chart once a legend selection exists", () => {
    const chart = makeChart(["b"], ["b"])

    expect(isVisibleDimension(chart, "a")).toBe(false)
    expect(isVisibleDimension(chart, "b")).toBe(true)
  })

  it("treats a missing selection attribute as no selection", () => {
    expect(isVisibleDimension(makeChart(undefined, []), "a")).toBe(true)
  })
})
