import { useCallback, useEffect, useState, useContext, useMemo } from "react"
import context from "./context"

export const useChart = () => useContext(context)

export const useListener = (func, deps) => {
  const on = useMemo(() => func, deps)
  useEffect(() => on(), [on])
}

export const useAttributeValue = name => {
  const chart = useChart()
  const getValue = () => chart.getAttribute(name)

  const [value, setValue] = useState(getValue)

  useListener(() => chart.onAttributeChange(name, () => setValue(getValue)), [chart])

  return value
}

export const useInitialLoading = () => {
  const chart = useChart()

  const getValue = () => !chart.getAttribute("loaded")
  const [value, setValue] = useState(getValue)

  useListener(() => chart.onAttributeChange("loaded", () => setValue(getValue)), [chart])

  return value
}

export const useEmpty = () => {
  const chart = useChart()

  const getValue = () => {
    const { result } = chart.getPayload()
    return result.data.length === 0
  }

  const [empty, setEmpty] = useState(getValue)

  useListener(() => chart.on("finishFetch", () => setEmpty(getValue)), [chart])

  return empty
}

export const useAttribute = name => {
  const chart = useChart()

  const getValue = () => chart.getAttribute(name)

  const [value, setValue] = useState(getValue)

  useListener(() => chart.onAttributeChange(name, () => setValue(getValue)), [chart])

  const updateValue = useCallback(
    nextValue =>
      chart.updateAttribute(
        name,
        typeof nextValue === "function" ? nextValue(getValue()) : nextValue
      ),
    [chart]
  )

  return [value, updateValue]
}

export const useMetadata = () => {
  const chart = useChart()

  const getValue = () => chart.getMetadata()

  const [value, setValue] = useState(getValue)

  useListener(() => chart.on("metadataChanged", () => setValue(getValue())), [chart])

  return value
}

export const useTitle = () => {
  const { title } = useMetadata()
  const attributeTitle = useAttributeValue("title")

  return attributeTitle || title
}

export const useVisibleDimensionId = id => {
  const chart = useChart()

  const getValue = () => chart.isDimensionVisible(id)
  const [visible, setVisible] = useState(getValue)

  useListener(() => chart.onAttributeChange("selectedDimensions", () => setVisible(getValue())), [
    chart,
  ])

  return visible
}

export const usePayload = () => {
  const chart = useChart()

  const getValue = () => chart.getPayload()
  const [value, setValue] = useState(getValue)

  useListener(() => chart.on("successFetch", () => setValue(getValue())), [chart])

  return value
}

export const useOnResize = () => {
  const chart = useChart()

  const getValue = () => chart.getUI().getChartWidth()

  const [value, setValue] = useState(getValue)

  useListener(() => chart.getUI().on("resize", () => setValue(getValue())), [chart])

  return value
}

export const useDimensionIds = () => {
  const chart = useChart()

  const getList = () => chart.getDimensionIds()

  const [dimensionIds, setDimensionIds] = useState(getList)

  useListener(() => chart.on("dimensionChanged", () => setDimensionIds(getList)), [chart])

  return dimensionIds
}

export const useUnitSign = () => {
  const chart = useChart()

  const [unit, setUnit] = useState(chart.getUnitSign)

  useListener(() => chart.onAttributeChange("unit", () => setUnit(chart.getUnitSign())), [chart])

  return unit
}
