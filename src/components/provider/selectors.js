import { unregister } from "@/helpers/makeListeners"
import { useCallback, useEffect, useContext, useMemo, useReducer, useState } from "react"
import context from "./context"

export const useChart = () => useContext(context)

const dispatch = s => s + 1

const useForceUpdate = () => {
  const [, forceUpdate] = useReducer(dispatch, 0)
  return forceUpdate
}

export const useImmediateListener = (func, deps) => {
  const off = useMemo(func, deps)
  useEffect(() => off, [off])
}

export const useListener = (func, deps) => {
  useEffect(func, deps)
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
  const { title } = useMetadata()
  const attributeTitle = useAttributeValue("title")

  return attributeTitle || title
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

  useImmediateListener(() => chart.on("successFetch", forceUpdate), [chart])

  return chart.getPayload()
}

export const useOnResize = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.getUI().on("resize", forceUpdate), [chart])

  return chart.getUI().getChartWidth()
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

  useImmediateListener(() => chart.onAttributeChange("unit", forceUpdate), [chart])

  return chart.getUnitSign()
}

export const useLatestValue = id => {
  const chart = useChart()

  const getValue = () => {
    const hover = chart.getAttribute("hoverX")
    const { result } = chart.getPayload()

    if (result.data.length === 0) return null

    let index = hover ? chart.getClosestRow(hover[0]) : -1
    index = index === -1 ? result.data.length - 1 : index

    const value = chart.getDimensionValue(id, index)
    return chart.getConvertedValue(value)
  }

  const [value, setState] = useState(getValue)

  useEffect(
    () =>
      unregister(
        chart.onAttributeChange("hoverX", () => setState(getValue())),
        chart.on("dimensionChanged", () => setState(getValue())),
        chart.getUI().on("rendered", () => setState(getValue()))
      ),
    [chart]
  )

  return value
}
