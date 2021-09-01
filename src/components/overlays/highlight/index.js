import React, { memo } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Correlation, { Period } from "./zoomIn"
import ZoomIn from "./zoomIn"

const HighlightContainer = styled(Flex).attrs({
  gap: 2,
  padding: [2, 3],
  round: true,
  background: "dropdown",
})`
  direction: initial;
`

const Highlight = ({ id, correlationRef }) => (
  <HighlightContainer>
    <Correlation id={id} correlationRef={correlationRef} />
    <ZoomIn id={id} />
  </HighlightContainer>
)

export const CorrelationPeriod = memo(Period)

export default memo(Highlight)
