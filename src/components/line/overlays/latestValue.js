import React from "react"
import styled from "styled-components"
import { Flex, Text, getColor } from "@netdata/netdata-ui"
import { useLatestConvertedValue, useUnitSign } from "@/components/provider"

const StrokeLabel = styled(Text)`
  text-shadow:
    0.02em 0 ${getColor("borderSecondary")},
    0 0.02em ${getColor("borderSecondary")},
    -0.02em 0 ${getColor("borderSecondary")},
    0 -0.02em ${getColor("borderSecondary")};
`

const StyledFlex = styled(Flex)`
  pointer-events: none;
`

const defaultTextProps = {
  color: "text",
  whiteSpace: "nowrap",
}

const LatestValue = ({ dimensionId, textProps, ...rest }) => {
  const unit = useUnitSign()
  const value = useLatestConvertedValue(dimensionId)

  if (!value)
    return (
      <StrokeLabel fontSize="2.5em" strong {...defaultTextProps} {...textProps} {...rest}>
        {typeof value !== "string" ? "Loading..." : "No data"}
      </StrokeLabel>
    )

  return (
    <StyledFlex column {...rest}>
      <StrokeLabel fontSize="2.1em" lineHeight="1.1em" strong {...defaultTextProps} {...textProps}>
        {value}
      </StrokeLabel>
      <StrokeLabel fontSize="1.1em" strong {...defaultTextProps} color="textLite" {...textProps}>
        {unit}
      </StrokeLabel>
    </StyledFlex>
  )
}

export default LatestValue
