import { enums, parts, check, colors, priorities } from "@/helpers/annotations"
import { getRowPointValue } from "@/sdk/makeChart/getPointValue"
import { parseColor } from "@/chartLibraries/webgpu/engine/color"

const xPosition = (timestampMs, frame) =>
  frame.plot.left +
  ((timestampMs - frame.afterMs) / Math.max(frame.beforeMs - frame.afterMs, 1e-20)) *
    frame.plot.width

const colorWithAlpha = (color, alpha) => {
  const [r, g, b] = parseColor(color).map(value => Math.round(value * 255))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const getVisibleIndexes = chart => {
  const selected = chart.getAttribute("selectedLegendDimensions")
  return chart.getPayloadDimensionIds().reduce((indexes, id, index) => {
    if (!selected.length || chart.isDimensionVisible(id)) indexes.push(index)
    return indexes
  }, [])
}

export const makeGapEdgeCircles = ({ chart, packed, frame }) => {
  const dimensionIds = chart.getPayloadDimensionIds()
  const circles = []
  dimensionIds.forEach((id, seriesIndex) => {
    if (!chart.isDimensionVisible(id)) return
    packed.gapEdgeIndexes[seriesIndex].forEach(pointIndex => {
      const timestampMs = packed.xOriginMs + packed.x[pointIndex] * 1000
      const value =
        packed.yOrigin +
        packed.y[seriesIndex * packed.pointCount + pointIndex] * packed.yScale
      const x = xPosition(timestampMs, frame)
      const y =
        frame.plot.top +
        (1 - (value - frame.domain[0]) / (frame.domain[1] - frame.domain[0])) *
          frame.plot.height
      if (x < frame.plot.left || x > frame.plot.left + frame.plot.width) return
      circles.push({ x, y, radius: 2, color: chart.selectDimensionColor(id) })
    })
  })
  return circles
}

export const makeDataDecorationRects = ({ chart, frame }) => {
  const { data, all, point } = chart.getPayload()
  if (data?.length < 2 || !all || all.length !== data.length) return []

  const visibleIndexes = getVisibleIndexes(chart)
  const firstX = xPosition(data[0][0], frame)
  const secondX = xPosition(data[1][0], frame)
  const barWidth = Math.max(1, Math.floor(secondX - firstX + 1))
  const anomalyColor = chart.getThemeAttribute("themeAnomalyScaleColor")
  const rects = []

  data.forEach((row, rowIndex) => {
    const centerX = xPosition(row[0], frame)
    if (centerX + barWidth / 2 < frame.plot.left) return
    if (centerX - barWidth / 2 > frame.plot.left + frame.plot.width) return

    if (chart.getAttribute("showAnomalies")) {
      let anomalyRate = 0
      visibleIndexes.forEach(index => {
        anomalyRate = Math.max(
          anomalyRate,
          getRowPointValue(all[rowIndex], index + 1, point, "arp") || 0
        )
      })
      if (anomalyRate > 0) {
        rects.push({
          x: centerX - barWidth / 2,
          y: frame.plot.top,
          width: barWidth,
          height: 15,
          color: colorWithAlpha(anomalyColor, Math.min(1, anomalyRate / 100)),
        })
      }
    }

    if (chart.getAttribute("showAnnotations")) {
      const values = new Set()
      visibleIndexes.forEach(index => {
        const annotation = getRowPointValue(all[rowIndex], index + 1, point, "pa")
        if (annotation) parts.forEach(part => check(annotation, enums[part]) && values.add(part))
      })
      const sortedValues = [...values].sort((a, b) => priorities[a] < priorities[b])
      sortedValues.forEach(value => {
        const color = colors[value]
        if (!color) return
        rects.push({
          x: centerX - barWidth / 2,
          y: frame.plot.top + frame.plot.height - 4,
          width: barWidth,
          height: 4,
          color: colorWithAlpha(color, 0.45),
        })
      })
    }
  })

  return rects
}
