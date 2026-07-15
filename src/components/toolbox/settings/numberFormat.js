import React, { useMemo, useState, useEffect } from "react"
import { Flex, TextSmall, TextInput, Select } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"
import { getScales, getUnitConfig, isScalable } from "@/helpers/units"
import conversableUnits, { keys as conversableKeys } from "@/helpers/units/conversableUnits"

const NumberFormat = () => {
  const chart = useChart()
  const units = useAttributeValue("units")
  const desiredUnitsAttr = useAttributeValue("desiredUnits") || ["auto"]
  const staticFractionDigitsAttr = useAttributeValue("staticFractionDigits")

  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0)

  const availableUnits = units?.filter(unit => unit && unit !== "") || []
  const selectedUnit = availableUnits[selectedUnitIndex] || ""

  const currentDesiredUnits = desiredUnitsAttr[selectedUnitIndex] || "auto"
  const [desiredUnits, setDesiredUnits] = useState(currentDesiredUnits)
  const [staticFractionDigits, setStaticFractionDigits] = useState(staticFractionDigitsAttr)

  const unitOptions = useMemo(
    () => availableUnits.map((unit, index) => ({ value: index, label: unit })),
    [availableUnits]
  )

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
        const config = getUnitConfig(selectedUnit)
        const base = config.base_unit ?? selectedUnit
        scaleKeys.forEach(key => {
          const prefix = key === "1" ? "" : key
          const unitLabel = `${prefix} ${base}`.trim()
          options.push({ value: key, label: unitLabel })
        })
      }
    }

    return options
  }, [selectedUnit])

  useEffect(() => {
    setDesiredUnits(desiredUnitsAttr[selectedUnitIndex] || "auto")
    setStaticFractionDigits(staticFractionDigitsAttr)
  }, [desiredUnitsAttr, staticFractionDigitsAttr, selectedUnitIndex])

  const update = changes => {
    chart.updateAttributes(changes)
    chart.trigger("yAxisChange")
  }

  const handleDesiredUnitsChange = option => {
    const value = option?.value || "auto"
    setDesiredUnits(value)
    const next = Array.isArray(desiredUnitsAttr) ? [...desiredUnitsAttr] : []
    while (next.length < availableUnits.length) next.push("auto")
    next[selectedUnitIndex] = value
    update({ desiredUnits: next })
  }

  const handleFractionDigitsChange = e => {
    const value = e.target.value === "" ? null : Number(e.target.value)
    setStaticFractionDigits(value)
    update({ staticFractionDigits: value })
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
