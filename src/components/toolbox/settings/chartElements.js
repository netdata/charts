import React from "react"
import { Flex, TextSmall, Checkbox } from "@netdata/netdata-ui"

const ChartElements = ({ formState, onChange }) => {
  const handleYAxisChange = checked => {
    onChange({ enabledYAxis: checked })
  }

  const handleXAxisChange = checked => {
    onChange({ enabledXAxis: checked })
  }

  const handleLegendChange = checked => {
    onChange({ legend: checked })
  }

  return (
    <Flex column gap={2}>
      <TextSmall color="textNoFocus" strong>
        Chart Elements
      </TextSmall>
      <Flex column gap={1} alignItems="start">
        <Checkbox
          label="Show Y-Axis"
          checked={formState.enabledYAxis}
          onChange={handleYAxisChange}
        />
        <Checkbox
          label="Show X-Axis"
          checked={formState.enabledXAxis}
          onChange={handleXAxisChange}
        />
        <Checkbox label="Show Legend" checked={formState.legend} onChange={handleLegendChange} />
      </Flex>
    </Flex>
  )
}

export default ChartElements
