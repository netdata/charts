import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text, TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import { useLatestValue, useUnitSign } from "@/components/provider"

const StyledText = styled(Text)`
  text-shadow: 0 18px 28px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.31);
`

const StyledTextMicro = styled(TextMicro)`
  text-shadow: 0 18px 28px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.31);
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
        No data
      </StyledText>
    )

  return (
    <Flex alignItems="baseline" gap={1} {...rest}>
      <StyledText strong {...defaultTextProps} {...textProps}>
        {value}
      </StyledText>
      <StyledTextMicro {...defaultTextProps} {...textProps}>
        {unit}
      </StyledTextMicro>
    </Flex>
  )
}

export default LatestValue
