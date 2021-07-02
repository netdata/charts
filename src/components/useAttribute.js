import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { unregister } from "@/helpers/makeListeners"

export const useAttributeValue = (chart, name) => {
  const getValue = () => chart.getAttribute(name)

  const [value, setValue] = useState(getValue)

  useLayoutEffect(() => chart.onAttributeChange(name, () => setValue(getValue)), [])

  return value
}

export const useInitialLoading = chart => {
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
    []
  )

  return value
}

export const useEmpty = chart => {
  const getValue = () => {
    const { result } = chart.getPayload()
    return result.data.length === 0
  }

  const [empty, setEmpty] = useState(getValue)

  useEffect(() => chart.on("finishFetch", () => setEmpty(getValue)), [])

  return empty
}

export default (chart, name) => {
  const getValue = () => chart.getAttribute(name)

  const [value, setValue] = useState(getValue)

  useLayoutEffect(() => chart.onAttributeChange(name, () => setValue(getValue)), [])

  const updateValue = useCallback(
    nextValue =>
      chart.updateAttribute(
        name,
        typeof nextValue === "function" ? nextValue(getValue()) : nextValue
      ),
    []
  )

  return [value, updateValue]
}
