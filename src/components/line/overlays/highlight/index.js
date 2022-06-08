import React, { memo } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextNano } from "@netdata/netdata-ui/lib/components/typography"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"
import Correlation, { Period } from "./correlation"
import { useAttributeValue } from "@/components/provider"

const StyledHighlight = styled(Flex).attrs({
  justifyContent: "center",
  alignItems: "center",
  gap: 2,
  height: "40px",
  alignSelf: "center",
  round: true,
  width: { min: "70px" },
  padding: [1, 2],
  border: { side: "all", color: "borderSecondary" },
})`
  background-color: ${getColor("mainBackground")}80;
  &:hover {
    background-color: ${getColor("mainBackground")};
  }
`

export const Divider = styled(Flex)`
  background: ${getColor("borderSecondary")};
  height: 16px;
  width: 1px;
`

const HighlightPeriod = memo(props => {
  return (
    <Flex column gap={[0.5]}>
      <TextNano strong textTransform="uppercase" color="textLite">
        Range
      </TextNano>
      <Period {...props} />
    </Flex>
  )
})

const Highlight = ({ id, correlationProps }) => {
  const hasCorrelation = useAttributeValue("hasCorrelation")
  const focused = useAttributeValue("focused")

  if (!focused) return null
  return (
    <StyledHighlight>
      <HighlightPeriod id={id} />
      {hasCorrelation ? (
        <>
          <Divider />
          <Correlation id={id} {...correlationProps} />
        </>
      ) : null}
    </StyledHighlight>
  )
}

export default memo(Highlight)
