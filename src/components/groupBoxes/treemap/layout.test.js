import { buildBoxTree } from "./tree"
import { headerHeight, layoutTreemap, hitTest, fitHeight } from "./layout"

const root = buildBoxTree(["mon,a", "mon,b", "mon,c", "infra,d"], ["label:ns", "label:pod"], {})

describe("treemap layout", () => {
  it("places every box inside the size and every group has a header", () => {
    const layout = layoutTreemap(root, [], { width: 400, height: 200 })

    expect(layout.focus).toBe(root)
    expect(layout.groups.map(group => group.name)).toEqual(["mon", "infra"])
    expect(layout.leaves).toHaveLength(4)
    layout.leaves.forEach(leaf => {
      expect(leaf.x0).toBeGreaterThanOrEqual(0)
      expect(leaf.y0).toBeGreaterThanOrEqual(0)
      expect(leaf.x1).toBeLessThanOrEqual(400)
      expect(leaf.y1).toBeLessThanOrEqual(200)
    })
    layout.groups.forEach(group => {
      const boxes = layout.leaves.filter(leaf => leaf.parentId === group.id)
      boxes.forEach(leaf => expect(leaf.y0).toBeGreaterThanOrEqual(group.y0 + headerHeight))
    })
  })

  it("keeps the payload order of boxes inside a group", () => {
    const layout = layoutTreemap(root, ["mon"], { width: 400, height: 200 })
    expect(layout.leaves.map(leaf => leaf.id)).toEqual(["mon,a", "mon,b", "mon,c"])
  })

  it("zooms into the focused group", () => {
    const layout = layoutTreemap(root, ["mon"], { width: 400, height: 200 })
    expect(layout.focus.name).toBe("mon")
    expect(layout.groups).toEqual([])
    expect(layout.leaves.map(leaf => leaf.id)).toEqual(["mon,a", "mon,b", "mon,c"])
  })

  it("falls back to the root when the focus path is gone", () => {
    const layout = layoutTreemap(root, ["gone"], { width: 400, height: 200 })
    expect(layout.focus).toBe(root)
    expect(layout.leaves).toHaveLength(4)
  })

  it("returns an empty layout for a zero size", () => {
    expect(layoutTreemap(root, [], { width: 0, height: 200 })).toEqual({
      focus: root,
      groups: [],
      leaves: [],
    })
  })

  it("hits boxes and group headers", () => {
    const layout = layoutTreemap(root, [], { width: 400, height: 200 })
    const [leaf] = layout.leaves
    const [group] = layout.groups

    expect(hitTest(layout, leaf.x0 + 1, leaf.y0 + 1)).toEqual({ type: "leaf", item: leaf })
    expect(hitTest(layout, group.x0 + 4, group.y0 + 4)).toEqual({ type: "header", item: group })
    expect(hitTest(layout, -5, -5)).toBeNull()
  })

  it("fits the height to the box count between 150 and 600 pixels", () => {
    expect(fitHeight({ boxes: 0, groups: 0, width: 500 })).toBe(150)
    expect(fitHeight({ boxes: 66, groups: 4, width: 500 })).toBe(192)
    expect(fitHeight({ boxes: 5000, groups: 10, width: 500 })).toBe(600)
    expect(fitHeight({ boxes: 66, groups: 4, width: 0 })).toBe(150)
  })
})
