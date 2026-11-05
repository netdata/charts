import { hierarchy, treemap, treemapSquarify } from "d3"
import { findGroup } from "./tree"

export const headerHeight = 20

const fitCell = 28
const fitMin = 150
const fitMax = 600

export const fitHeight = ({ boxes, groups, width }) => {
  if (!(width > 0) || !boxes) return fitMin
  const columns = Math.max(1, Math.floor(width / fitCell))
  const natural = Math.ceil(boxes / columns) * fitCell + groups * headerHeight
  return Math.min(fitMax, Math.max(fitMin, natural))
}

const toRect = node => ({
  id: node.data.id,
  name: node.data.name,
  path: node.data.path,
  x0: node.x0,
  y0: node.y0,
  x1: node.x1,
  y1: node.y1,
})

export const layoutTreemap = (root, focusPath, { width, height }) => {
  const focus = findGroup(root, focusPath) || root
  if (!(width > 0) || !(height > 0)) return { focus, groups: [], leaves: [] }

  const nodes = hierarchy(focus, data => (data.leaf ? null : data.children)).count()

  treemap()
    .size([width, height])
    .tile(treemapSquarify.ratio(1))
    .paddingOuter(2)
    .paddingTop(node => (node.depth === 0 ? 2 : headerHeight))
    .paddingInner(node => (node.children?.some(child => child.children) ? 6 : 2))
    .round(true)(nodes)

  return {
    focus,
    groups: nodes
      .descendants()
      .filter(node => node.depth > 0 && node.children)
      .map(node => ({ ...toRect(node), count: node.value })),
    leaves: nodes.leaves().map(node => ({ ...toRect(node), parentId: node.parent?.data.id })),
  }
}

const inside = (rect, x, y, bottom = rect.y1) =>
  x >= rect.x0 && x < rect.x1 && y >= rect.y0 && y < bottom

export const hitTest = (layout, x, y) => {
  const leaf = layout.leaves.find(rect => inside(rect, x, y))
  if (leaf) return { type: "leaf", item: leaf }

  const header = [...layout.groups]
    .reverse()
    .find(rect => inside(rect, x, y, rect.y0 + headerHeight))
  return header ? { type: "header", item: header } : null
}
