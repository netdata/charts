import { useCallback, useEffect, useLayoutEffect, useState, useContext } from "react"
import { unregister } from "@/helpers/makeListeners"
import context from "./context"

export const useChart = () => useContext(context)

export const useAttributeValue = name => {
  const chart = useChart()
  const getValue = () => chart.getAttribute(name)

  const [value, setValue] = useState(getValue)

  useLayoutEffect(() => chart.onAttributeChange(name, () => setValue(getValue)), [chart])

  return value
}

export const useInitialLoading = () => {
  const chart = useChart()

  const getValue = () =>
    !chart.getAttribute("loaded") &&
    chart.getAttribute("loading") &&
    chart.getPayload().result.data.length === 0

  const [value, setValue] = useState(getValue)

  useEffect(
    () =>
      unregister(
        chart.onAttributeChange("loaded", () => setValue(getValue)),
        chart.onAttributeChange("loading", () => setValue(getValue))
      ),
    [chart]
  )

  return value
}

export const useEmpty = () => {
  const chart = useChart()

  const getValue = () => {
    const { result } = chart.getPayload()
    return result.data.length === 0
  }

  const [empty, setEmpty] = useState(getValue)

  useEffect(() => chart.on("finishFetch", () => setEmpty(getValue)), [chart])

  return empty
}

export const useAttribute = name => {
  const chart = useChart()

  const getValue = () => chart.getAttribute(name)

  const [value, setValue] = useState(getValue)

  useLayoutEffect(() => chart.onAttributeChange(name, () => setValue(getValue)), [])

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
  return chart.getMetadata()
}

export const useVisibleDimensionId = id => {
  const chart = useChart()

  const getValue = () => chart.isDimensionVisible(id)
  const [visible, setVisible] = useState(getValue)

  useEffect(() => chart.onAttributeChange("selectedDimensions", () => setVisible(getValue())), [
    chart,
  ])

  return visible
}

export const usePayload = () => {
  const chart = useChart()

  const getValue = () => chart.getPayload()
  const [visible, setVisible] = useState(getValue)

  useEffect(() => chart.on("successFetch", () => setVisible(getValue())), [chart])

  return visible
}

export const useDimensionIds = () => {
  const chart = useChart()

  const getList = () => chart.getDimensionIds()

  const [dimensionIds, setDimensionIds] = useState(getList)

  useEffect(() => chart.on("dimensionChanged", () => setDimensionIds(getList)), [chart])

  return dimensionIds
}

export const useUnitSign = () => {
  const chart = useChart()

  const [unit, setUnit] = useState(chart.getUnitSign)

  useEffect(() => chart.onAttributeChange("unit", () => setUnit(chart.getUnitSign())), [chart])

  return unit
}
