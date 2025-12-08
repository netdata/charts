import React, { useState, useEffect, useMemo } from "react"
import { Flex, TextSmall, TextMicro, TextInput } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"

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

const PointsToFetch = ({ formState, onChange }) => {
  const [pointsValue, setPointsValue] = useState(formState.points ?? "")

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

  return (
    <Flex column gap={2}>
      <TextSmall color="textNoFocus" strong>
        Data resolution
      </TextSmall>
      <Flex column gap={1}>
        <TextInput
          label="Points to fetch"
          type="number"
          value={pointsValue}
          onChange={handleChange}
          placeholder="Auto"
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
