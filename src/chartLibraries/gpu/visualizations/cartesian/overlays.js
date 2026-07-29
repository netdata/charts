import { makeVerticalDashRects } from "./interaction"

const alarmLineColors = {
  warning: "#F9A825",
  critical: "#FF4136",
  clear: "#00AB44",
}

const alarmBorderColors = {
  warning: "#FFF8E1",
  critical: "#FFEBEF",
  clear: "#E5F5E8",
}

const alarmFillColors = {
  warning: "rgba(255, 195, 0, 0.1)",
  critical: "rgba(245, 155, 155, 0.1)",
  clear: "rgba(104, 196, 125, 0.1)",
}

const transitionColors = {
  WARNING: "rgba(255, 195, 0, 0.3)",
  CRITICAL: "rgba(255, 65, 54, 0.3)",
  CLEAR: "rgba(0, 171, 68, 0.3)",
}

const parseTimestamp = timestamp =>
  typeof timestamp === "number" ? timestamp * 1000 : new Date(timestamp).getTime()

const xPosition = (timestampMs, frame) =>
  frame.plot.left +
  ((timestampMs - frame.afterMs) / Math.max(frame.beforeMs - frame.afterMs, 1e-20)) *
    frame.plot.width

const getArea = (range, frame) => {
  const rangeAfterMs = range[0] * 1000
  const rangeBeforeMs = range[1] * 1000
  if (rangeBeforeMs < frame.afterMs || rangeAfterMs > frame.beforeMs) return null

  const from = xPosition(Math.max(frame.afterMs, rangeAfterMs), frame)
  const to = xPosition(Math.min(frame.beforeMs, rangeBeforeMs), frame)
  return { from, to, width: to - from }
}

const areasByChartUI = new WeakMap()
const trigger = (chartUI, id, area) => {
  if (!areasByChartUI.has(chartUI)) areasByChartUI.set(chartUI, new Map())
  const areas = areasByChartUI.get(chartUI)
  const key = area ? `${area.from}:${area.to}:${area.width}` : "none"
  if (areas.get(id) === key) return
  areas.set(id, key)
  requestAnimationFrame(() => {
    if (areas.get(id) === key && chartUI.getElement())
      chartUI.trigger(`overlayedAreaChanged:${id}`, area)
  })
}

const addVerticalLine = (rects, x, frame, color, dash = [4, 4], width = 1) => {
  makeVerticalDashRects({ x, plot: frame.plot, color, dash }).forEach(rect =>
    rects.push({ ...rect, width })
  )
}

const addAlarm = ({ chartUI, overlay, id, frame, rects }) => {
  const area = getArea([overlay.when, overlay.when], frame)
  trigger(chartUI, id, area)
  if (!area) return
  addVerticalLine(rects, area.from - 1, frame, alarmLineColors[overlay.status], [4, 4], 2)
}

const addAlarmRange = ({ chartUI, overlay, id, frame, rects }) => {
  const whenLast = overlay.whenLast ?? Math.floor(Date.now() / 1000)
  const area = getArea([overlay.whenTriggered, whenLast], frame)
  trigger(chartUI, id, area)
  if (!area) return

  rects.push({
    x: area.from,
    y: frame.plot.top,
    width: area.width,
    height: frame.plot.height,
    color: alarmFillColors[overlay.status],
  })
  addVerticalLine(rects, area.from, frame, alarmBorderColors[overlay.status], [4, 4], 2)
  addVerticalLine(rects, area.to - 2, frame, alarmLineColors[overlay.status], [4, 4], 2)
}

const addAnnotation = ({ chartUI, overlay, id, frame, rects, draft = false }) => {
  if (!overlay?.timestamp) return
  const timestampMs = overlay.timestamp * 1000
  if (timestampMs < frame.afterMs || timestampMs > frame.beforeMs) {
    trigger(chartUI, id)
    return
  }

  const x = xPosition(timestampMs, frame)
  const area = { from: x, to: x, width: 0 }
  trigger(chartUI, id, area)
  const synced = !!overlay.originallyFrom
  const color = draft ? "#888888" : overlay.color || "#ff6b6b"
  const alphaColor = synced && /^#[\da-f]{6}$/i.test(color) ? `${color}b3` : color
  addVerticalLine(rects, x, frame, alphaColor, draft || synced ? [5, 5] : [100000, 0])
  rects.push({
    x: x - 2,
    y: overlay.position === "bottom" ? frame.plot.top + frame.plot.height - 2 : frame.plot.top,
    width: 4,
    height: 2,
    color: alphaColor,
  })
}

const addTransitions = ({ chartUI, overlay, id, frame, rects }) => {
  const transitions = [...(overlay.transitions || [])].sort(
    (a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp)
  )
  transitions.forEach((transition, index) => {
    const state = transition.to?.toUpperCase()
    if (!transitionColors[state] || (overlay.showCleared === false && state === "CLEAR")) return
    const startMs = parseTimestamp(transition.timestamp)
    const endMs = transitions[index + 1]
      ? parseTimestamp(transitions[index + 1].timestamp)
      : frame.beforeMs
    if (endMs < frame.afterMs || startMs > frame.beforeMs) return
    const from = xPosition(Math.max(startMs, frame.afterMs), frame)
    const to = xPosition(Math.min(endMs, frame.beforeMs), frame)
    rects.push({
      x: from,
      y: frame.plot.top,
      width: to - from,
      height: frame.plot.height,
      color: transitionColors[state],
    })
  })
  trigger(chartUI, id)
}

const addHighlight = ({ chartUI, overlay, id, frame, rects }) => {
  if (!overlay.range) return
  const area = getArea(overlay.range, frame)
  trigger(chartUI, id, area)
  if (!area) return
  rects.push({
    x: area.from,
    y: frame.plot.top,
    width: area.width,
    height: frame.plot.height,
    color: "rgba(207, 213, 218, 0.12)",
  })
  addVerticalLine(rects, area.from, frame, "#CFD5DA", [2, 7])
  addVerticalLine(rects, area.to, frame, "#CFD5DA", [2, 7])
}

const addPoint = ({ chart, overlay, frame, rects }) => {
  const rowData = chart.getPayload().data[overlay.row]
  if (!Array.isArray(rowData)) return
  const x = xPosition(rowData[0], frame)
  addVerticalLine(rects, x, frame, chart.getThemeAttribute("themeNetdata"), [2, 2])
}

const addProceeded = ({ chart, chartUI, id, frame }) => {
  const beforeSecs = frame.beforeMs / 1000
  const firstEntry = chart.getFirstEntry()
  const { outOfLimits, error } = chart.getAttributes()
  if (!outOfLimits && (!firstEntry || firstEntry > beforeSecs) && !error) return
  const range = outOfLimits || error ? [beforeSecs, beforeSecs] : [firstEntry, firstEntry]
  trigger(chartUI, id, getArea(range, frame))
}

const addByType = {
  alarm: addAlarm,
  alarmRange: addAlarmRange,
  annotation: addAnnotation,
  alertTransitions: addTransitions,
  highlight: addHighlight,
  point: addPoint,
  proceeded: addProceeded,
}

export const makeOverlayRects = ({ chart, chartUI, frame }) => {
  const rects = []
  Object.entries(chart.getAttribute("overlays") || {}).forEach(([id, overlay]) => {
    addByType[overlay.type]?.({ chart, chartUI, overlay, id, frame, rects })
  })
  const draft = chart.getAttribute("draftAnnotation")
  if (draft)
    addAnnotation({
      chart,
      chartUI,
      overlay: draft,
      id: "draftAnnotation",
      frame,
      rects,
      draft: true,
    })
  return rects
}
