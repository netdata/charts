import { parseColor } from "@/chartLibraries/gpu/color"
import d3pie from "@/chartLibraries/d3pie/library"
import getInitialOptions from "@/chartLibraries/d3pie/getInitialOptions"
import {
  groupD3PieContent,
  makeD3PieContent,
} from "@/chartLibraries/d3pie/data"
import { unregister } from "@/helpers/makeListeners"

const TAU = Math.PI * 2

const shadeColor = (hex, luminosity) => {
  const normalized = String(hex).replace(/[^0-9a-f]/gi, "")
  const value = normalized.length < 6
    ? normalized
        .split("")
        .map(character => character.repeat(2))
        .join("")
    : normalized
  return `#${[0, 1, 2]
    .map(index => {
      const color = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
      const adjusted = Math.round(Math.min(Math.max(0, color + color * luminosity), 255))
      return adjusted.toString(16).padStart(2, "0")
    })
    .join("")}`
}

const getPathOffset = (path, startAngle, dpr) => {
  const transform = path?.transform?.baseVal?.consolidate?.()
  if (!transform) return [0, 0]
  const { e, f } = transform.matrix
  const cosine = Math.cos(startAngle)
  const sine = Math.sin(startAngle)
  return [(e * cosine - f * sine) * dpr, (e * sine + f * cosine) * dpr]
}

export const makeD3PieFrame = (pie, { width, height, dpr }, hoveredIndex = -1) => {
  const content = pie.options.data.content
  const total = content.reduce((sum, { value }) => sum + value, 0)
  let startAngle = 0
  const paths = pie.element.querySelectorAll("path[data-index]")
  const segments = content.map(({ value }, index) => {
    const endAngle = startAngle + (value / total) * TAU
    const color =
      index === hoveredIndex
        ? shadeColor(pie.options.colors[index], pie.options.effects.highlightLuminosity)
        : pie.options.colors[index]
    const [offsetX, offsetY] = getPathOffset(paths[index], startAngle, dpr)
    const segment = {
      startAngle,
      endAngle,
      offsetX,
      offsetY,
      color: parseColor(color),
    }
    startAngle = endAngle
    return segment
  })

  return {
    width,
    height,
    dpr,
    centerX: pie.pieCenter.x * dpr,
    centerY: pie.pieCenter.y * dpr,
    innerRadius: pie.innerRadius * dpr,
    outerRadius: pie.outerRadius * dpr,
    strokeWidth: dpr,
    strokeColor: parseColor(pie.options.misc.colors.segmentStroke),
    segments,
  }
}

const makeOverlay = canvas => {
  const container = canvas.parentNode
  const previousPosition = container.style.position
  const ownsPosition = getComputedStyle(container).position === "static"
  if (ownsPosition) container.style.position = "relative"
  const overlay = document.createElement("div")
  overlay.dataset.rendererOverlay = "d3pie"
  Object.assign(overlay.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  })
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
  })
  container.appendChild(overlay)
  return {
    overlay,
    restorePosition: () => {
      if (ownsPosition) container.style.position = previousPosition
    },
  }
}

const getSegmentIndex = (overlay, target) => {
  if (!(target instanceof Element)) return -1
  const indexed = target.closest("[data-index]")
  if (!indexed || !overlay.contains(indexed)) return -1
  const index = Number.parseInt(indexed.getAttribute("data-index"), 10)
  return Number.isNaN(index) ? -1 : index
}

