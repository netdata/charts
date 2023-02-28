import React, { forwardRef } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import chevronDown from "@netdata/netdata-ui/lib/components/icon/assets/chevron_down.svg"
import Icon from "@/components/icon"
import { withTooltip, tooltipStyleProps } from "@/components/tooltip"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"

export const Container = styled(Flex).attrs(({ width = { max: 100 }, open }) => ({
  cursor: "pointer",
  role: "button",
  padding: [1],
  round: true,
  gap: 1,
  width,
  ...(open && { background: "borderSecondary" }),
}))`
  &:hover {
    background: ${getColor("borderSecondary")};
  }
`

const StyledLabel = styled(TextSmall).attrs({
  whiteSpace: "nowrap",
  truncate: true,
})`
  flex: 1;
`

const Label = forwardRef(
  (
    { secondaryLabel, tertiaryLabel, label, chevron = true, iconRotate, textProps, ...rest },
    ref
  ) => (
    <Container ref={ref} {...rest}>
      {secondaryLabel && (
        <TextSmall color="textLite" whiteSpace="nowrap" truncate>
          {secondaryLabel}
        </TextSmall>
      )}
      <StyledLabel {...textProps}>{label}</StyledLabel>
      {tertiaryLabel && (
        <TextSmall color="textLite" whiteSpace="nowrap" truncate>
          {tertiaryLabel}
        </TextSmall>
      )}
      {chevron && <Icon svg={chevronDown} size="16px" color="selected" rotate={iconRotate} />}
    </Container>
  )
)

const TooltipContent = ({ header, body }) => (
  <Flex column gap={1} {...tooltipStyleProps}>
    <TextSmall color="bright" strong>
      {header}
    </TextSmall>
    {body && <TextSmall color="bright">{body}</TextSmall>}
  </Flex>
)

export default Label || withTooltip(Label, { Content: TooltipContent, align: "bottom" }) // TODO change to "TOP"
