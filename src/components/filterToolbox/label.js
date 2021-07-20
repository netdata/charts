import React, { forwardRef } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import chevronDown from "@netdata/netdata-ui/lib/components/icon/assets/chevron_down.svg"
import Icon from "@/components/icon"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"

export const Container = styled(Flex).attrs({
  cursor: "pointer",
  role: "button",
  padding: [1, 2],
  round: true,
})`
  &:hover {
    background: ${getColor("borderSecondary")};
  }
`

const StyledLabel = styled(TextSmall).attrs({
  strong: true,
  margin: [0, 0, 0, 2],
})`
  flex: 1;
`

const Label = forwardRef(({ secondaryLabel, label, chevron = true, ...rest }, ref) => (
  <Container ref={ref} {...rest}>
    <TextSmall color="textLite">{secondaryLabel}</TextSmall>
    <StyledLabel>{label}</StyledLabel>
    {chevron && <Icon svg={chevronDown} size="16px" color="selected" />}
  </Container>
))

export default Label
