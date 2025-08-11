import React, { useMemo, useState, useEffect } from "react"
import { Flex, TextSmall, TextInput, Select } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import { getScales, isScalable } from "@/helpers/units"
import conversableUnits, { keys as conversableKeys } from "@/helpers/units/conversableUnits"

const NumberFormat = ({ formState, onChange }) => {
  const units = useAttributeValue("units")
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0)

  const availableUnits = units?.filter(unit => unit && unit !== "") || []
  const selectedUnit = availableUnits[selectedUnitIndex] || ""

  const currentDesiredUnits = formState.desiredUnits[selectedUnitIndex] || "auto"
  const [desiredUnits, setDesiredUnits] = useState(currentDesiredUnits)
  const [staticFractionDigits, setStaticFractionDigits] = useState(formState.staticFractionDigits)

  const unitOptions = useMemo(() => {
    return availableUnits.map((unit, index) => ({
      value: index,
      label: unit,
    }))
  }, [availableUnits])

  const scaleOptions = useMemo(() => {
    const options = [
      { value: "auto", label: "Auto scale" },
      { value: "original", label: "No conversion" },
    ]

    if (isScalable(selectedUnit)) {
      if (conversableUnits[selectedUnit]) {
        const scaleKeys =
          conversableKeys[selectedUnit] || Object.keys(conversableUnits[selectedUnit])
        scaleKeys.forEach(key => {
          options.push({ value: key, label: key })
        })
      } else {
        const [scaleKeys] = getScales(selectedUnit)
        scaleKeys.forEach(key => {
          const prefix = key === "1" ? "" : key
          const unitLabel = `${prefix} ${selectedUnit}`
          options.push({ value: key, label: unitLabel })
        })
      }
    }

    return options
  }, [selectedUnit])

  useEffect(() => {
    const currentDesiredUnits = formState.desiredUnits[selectedUnitIndex] || "auto"
    setDesiredUnits(currentDesiredUnits)
    setStaticFractionDigits(formState.staticFractionDigits)
  }, [formState.desiredUnits, formState.staticFractionDigits, selectedUnitIndex])

  const handleDesiredUnitsChange = option => {
    setDesiredUnits(option?.value || "auto")
    const newDesiredUnitsArray = Array.isArray(formState.desiredUnits)
      ? [...formState.desiredUnits]
      : []
    while (newDesiredUnitsArray.length < availableUnits.length) {
      newDesiredUnitsArray.push("auto")
    }
    newDesiredUnitsArray[selectedUnitIndex] = option?.value || "auto"
    onChange({ desiredUnits: newDesiredUnitsArray })
  }

  const handleFractionDigitsChange = e => {
    const value = e.target.value === "" ? null : Number(e.target.value)
    setStaticFractionDigits(value)
    onChange({ staticFractionDigits: value })
  }

  return (
    <Flex column gap={2}>
      <TextSmall color="textNoFocus" strong>
        Value formatting
      </TextSmall>
      <Flex column gap={1}>
        {availableUnits.length > 1 && (
          <Flex column gap={1}>
            <TextSmall strong>Unit</TextSmall>
            <Select
              value={unitOptions.find(option => option.value === selectedUnitIndex)}
              onChange={({ value }) => setSelectedUnitIndex(value)}
              options={unitOptions}
            />
          </Flex>
        )}
        <Flex column gap={1}>
          <TextSmall strong>Scale</TextSmall>
          <Select
            value={scaleOptions.find(option => option.value === desiredUnits)}
            onChange={handleDesiredUnitsChange}
            options={scaleOptions}
          />
        </Flex>
        <TextInput
          label="Decimal Places"
          type="number"
          value={staticFractionDigits ?? ""}
          onChange={handleFractionDigitsChange}
          placeholder="Auto"
          min="0"
          max="6"
        />
      </Flex>
    </Flex>
  )
}

export default NumberFormat
