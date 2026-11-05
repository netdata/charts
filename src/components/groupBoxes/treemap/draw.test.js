import { makeTestChart } from "@jest/testUtilities"
import { buildBoxTree } from "./tree"
import { layoutTreemap } from "./layout"
import {
  middleTruncate,
  fitLabel,
  sizeCanvas,
  makePalette,
  drawTreemap,
  interpolateLayout,
  shouldAnimate,
  shouldAnimateZoom,
  getHotGroups,
  animationLimit,
} from "./draw"

const root = buildBoxTree(["mon,a", "mon,b", "infra,c"], ["label:ns", "label:pod"], {})

describe("treemap drawing", () => {
  it("truncates in the middle and hides labels with no room", () => {
    expect(middleTruncate("ip-10-200-158-30", 9)).toBe("ip-1…8-30")
    expect(middleTruncate("short", 9)).toBe("short")
    expect(middleTruncate("ip-10-200-158-30", 4)).toBe("")
  })

  it("fits labels by an estimated width when the canvas cannot measure", () => {
    expect(fitLabel("mon", 200, "11px sans-serif")).toBe("mon")
    expect(fitLabel("ip-10-200-158-30", 20, "11px sans-serif")).toBe("")
  })

  it("sizes the canvas for the device pixel ratio", () => {
    const canvas = document.createElement("canvas")
    sizeCanvas(canvas, 300, 100, 2)
    expect(canvas.width).toBe(600)
    expect(canvas.height).toBe(200)
    expect(canvas.style.width).toBe("300px")
    expect(canvas.style.height).toBe("100px")
  })

  it("draws group frames, labels and one fill per box", () => {
    const { chart } = makeTestChart()
    const palette = makePalette(chart)
    const layout = layoutTreemap(root, [], { width: 400, height: 200 })
    const canvas = document.createElement("canvas")
    const ctx = sizeCanvas(canvas, 400, 200, 1)

    drawTreemap(ctx, layout, {
      width: 400,
      height: 200,
      palette,
      colorOf: () => "#123456",
      hotGroup: id => id === "mon",
      activeId: "mon,a",
    })

    const events = ctx.__getEvents()
    const fills = events.filter(event => event.type === "fill")
    expect(fills).toHaveLength(3)
    const texts = events.filter(event => event.type === "fillText").map(event => event.props.text)
    expect(texts).toEqual(expect.arrayContaining(["mon", "2", "infra", "1"]))
    const styles = events
      .filter(event => event.type === "fillStyle")
      .map(event => event.props.value)
    expect(styles).toContain(palette.hot.toLowerCase())
    expect(events.filter(event => event.type === "stroke").length).toBeGreaterThanOrEqual(3)
  })

  it("interpolates boxes from their previous place", () => {
    const from = layoutTreemap(root, [], { width: 400, height: 200 })
    const to = layoutTreemap(root, ["mon"], { width: 400, height: 200 })
    const start = from.leaves.find(leaf => leaf.id === "mon,a")
    const end = to.leaves.find(leaf => leaf.id === "mon,a")

    const middle = interpolateLayout(from, to, 0.5).leaves.find(leaf => leaf.id === "mon,a")
    expect(middle.x0).toBeCloseTo((start.x0 + end.x0) / 2)
    expect(middle.x1).toBeCloseTo((start.x1 + end.x1) / 2)
    expect(interpolateLayout(from, to, 1).leaves).toEqual(to.leaves)
  })

  it("skips animation for very large box counts", () => {
    expect(shouldAnimate(10)).toBe(true)
    expect(shouldAnimate(animationLimit + 1)).toBe(false)
  })

  it("animates only when the zoom path changes, not when data is refetched", () => {
    const ids = ["mon,a", "mon,b", "infra,c"]
    const grouped = ["label:ns", "label:pod"]
    const before = layoutTreemap(buildBoxTree(ids, grouped, {}), [], { width: 400, height: 200 })
    const refetched = layoutTreemap(buildBoxTree(ids, grouped, {}), [], { width: 400, height: 200 })
    const zoomed = layoutTreemap(buildBoxTree(ids, grouped, {}), ["mon"], {
      width: 400,
      height: 200,
    })

    expect(shouldAnimateZoom(before, refetched)).toBe(false)
    expect(shouldAnimateZoom(before, zoomed)).toBe(true)
    expect(shouldAnimateZoom(null, zoomed)).toBe(false)
  })

  it("marks every ancestor group of a box at or above the threshold as hot", () => {
    const leaves = [{ id: "mon,mg-1,p1" }, { id: "mon,mg-2,p2" }, { id: "infra,mg-1,p3" }]
    const values = { "mon,mg-1,p1": 95, "mon,mg-2,p2": 10, "infra,mg-1,p3": 40 }

    expect([...getHotGroups(leaves, id => values[id], 90)].sort()).toEqual(["mon", "mon,mg-1"])
    expect(getHotGroups(leaves, id => values[id], null).size).toBe(0)
  })
})
