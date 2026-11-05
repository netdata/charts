import React from "react"
import { Flex, TextSmall, Checkbox } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"

const ChartElements = () => {
  const chart = useChart()
  const enabledYAxis = useAttributeValue("enabledYAxis")
  const enabledXAxis = useAttributeValue("enabledXAxis")
  const legend = useAttributeValue("legend")

  const update = changes => {
    chart.updateAttributes(changes)
    chart.trigger("yAxisChange")
  }

  return (
    <Flex column gap={2}>
      <TextSmall color="textNoFocus" strong>
        Chart Elements
      </TextSmall>
      <Flex column gap={1} alignItems="start">
        <Checkbox
          label="Show Y-Axis"
          checked={enabledYAxis}
          onChange={checked => update({ enabledYAxis: checked })}
        />
        <Checkbox
          label="Show X-Axis"
          checked={enabledXAxis}
          onChange={checked => update({ enabledXAxis: checked })}
        />
        <Checkbox
          label="Show Legend"
          checked={legend}
          onChange={checked => update({ legend: checked })}
        />
      </Flex>
    </Flex>
  )
}

export default ChartElements
