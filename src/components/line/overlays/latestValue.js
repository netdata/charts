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

const LatestValue = ({ dimensionId, ...rest }) => {
  const unit = useUnitSign()
  const value = useLatestValue(dimensionId)

  const textProps = {
    color: "textDescription",
    whiteSpace: "nowrap"
  }

  if (!value) return (
    <StyledText strong {...textProps} {...rest}>
      No data
    </StyledText>
  )

  return (
    <Flex alignItems="baseline" gap={1} {...rest}>
      <StyledText strong {...textProps}>{value}</StyledText>
      <StyledTextMicro {...textProps}>{unit}</StyledTextMicro>
    </Flex>
  )
}

export default LatestValue
