import { useCallback, useEffect, useState } from "react"

export const useAttributeValue = (chart, name) => {
  const getValue = () => chart.getAttribute(name)

  const [value, setValue] = useState(getValue)

  useEffect(() => chart.onAttributeChange(name, () => setValue(getValue)), [])

  return value
}

export default (chart, name) => {
  const getValue = () => chart.getAttribute(name)

  const [value, setValue] = useState(getValue)

  useEffect(() => chart.onAttributeChange(name, () => setValue(getValue)), [])

  const updateValue = useCallback(nextValue => chart.updateAttribute(name, nextValue), [])

  return [value, updateValue]
}
