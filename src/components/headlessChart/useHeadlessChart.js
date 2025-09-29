import { useMemo } from "react"
import {
  useChart,
  usePayload,
  useAttributeValue,
  useDimensionIds,
  useIsFetching,
  useEmpty,
} from "../provider"

export const useHeadlessChart = () => {
  const chart = useChart()
  const payload = usePayload()
  const dimensionIds = useDimensionIds()

  const hover = useAttributeValue("hoverX")

  const helpers = useMemo(
    () => ({
      updateAttribute: chart.updateAttribute,
      getAttribute: chart.getAttribute,
      getDimensionIds: chart.getDimensionIds,
      getVisibleDimensionIds: chart.getVisibleDimensionIds,
      getDimensionValue: chart.getDimensionValue,
      getClosestRow: chart.getClosestRow,
      formatTime: chart.formatTime,
      formatDate: chart.formatDate,
      getConvertedValue: chart.getConvertedValue,
      selectDimensionColor: chart.selectDimensionColor,
      isDimensionVisible: chart.isDimensionVisible,
      focus: chart.focus,
      blur: chart.blur,
      getId: chart.getId,
      trigger: chart.trigger,
      on: chart.on,
      off: chart.off,
      onAttributeChange: chart.onAttributeChange,
      onceAttributeChange: chart.onceAttributeChange,
    }),
    [chart]
  )

  const data = useMemo(() => {
    const { data: rawData = [] } = payload

    if (!rawData.length) return []

    const visibleDimensionIds = chart.getVisibleDimensionIds()
    const currentRowIndex = hover ? chart.getClosestRow(hover[0]) : rawData.length - 1

    return rawData.map((row, rowIndex) => {
      const [timestamp, ...values] = row
      const isCurrentRow = rowIndex === currentRowIndex

      const dimensions = visibleDimensionIds.map(dimensionId => {
        const value = chart.getDimensionValue(dimensionId, rowIndex)
        return {
          id: dimensionId,
          value,
          convertedValue: chart.getConvertedValue(value, { dimensionId }),
          color: chart.selectDimensionColor(dimensionId),
          visible: chart.isDimensionVisible(dimensionId),
        }
      })

      return {
        timestamp,
        formattedTime: chart.formatTime(timestamp),
        formattedDate: chart.formatDate(timestamp),
        values,
        dimensions,
        isCurrentRow,
        rowIndex,
      }
    })
  }, [payload, hover, chart])

  const currentRow = useMemo(() => {
    if (!data.length) return null
    return data.find(row => row.isCurrentRow) || data[data.length - 1]
  }, [data])

  const loading = useIsFetching()
  const empty = useEmpty()
  const loaded = useAttributeValue("loaded")
  const error = useAttributeValue("error")
  const showingInfo = useAttributeValue("showingInfo")
  const focused = useAttributeValue("focused")
  const state = useMemo(
    () => ({
      loading,
      empty,
      loaded,
      error,
      showingInfo,
      focused,
    }),
    [loading, empty, loaded, error, showingInfo, focused]
  )

  return {
    chart,
    data,
    currentRow,
    dimensionIds,
    hover,
    helpers,
    state,
    attributes: chart.getAttributes(),
  }
}

export default useHeadlessChart
