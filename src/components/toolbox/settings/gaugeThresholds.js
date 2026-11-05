import React from "react"
import { Flex, TextSmall, Button } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"
import ThresholdRow, { PALETTE } from "./thresholdRow"

let counter = 0
const makeId = () => `threshold-${Date.now()}-${counter++}`

const GaugeThresholds = () => {
  const chart = useChart()
  const chartLibrary = useAttributeValue("chartLibrary")
  const thresholds = useAttributeValue("gaugeThresholds") || []

  if (chartLibrary !== "gauge") return null

  const commit = next => chart.updateAttributes({ gaugeThresholds: next.length ? next : null })

  const addRow = () => {
    const current = chart.getAttribute("gaugeThresholds") || []
    commit([...current, { id: makeId(), from: 0, color: PALETTE[0] }])
  }

  const updateRow = (id, changes) => {
    const current = chart.getAttribute("gaugeThresholds") || []
    commit(current.map(row => (row.id === id ? { ...row, ...changes } : row)))
  }

  const removeRow = id => {
    const current = chart.getAttribute("gaugeThresholds") || []
    commit(current.filter(row => row.id !== id))
  }

  return (
    <Flex column gap={2}>
      <TextSmall color="textNoFocus" strong>
        Value thresholds
      </TextSmall>
      <Flex column gap={2}>
        {thresholds.map(row => (
          <ThresholdRow
            key={row.id}
            row={row}
            onChange={changes => updateRow(row.id, changes)}
            onRemove={() => removeRow(row.id)}
          />
        ))}
      </Flex>
      <Button
        label="Add threshold"
        icon="plus"
        flavour="borderless"
        small
        alignSelf="start"
        onClick={addRow}
      />
    </Flex>
  )
}

export default GaugeThresholds
