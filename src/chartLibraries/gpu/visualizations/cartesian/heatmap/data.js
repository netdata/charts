import { isIncremental } from "@/helpers/heatmap"
import { makePointValueReader } from "../line/data"

export const packHeatmapData = (chart, rows, dimensionIds, point) => {
  const pointCount = rows.length
  const seriesCount = dimensionIds.length
  const xOriginMs = pointCount ? rows[0][0] : 0
  const x = new Float32Array(pointCount)
  const y = new Float32Array(pointCount * seriesCount)
  const incremental = isIncremental(chart)
  const readValue = makePointValueReader(point)

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const row = rows[pointIndex]
    x[pointIndex] = (row[0] - xOriginMs) / 1000
    for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex++) {
      const value = incremental
        ? chart.getRowDimensionValue(dimensionIds[seriesIndex], row, {
            allowNull: true,
          })
        : readValue(row[seriesIndex + 1])
      const resolved =
        value === null || value === undefined || !Number.isFinite(value)
          ? 0
          : incremental
            ? value
            : Math.abs(value)
      y[pointIndex * seriesCount + seriesIndex] = resolved
    }
  }

  return {
    sourceRows: rows,
    point,
    xOriginMs,
    yOrigin: 0,
    yScale: 1,
    x,
    y,
    pointCount,
    seriesCount,
    gapEdgeIndexes: [],
    byteLength: x.byteLength + y.byteLength,
  }
}

export default chart => {
  let source = null
  let dimensionKey = null
  let pointSchema = null
  let visibilityKey = null
  let heatmapType = null
  let packed = null

  const get = () => {
    const { all, point } = chart.getPayload()
    const dimensionIds = chart.getPayloadDimensionIds()
    if (chart.getAttribute("outOfLimits") || !all?.length || !dimensionIds.length) return null

    const nextDimensionKey = dimensionIds.join("\u0000")
    const nextVisibilityKey = chart.getVisibleDimensionIds().join("\u0000")
    const nextHeatmapType = chart.getHeatmapType()
    if (
      source === all &&
      dimensionKey === nextDimensionKey &&
      pointSchema === point &&
      visibilityKey === nextVisibilityKey &&
      heatmapType === nextHeatmapType
    )
      return packed

    source = all
    dimensionKey = nextDimensionKey
    pointSchema = point
    visibilityKey = nextVisibilityKey
    heatmapType = nextHeatmapType
    packed = packHeatmapData(chart, all, dimensionIds, point)
    return packed
  }

  const clear = () => {
    source = null
    dimensionKey = null
    pointSchema = null
    visibilityKey = null
    heatmapType = null
    packed = null
  }

  return { get, clear }
}
