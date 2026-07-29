import limitRange from "@/helpers/limitRange"
import { getPointValue } from "@/sdk/makeChart/getPointValue"

export const eventToCanvasPoint = (event, canvas) => {
  const rect = canvas.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

const valueToY = (value, domain, plot) =>
  plot.top + (1 - (value - domain[0]) / Math.max(domain[1] - domain[0], 1e-20)) * plot.height

const yToValue = (y, domain, plot) =>
  domain[1] - ((y - plot.top) / Math.max(plot.height, 1)) * (domain[1] - domain[0])

const xToTimestamp = (x, frame) =>
  frame.afterMs +
  ((x - frame.plot.left) / Math.max(frame.plot.width, 1)) *
    (frame.beforeMs - frame.afterMs)

export const getClosestRow = (data, timestamp) => {
  if (!data.length) return -1
  if (timestamp <= data[0][0]) return 0
  if (timestamp >= data[data.length - 1][0]) return data.length - 1

  let start = 0
  let end = data.length - 1
  let closest = 0
  while (start <= end) {
    const middle = Math.floor((start + end) / 2)
    if (Math.abs(data[middle][0] - timestamp) < Math.abs(data[closest][0] - timestamp))
      closest = middle
    if (data[middle][0] === timestamp) return middle
    if (data[middle][0] < timestamp) start = middle + 1
    else end = middle - 1
  }
  return closest
}

export const findClosestDimension = ({ chart, row, y, domain, plot }) => {
  let dimensionId = null
  let distance = Infinity
  const payload = chart.getPayload()
  const rowData = payload.data[row]
  const dimensionIndexes = new Map(
    chart.getPayloadDimensionIds().map((id, index) => [id, index])
  )

  chart.getVisibleDimensionIds().forEach(id => {
    const seriesIndex = dimensionIndexes.get(id)
    const value =
      seriesIndex === undefined ? null : getPointValue(rowData?.[seriesIndex + 1], payload.point)
    if (!Number.isFinite(value)) return
    const nextDistance = Math.abs(valueToY(value, domain, plot) - y)
    if (nextDistance >= distance) return
    distance = nextDistance
    dimensionId = id
  })

  return dimensionId
}

const isNearAnnotation = (chart, timestampMs, thresholdMs) =>
  Object.values(chart.getAttribute("overlays") || {}).some(
    overlay =>
      overlay.type === "annotation" &&
      Math.abs(overlay.timestamp * 1000 - timestampMs) < thresholdMs
  )

const createAnnotation = (chart, timestampMs, thresholdMs) => {
  const existingDraft = chart.getAttribute("draftAnnotation")
  if (existingDraft?.status === "editing") return
  if (isNearAnnotation(chart, timestampMs, thresholdMs)) return

  chart.updateAttribute("draftAnnotation", {
    timestamp: timestampMs / 1000,
    createdAt: new Date(),
    status: "draft",
  })
  chart.sdk.trigger("annotationCreate", chart, timestampMs / 1000)
  chart.trigger("annotationCreate", timestampMs / 1000)
}

const getNavigationMode = (event, chart) => {
  if (event.shiftKey && event.altKey) return "selectVertical"
  if (event.altKey) return "highlight"
  if (event.shiftKey) return "select"
  return chart.getAttribute("navigation") || "pan"
}

const makeSelectionRect = ({ mode, start, end, frame }) => {
  if (mode === "selectVertical") {
    return {
      x: frame.plot.left,
      y: Math.min(start.y, end.y),
      width: frame.plot.width,
      height: Math.abs(end.y - start.y),
      color: "rgba(128, 128, 128, 0.3)",
    }
  }
  return {
    x: Math.min(start.x, end.x),
    y: frame.plot.top,
    width: Math.abs(end.x - start.x),
    height: frame.plot.height,
    color: "rgba(128, 128, 128, 0.3)",
  }
}

export default ({
  chart,
  chartUI,
  canvas,
  getFrame,
  setDateWindow,
  clearDateWindow,
  setSelectionRect,
}) => {
  let lastX = null
  let lastY = null
  let drag = null
  let hovering = false
  let suppressClick = false
  let moveTimer = null
  let touch = null
  let lastTouchEnd = 0

  const getClosest = event => {
    const frame = getFrame()
    if (!frame) return null
    const point = eventToCanvasPoint(event, canvas)
    const { plot, domain } = frame
    if (
      point.x < plot.left ||
      point.x > plot.left + plot.width ||
      point.y < plot.top ||
      point.y > plot.top + plot.height
    )
      return null

    const data = chart.getPayload().data
    const row = getClosestRow(data, xToTimestamp(point.x, frame))
    const rowData = data[row]
    if (!Array.isArray(rowData)) return null
    const dimensionId = findClosestDimension({ chart, row, y: point.y, domain, plot })
    if (!dimensionId) return null

    return { point, timestampMs: rowData[0], dimensionId }
  }

  const mousemove = event => {
    chartUI.trigger("mousemove", event)
    if (drag) return
    if (!chart.getAttribute("enabledHover")) return
    const point = eventToCanvasPoint(event, canvas)
    if (lastX !== null && Math.abs(point.x - lastX) < 5 && Math.abs(point.y - lastY) < 5)
      return
    lastX = point.x
    lastY = point.y

    const closest = getClosest(event)
    if (!closest) {
      if (hovering) mouseleave()
      return
    }
    hovering = true
    chart.sdk.trigger("highlightHover", chart, closest.timestampMs, closest.dimensionId)
    chart.trigger("highlightHover", closest.timestampMs, closest.dimensionId)
  }

  const mouseleave = event => {
    if (drag) return
    chartUI.trigger("mouseout", event)
    lastX = null
    lastY = null
    hovering = false
    chart.sdk.trigger("highlightBlur", chart)
    chart.trigger("highlightBlur")
  }

  const click = event => {
    if (suppressClick) {
      suppressClick = false
      return
    }
    const closest = getClosest(event)
    if (!closest) return
    const frame = getFrame()
    const thresholdMs = frame
      ? ((frame.beforeMs - frame.afterMs) / Math.max(frame.plot.width, 1)) * 10
      : 0
    createAnnotation(chart, closest.timestampMs, thresholdMs)
    chart.sdk.trigger("highlightClick", chart, closest.timestampMs, closest.dimensionId)
    chart.trigger("highlightClick", closest.timestampMs, closest.dimensionId)
  }

  const restoreNavigation = () => {
    const previous = chart.getAttribute("prevNavigation")
    if (!previous) return
    chart.updateAttributes({ navigation: previous, prevNavigation: null })
  }

  const endDrag = event => {
    if (!drag) return
    const current = eventToCanvasPoint(event, canvas)
    const distance = Math.hypot(current.x - drag.start.x, current.y - drag.start.y)
    const moved = drag.moved || distance >= 5
    suppressClick = moved
    setSelectionRect(null)

    if (drag.mode === "pan") {
      if (drag.panning) {
        const frame = getFrame()
        chart.sdk.trigger("panEnd", chart, [frame.afterMs, frame.beforeMs])
        clearDateWindow()
      }
    } else if (drag.mode === "selectVertical") {
      const range =
        distance < 5
          ? null
          : [
              yToValue(drag.start.y, drag.frame.domain, drag.frame.plot),
              yToValue(current.y, drag.frame.domain, drag.frame.plot),
            ].sort((a, b) => a - b)
      chart.sdk.trigger("highlightVerticalEnd", chart, range)
    } else {
      const range =
        distance < 5
          ? null
          : [
              Math.round(xToTimestamp(drag.start.x, drag.frame) / 1000),
              Math.round(xToTimestamp(current.x, drag.frame) / 1000),
            ].sort((a, b) => a - b)
      chart.sdk.trigger("highlightEnd", chart, range)
      chart.trigger("highlightEnd", range)
    }

    drag = null
    window.removeEventListener("mousemove", dragMove)
    window.removeEventListener("mouseup", endDrag)
    setTimeout(restoreNavigation)
  }

  const dragMove = event => {
    if (!drag) return
    const current = eventToCanvasPoint(event, canvas)
    if (drag.mode === "pan") {
      const distance = Math.hypot(current.x - drag.start.x, current.y - drag.start.y)
      if (distance < 5 && !drag.panning) return
      if (!drag.panning) {
        drag.panning = true
        chart.sdk.trigger("panStart", chart)
      }
      drag.moved = true
      const delta =
        ((drag.start.x - current.x) / Math.max(drag.frame.plot.width, 1)) *
        (drag.frame.beforeMs - drag.frame.afterMs)
      setDateWindow([drag.frame.afterMs + delta, drag.frame.beforeMs + delta])
      return
    }
    drag.moved =
      drag.moved || Math.hypot(current.x - drag.start.x, current.y - drag.start.y) >= 5
    setSelectionRect(makeSelectionRect({ ...drag, end: current }))
  }

  const mousedown = event => {
    if (event.button !== 0 || !chart.getAttribute("enabledNavigation")) return
    const frame = getFrame()
    if (!frame) return
    const start = eventToCanvasPoint(event, canvas)
    if (
      start.x < frame.plot.left ||
      start.x > frame.plot.left + frame.plot.width ||
      start.y < frame.plot.top ||
      start.y > frame.plot.top + frame.plot.height
    )
      return
    const mode = getNavigationMode(event, chart)
    const previous = chart.getAttribute("navigation")
    if (mode !== previous) chart.updateAttributes({ navigation: mode, prevNavigation: previous })
    drag = { mode, start, frame, moved: false, panning: false }
    event.preventDefault()

    if (mode === "selectVertical") chart.sdk.trigger("highlightVerticalStart", chart)
    else if (mode !== "pan") chart.sdk.trigger("highlightStart", chart)

    window.addEventListener("mousemove", dragMove)
    window.addEventListener("mouseup", endDrag)
  }

  const wheel = event => {
    if (!chart.getAttribute("enabledNavigation") || (!event.shiftKey && !event.altKey)) return
    const frame = getFrame()
    if (!frame) return
    event.preventDefault()
    event.stopPropagation()

    const point = eventToCanvasPoint(event, canvas)
    const bias = (point.x - frame.plot.left) / Math.max(frame.plot.width, 1)
    const normal =
      typeof event.wheelDelta === "number" && !Number.isNaN(event.wheelDelta)
        ? event.wheelDelta / 40
        : event.deltaY * -1.2
    const percentage = (event.detail ? event.detail * -1 : normal) / 50
    const increment = (frame.beforeMs - frame.afterMs) * percentage
    const after = frame.afterMs + increment * bias
    const before = frame.beforeMs - increment * (1 - bias)
    const limited = limitRange({ after: after / 1000, before: before / 1000 })
    const dateWindow = [limited.fixedAfter * 1000, limited.fixedBefore * 1000]
    setDateWindow(dateWindow)

    clearTimeout(moveTimer)
    moveTimer = setTimeout(() => {
      chart.moveX(limited.fixedAfter, limited.fixedBefore)
      clearDateWindow()
    }, 500)
  }

  const dblclick = event => {
    event.preventDefault()
    chart.resetNavigation()
  }

  const getTouchPoint = source => {
    const rect = canvas.getBoundingClientRect()
    return { x: source.clientX - rect.left, y: source.clientY - rect.top }
  }

  const touchstart = event => {
    if (!chart.getAttribute("enabledNavigation") || !event.touches.length) return
    const frame = getFrame()
    if (!frame) return
    event.preventDefault()
    const points = Array.from(event.touches).map(getTouchPoint)
    const midpoint =
      points.length > 1
        ? { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
        : points[0]
    if (
      midpoint.x < frame.plot.left ||
      midpoint.x > frame.plot.left + frame.plot.width ||
      midpoint.y < frame.plot.top ||
      midpoint.y > frame.plot.top + frame.plot.height
    )
      return
    touch = {
      frame,
      points,
      midpoint,
      distance:
        points.length > 1
          ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
          : 0,
      moved: false,
      panning: false,
    }
  }

  const touchmove = event => {
    if (!touch || !event.touches.length) return
    event.preventDefault()
    const points = Array.from(event.touches).map(getTouchPoint)
    if (!touch.panning) {
      touch.panning = true
      chart.sdk.trigger("panStart", chart)
    }
    touch.moved = true

    if (points.length > 1 && touch.points.length > 1 && touch.distance > 0) {
      const distance = Math.max(
        1,
        Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
      )
      const span = (touch.frame.beforeMs - touch.frame.afterMs) * (touch.distance / distance)
      const bias =
        (touch.midpoint.x - touch.frame.plot.left) / Math.max(touch.frame.plot.width, 1)
      const center = xToTimestamp(touch.midpoint.x, touch.frame)
      setDateWindow([center - span * bias, center + span * (1 - bias)])
      return
    }

    const delta =
      ((touch.points[0].x - points[0].x) / Math.max(touch.frame.plot.width, 1)) *
      (touch.frame.beforeMs - touch.frame.afterMs)
    setDateWindow([touch.frame.afterMs + delta, touch.frame.beforeMs + delta])
  }

  const touchend = event => {
    if (!touch || event.touches.length) return
    event.preventDefault()
    const now = Date.now()
    if (touch.moved) {
      const frame = getFrame()
      chart.sdk.trigger("panEnd", chart, [frame.afterMs, frame.beforeMs])
      clearDateWindow()
    } else if (now - lastTouchEnd < 300) {
      chart.resetNavigation()
    } else {
      const timestamp = xToTimestamp(touch.points[0].x, touch.frame)
      const data = chart.getPayload().data
      const row = getClosestRow(data, timestamp)
      if (row !== -1) chart.updateAttribute("clickX", [data[row][0], null])
    }
    lastTouchEnd = now
    touch = null
  }

  canvas.addEventListener("mousemove", mousemove)
  canvas.addEventListener("mouseleave", mouseleave)
  canvas.addEventListener("click", click)
  canvas.addEventListener("mousedown", mousedown)
  canvas.addEventListener("wheel", wheel, { passive: false })
  canvas.addEventListener("dblclick", dblclick)
  canvas.addEventListener("touchstart", touchstart, { passive: false })
  canvas.addEventListener("touchmove", touchmove, { passive: false })
  canvas.addEventListener("touchend", touchend, { passive: false })
  canvas.addEventListener("touchcancel", touchend, { passive: false })

  return () => {
    clearTimeout(moveTimer)
    if (drag?.panning || touch?.panning) {
      chart
        .getApplicableNodes({ syncPanning: true })
        .forEach(node => node.updateAttributes({ enabledHover: true, panning: false }))
    }
    if (drag && drag.mode !== "pan") {
      chart
        .getApplicableNodes({ syncHighlight: true })
        .forEach(node => node.updateAttributes({ enabledHover: true, highlighting: false }))
    }
    restoreNavigation()
    drag = null
    touch = null
    window.removeEventListener("mousemove", dragMove)
    window.removeEventListener("mouseup", endDrag)
    canvas.removeEventListener("mousemove", mousemove)
    canvas.removeEventListener("mouseleave", mouseleave)
    canvas.removeEventListener("click", click)
    canvas.removeEventListener("mousedown", mousedown)
    canvas.removeEventListener("wheel", wheel)
    canvas.removeEventListener("dblclick", dblclick)
    canvas.removeEventListener("touchstart", touchstart)
    canvas.removeEventListener("touchmove", touchmove)
    canvas.removeEventListener("touchend", touchend)
    canvas.removeEventListener("touchcancel", touchend)
  }
}
