import React from "react"
import { Flex, Text, TextSmall } from "@netdata/netdata-ui"
import styled from "styled-components"

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.colors.textDescription};
  opacity: 0.5;
  margin: ${({ theme }) => theme.constants.SIZE_SUB_UNIT / 2}px 0 ${({ theme }) => theme.constants.SIZE_SUB_UNIT}px 0;
`

const StyledDescription = styled(TextSmall)`
  strong {
    font-weight: bold;
    color: ${({ theme }) => theme.colors.text};
  }
`

const RichTooltip = ({ title, description }) => {
  return (
    <Flex 
      column 
      gap={1} 
      width={{ max: "250px" }}
      padding={[2]}
      margin={[2]}
      background="tooltip"
      round={1}
      alignSelf="start"
    >
      <Text strong color="text">
        {title}
      </Text>
      <Divider />
      <StyledDescription color="textDescription">
        {description}
      </StyledDescription>
    </Flex>
  )
}

export default RichTooltip