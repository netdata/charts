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
      updateAttribute: chart.updateAttribute.bind(chart),
      getAttribute: chart.getAttribute.bind(chart),
      getDimensionIds: chart.getDimensionIds.bind(chart),
      getVisibleDimensionIds: chart.getVisibleDimensionIds.bind(chart),
      getDimensionValue: chart.getDimensionValue.bind(chart),
      getClosestRow: chart.getClosestRow.bind(chart),
      formatTime: chart.formatTime.bind(chart),
      formatDate: chart.formatDate.bind(chart),
      getConvertedValue: chart.getConvertedValue.bind(chart),
      selectDimensionColor: chart.selectDimensionColor.bind(chart),
      isDimensionVisible: chart.isDimensionVisible.bind(chart),
      focus: chart.focus.bind(chart),
      blur: chart.blur.bind(chart),
      getId: chart.getId.bind(chart),
      trigger: chart.trigger.bind(chart),
      on: chart.on.bind(chart),
      off: chart.off.bind(chart),
      onAttributeChange: chart.onAttributeChange.bind(chart),
      onceAttributeChange: chart.onceAttributeChange.bind(chart),
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
          convertedValue: chart.getConvertedValue(value),
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
