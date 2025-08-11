import React, { useCallback, useState, useEffect } from "react"
import { Flex, Button as UIButton } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import ValueRange from "./valueRange"
import NumberFormat from "./numberFormat"
import ChartElements from "./chartElements"

const SettingsContent = ({ chart, onClose }) => {
  const currentStaticValueRange = useAttributeValue("staticValueRange")
  const currentDesiredUnits = useAttributeValue("desiredUnits") || ["auto"]
  const currentStaticFractionDigits = useAttributeValue("staticFractionDigits")
  const currentEnabledYAxis = useAttributeValue("enabledYAxis")
  const currentEnabledXAxis = useAttributeValue("enabledXAxis")
  const currentLegend = useAttributeValue("legend")

  const [formState, setFormState] = useState({
    staticValueRange: null,
    desiredUnits: ["auto"],
    staticFractionDigits: null,
    enabledYAxis: true,
    enabledXAxis: true,
    legend: true,
  })

  useEffect(() => {
    setFormState({
      staticValueRange: currentStaticValueRange,
      desiredUnits: currentDesiredUnits,
      staticFractionDigits: currentStaticFractionDigits,
      enabledYAxis: currentEnabledYAxis,
      enabledXAxis: currentEnabledXAxis,
      legend: currentLegend,
    })
  }, [
    currentStaticValueRange,
    currentDesiredUnits,
    currentStaticFractionDigits,
    currentEnabledYAxis,
    currentEnabledXAxis,
    currentLegend,
  ])

  const handleChange = useCallback(changes => {
    setFormState(prev => ({ ...prev, ...changes }))
  }, [])

  const handleApply = useCallback(() => {
    chart.updateAttributes(formState)

    onClose()
    chart.trigger("yAxisChange")
  }, [formState, chart, onClose])

  const handleReset = useCallback(() => {
    const resetState = {
      staticValueRange: null,
      desiredUnits: ["auto"],
      staticFractionDigits: null,
      enabledYAxis: true,
      enabledXAxis: true,
      legend: true,
    }
    setFormState(resetState)
    Object.entries(resetState).forEach(([key, value]) => {
      chart.updateAttribute(key, value)
    })
    onClose()
  }, [chart, onClose])

  return (
    <Flex column gap={3} padding={[3]} width={{ min: "220px" }}>
      <ValueRange formState={formState} onChange={handleChange} />
      <NumberFormat formState={formState} onChange={handleChange} />
      <ChartElements formState={formState} onChange={handleChange} />
      <Flex gap={1} justifyContent="end">
        <UIButton label="Reset" onClick={handleReset} neutral small />
        <UIButton label="Apply" onClick={handleApply} primary small />
      </Flex>
    </Flex>
  )
}

export default SettingsContent
