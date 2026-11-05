import { getValueByPeriod } from "@/components/provider"
import { findDimensionId } from "@/components/table/columns"
import { getValue } from "@/helpers/crud"

export const hotPercent = 80

const emptyRows = []
const cache = new WeakMap()

export const getRowDimensionId = (keysStr, { key, ids, contextGroups } = {}) =>
  findDimensionId(getValue(keysStr, ids, contextGroups, "|"), key)

const readValue = (chart, id) => {
  if (!id || !chart.isDimensionVisible(id)) return null

  const value = getValueByPeriod.latest({ chart, id, abs: false, allowNull: true })
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

const measureContext = (chart, rows, context) => {
  const dimensions = Object.keys(rows[0]?.contextGroups?.[context] || {})
  const columns = {}

  dimensions.forEach(dimension => {
    const keysStr = `${context}|${dimension}`
    let columnMax = 0

    rows.forEach(row => {
      const id = getRowDimensionId(keysStr, row)
      if (!id) return

      const value = readValue(chart, id)
      if (value !== null) columnMax = Math.max(columnMax, Math.abs(value))
    })

    columns[dimension] = columnMax
  })

  return { columns }
}

export const getContextScale = (chart, rows, context) => {
  const list = Array.isArray(rows) ? rows : emptyRows
  const payload = chart.getPayload()
  const hover = chart.getAttribute("hoverX")
  const visible = chart.getVisibleDimensionIds()
  let entry = cache.get(list)

  if (!entry || entry.payload !== payload || entry.hover !== hover || entry.visible !== visible) {
    entry = { payload, hover, visible, contexts: {} }
    cache.set(list, entry)
  }

  if (!entry.contexts[context]) entry.contexts[context] = measureContext(chart, list, context)

  return entry.contexts[context]
}

export const getShare = (value, max) => {
  if (typeof value !== "number" || !Number.isFinite(value) || !(max > 0)) return 0
  return Math.min(1, Math.abs(value) / max)
}

export const isHotPercent = value =>
  typeof value === "number" && Number.isFinite(value) && value >= hotPercent
