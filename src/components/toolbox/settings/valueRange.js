import React, { useState, useEffect } from "react"
import { Flex, TextSmall, TextInput } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, useUnitSign } from "@/components/provider"

const ValueRange = () => {
  const chart = useChart()
  const staticValueRange = useAttributeValue("staticValueRange")
  const [minValue, setMinValue] = useState(staticValueRange?.[0] ?? "")
  const [maxValue, setMaxValue] = useState(staticValueRange?.[1] ?? "")

  const units = useUnitSign({ withoutConversion: true })

  useEffect(() => {
    setMinValue(staticValueRange?.[0] ?? "")
    setMaxValue(staticValueRange?.[1] ?? "")
  }, [staticValueRange])

  const commit = (rawMin, rawMax) => {
    const min = rawMin === "" ? null : Number(rawMin)
    const max = rawMax === "" ? null : Number(rawMax)
    const next = min === null && max === null ? null : [min, max]
    chart.updateAttributes({ staticValueRange: next })
    chart.trigger("yAxisChange")
  }

  const handleMinChange = e => {
    const value = e.target.value
    setMinValue(value)
    commit(value, maxValue)
  }

  const handleMaxChange = e => {
    const value = e.target.value
    setMaxValue(value)
    commit(minValue, value)
  }

  return (
    <Flex column gap={2}>
      <TextSmall color="textNoFocus" strong>
        Value range
      </TextSmall>
      <Flex column gap={1}>
        <TextInput
          label={`Min value (${units || "units"})`}
          type="number"
          value={minValue}
          onChange={handleMinChange}
          placeholder="Auto"
        />
        <TextInput
          label={`Max value (${units || "units"})`}
          type="number"
          value={maxValue}
          onChange={handleMaxChange}
          placeholder="Auto"
        />
      </Flex>
    </Flex>
  )
}

export default ValueRange
