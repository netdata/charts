import React, { useCallback, useState, useEffect } from "react"
import { Flex, Button as UIButton } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import ValueRange from "./valueRange"
import NumberFormat from "./numberFormat"
import ChartElements from "./chartElements"
import PointsToFetch from "./pointsToFetch"

const SettingsContent = ({ chart, onClose }) => {
  const currentStaticValueRange = useAttributeValue("staticValueRange")
  const currentDesiredUnits = useAttributeValue("desiredUnits") || ["auto"]
  const currentStaticFractionDigits = useAttributeValue("staticFractionDigits")
  const currentEnabledYAxis = useAttributeValue("enabledYAxis")
  const currentEnabledXAxis = useAttributeValue("enabledXAxis")
  const currentLegend = useAttributeValue("legend")
  const currentPoints = useAttributeValue("points")

  const [formState, setFormState] = useState({
    staticValueRange: null,
    desiredUnits: ["auto"],
    staticFractionDigits: null,
    enabledYAxis: true,
    enabledXAxis: true,
    legend: true,
    points: null,
  })

  useEffect(() => {
    setFormState({
      staticValueRange: currentStaticValueRange,
      desiredUnits: currentDesiredUnits,
      staticFractionDigits: currentStaticFractionDigits,
      enabledYAxis: currentEnabledYAxis,
      enabledXAxis: currentEnabledXAxis,
      legend: currentLegend,
      points: currentPoints,
    })
  }, [
    currentStaticValueRange,
    currentDesiredUnits,
    currentStaticFractionDigits,
    currentEnabledYAxis,
    currentEnabledXAxis,
    currentLegend,
    currentPoints,
  ])

  const handleChange = useCallback(changes => {
    setFormState(prev => ({ ...prev, ...changes }))
  }, [])

  const handleApply = useCallback(() => {
    const pointsChanged = formState.points !== currentPoints
    chart.updateAttributes(formState)

    onClose()
    chart.trigger("yAxisChange")
    if (pointsChanged) {
      chart.trigger("fetch", { processing: true })
    }
  }, [formState, chart, onClose, currentPoints])

  const handleReset = useCallback(() => {
    const pointsChanged = currentPoints !== null
    const resetState = {
      staticValueRange: null,
      desiredUnits: ["auto"],
      staticFractionDigits: null,
      enabledYAxis: true,
      enabledXAxis: true,
      legend: true,
      points: null,
    }
    setFormState(resetState)
    Object.entries(resetState).forEach(([key, value]) => {
      chart.updateAttribute(key, value)
    })
    onClose()
    if (pointsChanged) {
      chart.trigger("fetch", { processing: true })
    }
  }, [chart, onClose, currentPoints])

  return (
    <Flex column gap={3} padding={[3]} width={{ min: "220px" }}>
      <ValueRange formState={formState} onChange={handleChange} />
      <NumberFormat formState={formState} onChange={handleChange} />
      <PointsToFetch formState={formState} onChange={handleChange} />
      <ChartElements formState={formState} onChange={handleChange} />
      <Flex gap={1} justifyContent="end">
        <UIButton label="Reset" onClick={handleReset} neutral small />
        <UIButton label="Apply" onClick={handleApply} primary small />
      </Flex>
    </Flex>
  )
}

export default SettingsContent
