import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextNano } from "@netdata/netdata-ui/lib/components/typography"

const LinearColorScaleBar = styled(Flex).attrs({ width: "320px", height: "12px", round: true })`
  background: linear-gradient(to right, rgba(198, 227, 246, 0.9), rgba(43, 44, 170, 1));
`

const Legend = ({ min, max, units, children }) => (
  <Flex data-testid="groupBox-legend" gap={4} alignItems="center">
    <TextNano strong>{children}</TextNano>
    <Flex gap={2} alignItems="center">
      <TextNano>
        {min} {units}
      </TextNano>
      <LinearColorScaleBar />
      <TextNano>
        {max} {units}
      </TextNano>
    </Flex>
  </Flex>
)

export default Legend
