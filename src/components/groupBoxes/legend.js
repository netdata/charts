import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextNano } from "@netdata/netdata-ui/lib/components/typography"
import { useChart, useAttributeValue, useUnitSign } from "@/components/provider"

const LinearColorScaleBar = styled(Flex).attrs({ width: "320px", height: "12px", round: true })`
  background: linear-gradient(to right, rgba(198, 227, 246, 0.9), rgba(43, 44, 170, 1));
`

const Legend = () => {
  const chart = useChart()
  const min = useAttributeValue("min")
  const max = useAttributeValue("max")
  const units = useUnitSign()

  const selectedContexts = useAttributeValue("selectedContexts").join(", ")
  const contextScope = useAttributeValue("contextScope").join(", ")

  return (
    <Flex data-testid="groupBox-legend" gap={4} alignItems="center">
      <TextNano strong>
        {selectedContexts && selectedContexts !== "*" ? selectedContexts : contextScope}
      </TextNano>
      <Flex gap={2} alignItems="center">
        <TextNano>
          {chart.getConvertedValue(min)} {units}
        </TextNano>
        <LinearColorScaleBar />
        <TextNano>
          {chart.getConvertedValue(max)} {units}
        </TextNano>
      </Flex>
    </Flex>
  )
}

export default Legend
