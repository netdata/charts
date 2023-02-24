import { unregister } from "@/helpers/makeListeners"
import { useCallback, useLayoutEffect, useContext, useMemo, useReducer, useState } from "react"
import chartTitleByContextMap from "../helpers/chartTitleByContextMap"
import context from "./context"

export const useChart = () => useContext(context)

const dispatch = s => s + 1

export const useForceUpdate = () => {
  const [, forceUpdate] = useReducer(dispatch, 0)
  return forceUpdate
}

export const useImmediateListener = (func, deps) => {
  const off = useMemo(func, deps)
  useLayoutEffect(() => off, [off])
}

export const useAttributeValue = name => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange(name, forceUpdate), [chart])

  return chart.getAttribute(name)
}

export const useInitialLoading = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange("loaded", forceUpdate), [chart])

  return !chart.getAttribute("loaded")
}

export const useIsFetching = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange("loading", forceUpdate), [chart])

  return chart.getAttribute("loading")
}

export const useEmpty = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.on("finishFetch", forceUpdate), [chart])

  const { result } = chart.getPayload()

  return Array.isArray(result) ? result.length === 0 : result.data.length === 0
}

export const useAttribute = name => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  const getValue = () => chart.getAttribute(name)

  useImmediateListener(() => chart.onAttributeChange(name, forceUpdate), [chart])

  const updateValue = useCallback(
    nextValue =>
      chart.updateAttribute(
        name,
        typeof nextValue === "function" ? nextValue(getValue()) : nextValue
      ),
    [chart]
  )

  return [getValue(), updateValue]
}

export const useMetadata = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.on("metadataChanged", forceUpdate), [chart])

  return chart.getMetadata()
}

export const useTitle = () => {
  const title = useAttributeValue("title")
  const contextScope = useAttributeValue("contextScope")

  const titleByContext = contextScope.length === 1 && chartTitleByContextMap[contextScope[0]]

  if (titleByContext) return titleByContext

  return title
}

export const useName = () => {
  const name = useAttributeValue("name")
  const contextScope = useAttributeValue("contextScope")

  return name || contextScope.join(", ")
}

export const useVisibleDimensionId = id => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange("selectedDimensions", forceUpdate), [chart])

  return chart.isDimensionVisible(id)
}

export const usePayload = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.on("payloadChanged", forceUpdate), [chart])

  return chart.getPayload()
}

export const useChartError = () => {
  const [error, setError] = useState(false)
  const chart = useChart()
  const forceUpdate = useForceUpdate()

  useImmediateListener(() => {
    const handleFetch = ({ hasError }) => {
      setError(hasError)
      forceUpdate()
    }

    return chart
      .on("successFetch", () => handleFetch({ hasError: false }))
      .on("failFetch", () => handleFetch({ hasError: true }))
  }, [chart])

  return error
}

export const useFormatTime = value => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange("timezone", forceUpdate), [chart])

  return useMemo(() => chart.formatTime(value), [value, chart.getAttribute("timezone")])
}

export const useFormatDate = value => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange("timezone", forceUpdate), [chart])

  return useMemo(() => chart.formatDate(value), [value, chart.getAttribute("timezone")])
}

export const useOnResize = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.getUI().on("resize", forceUpdate), [chart])

  return {
    width: chart.getUI().getChartWidth(),
    height: chart.getUI().getChartHeight(),
    parentWidth: chart.getUI().getParentWidth(),
  }
}

export const useDimensionIds = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.on("dimensionChanged", forceUpdate), [chart])

  return chart.getDimensionIds()
}

export const useUnitSign = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange("unitsConversion", forceUpdate), [chart])

  return chart.getUnitSign()
}

export const useUnit = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange("unitsConversion", forceUpdate), [chart])

  return chart.getUnits()
}

export const useLatestValue = id => {
  const chart = useChart()

  const [value, setState] = useState(null)

  useLayoutEffect(() => {
    const getValue = () => {
      const hover = chart.getAttribute("hoverX")
      const { result } = chart.getPayload()
      const dimensionIds = chart.getPayloadDimensionIds()

      if (result.data.length === 0) return ""

      let index = hover ? chart.getClosestRow(hover[0]) : -1
      index = index === -1 ? result.data.length - 1 : index

      id = id || dimensionIds[0]
      const value = chart.getDimensionValue(id, index)

      if (isNaN(value)) return ""

      return chart.getConvertedValue(value)
    }

    return unregister(
      chart.onAttributeChange("hoverX", () => setState(getValue())),
      chart.on("dimensionChanged", () => setState(getValue())),
      chart.getUI().on("rendered", () => setState(getValue()))
    )
  }, [chart, id])

  return value
}
