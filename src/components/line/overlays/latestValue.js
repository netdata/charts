import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text, TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import { useLatestValue, useUnitSign } from "@/components/provider"

const StyledText = styled(Text)`
  pointer-events: none;
  text-shadow: 0 18px 28px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.31);
`

const StyledTextMicro = styled(TextMicro)`
  pointer-events: none;
  text-shadow: 0 18px 28px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.31);
`

const StyledFlex = styled(Flex)`
  pointer-events: none;
`

const defaultTextProps = {
  color: "textDescription",
  whiteSpace: "nowrap",
}

const LatestValue = ({ dimensionId, textProps, ...rest }) => {
  const unit = useUnitSign()
  const value = useLatestValue(dimensionId)

  if (!value)
    return (
      <StyledText strong {...defaultTextProps} {...textProps} {...rest}>
        {typeof value !== "string" ? "Loading..." : "No data"}
      </StyledText>
    )

  return (
    <StyledFlex alignItems="baseline" gap={1} {...rest}>
      <StyledText strong {...defaultTextProps} {...textProps}>
        {value}
      </StyledText>
      <StyledTextMicro {...defaultTextProps} {...textProps}>
        {unit}
      </StyledTextMicro>
    </StyledFlex>
  )
}

export default LatestValue
