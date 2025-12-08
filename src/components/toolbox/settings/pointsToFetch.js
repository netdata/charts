import React, { useState, useEffect, useMemo } from "react"
import { Flex, TextSmall, TextMicro, TextInput } from "@netdata/netdata-ui"
import information from "@netdata/netdata-ui/dist/components/icon/assets/information.svg"
import { useAttributeValue } from "@/components/provider"
import { pointMultiplierByChartType } from "@/sdk/makeChart/api/helpers"
import Tooltip from "@/components/tooltip"
import Icon from "@/components/icon"

export const useMaxPoints = () => {
  const after = useAttributeValue("after")
  const before = useAttributeValue("before")
  const updateEvery = useAttributeValue("updateEvery")

  return useMemo(() => {
    if (!updateEvery || updateEvery <= 0) return null

    const timeRange = after < 0 ? Math.abs(after) : before - after
    if (timeRange <= 0) return null

    return Math.floor(timeRange / updateEvery)
  }, [after, before, updateEvery])
}

export const usePointsExceedsMax = () => {
  const points = useAttributeValue("points")
  const maxPoints = useMaxPoints()

  return maxPoints !== null && points !== null && points > maxPoints
}

const useAutoPoints = () => {
  const containerWidth = useAttributeValue("containerWidth")
  const pixelsPerPoint = useAttributeValue("pixelsPerPoint") || 3
  const chartType = useAttributeValue("chartType")
  const chartLibrary = useAttributeValue("chartLibrary")

  return useMemo(() => {
    if (!containerWidth) return null

    const multiplier =
      pointMultiplierByChartType[chartType] ||
      pointMultiplierByChartType[chartLibrary] ||
      pointMultiplierByChartType.default

    const points = Math.round((containerWidth / pixelsPerPoint) * multiplier)

    if (isNaN(points)) return null

    return points
  }, [containerWidth, pixelsPerPoint, chartType, chartLibrary])
}

const PointsToFetch = ({ formState, onChange }) => {
  const [pointsValue, setPointsValue] = useState(formState.points ?? "")

  const autoPoints = useAutoPoints()

  const updateEvery = useAttributeValue("updateEvery")
  const maxPoints = useMaxPoints()
  const exceedsMax = maxPoints !== null && pointsValue !== "" && Number(pointsValue) > maxPoints

  useEffect(() => {
    setPointsValue(formState.points ?? "")
  }, [formState.points])

  const handleChange = e => {
    const value = e.target.value
    setPointsValue(value)
    const points = value === "" ? null : Number(value)
    onChange({ points })
  }

  const placeholder = autoPoints ? `Auto (${autoPoints} data points)` : "Auto"

  return (
    <Flex column gap={2}>
      <Flex alignItems="center" gap={1}>
        <TextSmall strong>Data resolution</TextSmall>
        <Tooltip content="Number of data points to fetch from the server. Higher values provide more detail but may impact performance. Auto calculates optimal points based on chart width.">
          <Icon svg={information} size="12px" color="textLite" />
        </Tooltip>
      </Flex>
      <Flex column gap={1}>
        <TextInput
          type="number"
          value={pointsValue}
          onChange={handleChange}
          placeholder={placeholder}
          min="1"
        />
        {exceedsMax && (
          <TextMicro color="warningText">
            Exceeds max {maxPoints} points for current time range ({updateEvery}s interval)
          </TextMicro>
        )}
      </Flex>
    </Flex>
  )
}

export default PointsToFetch
