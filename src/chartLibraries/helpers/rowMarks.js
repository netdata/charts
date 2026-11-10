import { getRowPointValue } from "@/sdk/makeChart/getPointValue"
import { getAnomalyColumns, getRowAnomalyRate, isAnomalous } from "@/components/modern/anomaly"

const getRow = (chart, row) => (row == null ? null : chart.getPayload().all?.[row])

export const hasAnomalyAt = (chart, row) => {
  const pointData = getRow(chart, row)
  if (!pointData) return false

  return isAnomalous(
    getRowAnomalyRate(pointData, getAnomalyColumns(chart), chart.getPayload().point)
  )
}

export const hasAnnotationAt = (chart, row) => {
  const pointData = getRow(chart, row)
  if (!pointData) return false

  const { point } = chart.getPayload()
  return getAnomalyColumns(chart).some(column => !!getRowPointValue(pointData, column, point, "pa"))
}
