import React, { memo } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import useIsInArea from "./useIsInArea"
import Correlation, { Period } from "./correlation"
import ZoomIn from "./zoomIn"

const HighlightContainer = styled(Flex).attrs({
  gap: 2,
  padding: [1, 2],
  round: true,
  background: "dropdown",
  alignItems: "center",
})`
  direction: initial;
`

const Highlight = ({ id, correlationProps }) => {
  const isInArea = useIsInArea(id)

  if (!isInArea) return null

  return (
    <HighlightContainer>
      <Correlation id={id} {...correlationProps} />
      <ZoomIn id={id} />
    </HighlightContainer>
  )
}

export const HighlightPeriod = memo(props => {
  const isInArea = useIsInArea(props.id)

  if (!isInArea) return null

  return <Period {...props} />
})

export default memo(Highlight)
