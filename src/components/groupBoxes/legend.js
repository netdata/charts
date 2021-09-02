import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextNano } from "@netdata/netdata-ui/lib/components/typography"

const LinearColorScaleBar = styled(Flex).attrs({ width: "120px", height: "12px", round: true })`
  background: linear-gradient(to right, #c6e3f6, #0e9aff);
`

const Legend = ({ children }) => (
  <Flex data-testid="groupBox-legend" gap={4} alignItems="center">
    <TextNano strong>{children}</TextNano>
    <Flex gap={2} alignItems="center">
      <TextNano>0%</TextNano>
      <LinearColorScaleBar />
      <TextNano>100%</TextNano>
    </Flex>
  </Flex>
)

export default Legend
