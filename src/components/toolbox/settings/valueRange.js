import React, { useState, useEffect } from "react"
import { Flex, TextSmall, TextInput } from "@netdata/netdata-ui"
import { useUnitSign } from "@/components/provider"

const ValueRange = ({ formState, onChange }) => {
  const [minValue, setMinValue] = useState(formState.staticValueRange?.[0] ?? "")
  const [maxValue, setMaxValue] = useState(formState.staticValueRange?.[1] ?? "")

  const units = useUnitSign({ withoutConversion: true })

  useEffect(() => {
    setMinValue(formState.staticValueRange?.[0] ?? "")
    setMaxValue(formState.staticValueRange?.[1] ?? "")
  }, [formState.staticValueRange])

  const handleMinChange = e => {
    const value = e.target.value
    setMinValue(value)
    const min = value === "" ? null : Number(value)
    const max = maxValue === "" ? null : Number(maxValue)
    const staticValueRange = min === null && max === null ? null : [min, max]
    onChange({ staticValueRange })
  }

  const handleMaxChange = e => {
    const value = e.target.value
    setMaxValue(value)
    const min = minValue === "" ? null : Number(minValue)
    const max = value === "" ? null : Number(value)
    const staticValueRange = min === null && max === null ? null : [min, max]
    onChange({ staticValueRange })
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