export default ({ chart, chartUI, makeResources }) => {
  let resource = null
  let overlay = null
  let restoreOverlayPosition = null
  let pie = null
  let listeners = null
  let hoveredIndex = -1
  let currentFrame = null
  let drawStats = null
  let prevMin
  let prevMax
  let interactionFrame = null

  const drawSegments = () => {
    if (!resource || !pie || !currentFrame) return false
    const frame = makeD3PieFrame(pie, currentFrame, hoveredIndex)
    resource.layer.update(frame)
    resource.surface.draw([resource.layer], currentFrame)
    drawStats = {
      segmentCount: frame.segments.length,
      centerX: frame.centerX,
      centerY: frame.centerY,
      width: frame.width,
      height: frame.height,
      dpr: frame.dpr,
      innerRadius: frame.innerRadius,
      outerRadius: frame.outerRadius,
      firstSegment: frame.segments[0],
      strokeColor: frame.strokeColor,
      hoveredIndex,
      expandedOffsetPixels: Math.max(
        0,
        ...frame.segments.map(({ offsetX, offsetY }) => Math.hypot(offsetX, offsetY))
      ),
    }
    return true
  }

  const stopInteractionAnimation = () => {
    if (interactionFrame !== null) cancelAnimationFrame(interactionFrame)
    interactionFrame = null
  }

  const animateTransforms = () => {
    stopInteractionAnimation()
    const end = performance.now() + 450
    const tick = () => {
      interactionFrame = null
      drawSegments()
      if (performance.now() < end) interactionFrame = requestAnimationFrame(tick)
    }
    interactionFrame = requestAnimationFrame(tick)
  }

  const onMouseOver = event => {
    const index = getSegmentIndex(overlay, event.target)
    if (index === -1 || index === hoveredIndex) return
    hoveredIndex = index
    drawSegments()
  }

  const onMouseOut = event => {
    const index = getSegmentIndex(overlay, event.target)
    if (index === -1 || index !== hoveredIndex) return
    if (getSegmentIndex(overlay, event.relatedTarget) === index) return
    hoveredIndex = -1
    drawSegments()
  }

  const hideSegmentPaths = () => {
    overlay.querySelectorAll("path[data-index]").forEach(path => {
      path.style.opacity = "0"
      path.style.pointerEvents = "all"
    })
    overlay.querySelectorAll("[data-index]:not(path)").forEach(label => {
      label.style.pointerEvents = "auto"
    })
  }

  const mount = ({ render, canvas }) => {
    const overlayState = makeOverlay(canvas)
    overlay = overlayState.overlay
    restoreOverlayPosition = overlayState.restorePosition
    overlay.addEventListener("mouseover", onMouseOver)
    overlay.addEventListener("mouseout", onMouseOut)
    overlay.addEventListener("click", animateTransforms)
    const { loaded } = chart.getAttributes()
    listeners = unregister(
      chart.onAttributeChange("hoverX", render),
      !loaded && chart.onceAttributeChange("loaded", render),
      chart.onAttributeChange("theme", render),
      chart.on("visibleDimensionsChanged", render)
    )
  }

  const unmount = () => {
    stopInteractionAnimation()
    listeners?.()
    listeners = null
    overlay?.removeEventListener("mouseover", onMouseOver)
    overlay?.removeEventListener("mouseout", onMouseOut)
    overlay?.removeEventListener("click", animateTransforms)
    pie?.destroy()
    pie = null
    overlay?.remove()
    overlay = null
    restoreOverlayPosition?.()
    restoreOverlayPosition = null
    resource?.destroy()
    resource = null
    hoveredIndex = -1
    currentFrame = null
    drawStats = null
    prevMin = null
    prevMax = null
  }

  const render = frame => {
    if (!resource || !overlay || !chart.getAttribute("loaded")) return false
    currentFrame = frame
    hoveredIndex = -1
    stopInteractionAnimation()

    const content = groupD3PieContent(
      makeD3PieContent(chart, chartUI),
      chart.getThemeAttribute("themeD3pieSmallColor")
    )
    const options = getInitialOptions(
      { chart, getElement: () => overlay },
      {
        content,
        sortOrder: "none",
        smallSegmentGrouping: { enabled: false },
      }
    )
    pie?.destroy()
    pie = new d3pie(overlay, options)
    hideSegmentPaths()

    const [min, max] = chart.getAttribute("getValueRange")(chart)
    if (min !== prevMin || max !== prevMax) chart.trigger("yAxisChange", min, max)
    prevMin = min
    prevMax = max

    drawSegments()
    chartUI.render()
    chartUI.trigger("rendered")
    return true
  }

  return {
    mount,
    unmount,
    render,
    createResources: (runtime, canvas) => makeResources(runtime, canvas),
    attachResources: nextResource => {
      resource?.destroy()
      resource = nextResource
    },
    getBufferBytes: () => resource?.layer.getBufferBytes() || 0,
    getDrawStats: () => drawStats,
    getQueueDone: () => resource?.surface.getQueueDone?.() || Promise.resolve(),
    getMinMax: () => chart.getAttribute("getValueRange")(chart),
  }
}
