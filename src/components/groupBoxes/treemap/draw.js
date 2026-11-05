import { measureTextWidth } from "@/helpers/canvas"
import { headerHeight } from "./layout"

export const labelFont = "600 11px IBM Plex Sans, sans-serif"
export const countFont = "500 11px IBM Plex Sans Condensed, IBM Plex Sans, sans-serif"
const estimatedCharWidth = 6.4

export const middleTruncate = (text, room) => {
  if (text.length <= room) return text
  if (room < 5) return ""
  const head = Math.ceil((room - 1) / 2)
  const tail = room - 1 - head
  return `${text.slice(0, head)}…${text.slice(text.length - tail)}`
}

const measure = (text, font) => measureTextWidth(text, font) ?? text.length * estimatedCharWidth

export const fitLabel = (text, maxWidth, font) => {
  if (measure(text, font) <= maxWidth) return text
  for (let room = text.length - 1; room >= 5; room--) {
    const candidate = middleTruncate(text, room)
    if (measure(candidate, font) <= maxWidth) return candidate
  }
  return ""
}

export const sizeCanvas = (canvas, width, height, ratio = window.devicePixelRatio || 1) => {
  const pixelWidth = Math.round(width * ratio)
  const pixelHeight = Math.round(height * ratio)
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
  }
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const ctx = canvas.getContext("2d")
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  return ctx
}

export const makePalette = chart => ({
  frame: chart.getThemeAttribute("themeGridColor"),
  label: chart.getThemeAttribute("themeLabelColor"),
  muted: chart.getThemeAttribute("themeAxisLabelColor"),
  hot: chart.getThemeAttribute("themeErrorBackground"),
  active: chart.getThemeAttribute("themeLabelColor"),
})

const roundedBox = (ctx, x, y, width, height, radius) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const drawGroup = (ctx, group, { palette, hotGroup }) => {
  const width = group.x1 - group.x0
  const height = group.y1 - group.y0
  if (width <= 1 || height <= 1) return

  ctx.beginPath()
  ctx.lineWidth = 1
  ctx.strokeStyle = palette.frame
  roundedBox(ctx, group.x0 + 0.5, group.y0 + 0.5, width - 1, height - 1, 4)
  ctx.stroke()

  if (height < headerHeight + 2) return

  const count = String(group.count)
  const countWidth = measure(count, countFont)
  const label = fitLabel(group.name, width - countWidth - 20, labelFont)
  const baseline = group.y0 + 14

  ctx.textBaseline = "alphabetic"
  if (label) {
    ctx.font = labelFont
    ctx.textAlign = "left"
    ctx.fillStyle = palette.label
    ctx.fillText(label, group.x0 + 6, baseline)
  }
  if (width > countWidth + 16) {
    ctx.font = countFont
    ctx.textAlign = "right"
    ctx.fillStyle = hotGroup(group.id) ? palette.hot : palette.muted
    ctx.fillText(count, group.x1 - 6, baseline)
  }
}

const drawLeaf = (ctx, leaf, colorOf) => {
  const width = leaf.x1 - leaf.x0
  const height = leaf.y1 - leaf.y0
  if (width <= 0 || height <= 0) return
  ctx.beginPath()
  ctx.fillStyle = colorOf(leaf.id)
  roundedBox(ctx, leaf.x0, leaf.y0, width, height, 2)
  ctx.fill()
}

const drawActive = (ctx, leaf, palette) => {
  const width = leaf.x1 - leaf.x0
  const height = leaf.y1 - leaf.y0
  ctx.beginPath()
  ctx.lineWidth = 1.5
  ctx.strokeStyle = palette.active
  roundedBox(ctx, leaf.x0 + 0.75, leaf.y0 + 0.75, width - 1.5, height - 1.5, 2)
  ctx.stroke()
}

export const drawTreemap = (
  ctx,
  layout,
  { width, height, palette, colorOf, hotGroup, activeId }
) => {
  ctx.clearRect(0, 0, width, height)
  layout.groups.forEach(group => drawGroup(ctx, group, { palette, hotGroup }))
  layout.leaves.forEach(leaf => drawLeaf(ctx, leaf, colorOf))
  const active = activeId && layout.leaves.find(leaf => leaf.id === activeId)
  if (active) drawActive(ctx, active, palette)
}

const lerp = (from, to, t) => from + (to - from) * t

const blend = (previous, next, t) =>
  next.map(rect => {
    const start = previous.get(rect.id) || rect
    return {
      ...rect,
      x0: lerp(start.x0, rect.x0, t),
      y0: lerp(start.y0, rect.y0, t),
      x1: lerp(start.x1, rect.x1, t),
      y1: lerp(start.y1, rect.y1, t),
    }
  })

export const interpolateLayout = (from, to, t) => ({
  ...to,
  groups: blend(new Map(from.groups.map(rect => [rect.id, rect])), to.groups, t),
  leaves: blend(new Map(from.leaves.map(rect => [rect.id, rect])), to.leaves, t),
})

export const shouldAnimateZoom = (previous, next) =>
  !!previous && previous.focus.path.join(",") !== next.focus.path.join(",")

export const getHotGroups = (leaves, valueOf, threshold) => {
  const hot = new Set()
  if (threshold === null || threshold === undefined) return hot

  leaves.forEach(leaf => {
    if (Math.abs(valueOf(leaf.id) ?? 0) < threshold) return
    const parts = leaf.id.split(",")
    for (let depth = 1; depth < parts.length; depth++) hot.add(parts.slice(0, depth).join(","))
  })
  return hot
}

export const animationLimit = 3000

const prefersReducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

export const shouldAnimate = boxCount => boxCount <= animationLimit && !prefersReducedMotion()

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export const animateLayout = ({ from, to, duration = 550, onFrame }) => {
  let frame
  const start = performance.now()
  const step = now => {
    const t = Math.min(1, (now - start) / duration)
    onFrame(interpolateLayout(from, to, ease(t)))
    if (t < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
  return () => cancelAnimationFrame(frame)
}
