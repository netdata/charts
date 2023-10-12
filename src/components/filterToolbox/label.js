import React, { forwardRef } from "react"
import styled from "styled-components"
import { Flex, TextSmall, getColor } from "@netdata/netdata-ui"
import chevronDown from "@netdata/netdata-ui/dist/components/icon/assets/chevron_down.svg"
import Icon from "@/components/icon"
import { withTooltip, tooltipStyleProps } from "@/components/tooltip"

export const Container = styled(Flex).attrs(({ width = { max: 100 }, open, ...rest }) => ({
  cursor: "pointer",
  role: "button",
  padding: [0.5],
  round: true,
  gap: 0.5,
  width,
  alignItems: "center",
  ...(open && { background: "selected" }),
  ...rest,
}))`
  &:hover {
    background: ${getColor("selected")};
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
    { icon, secondaryLabel, tertiaryLabel, label, chevron = true, iconRotate, textProps, ...rest },
    ref
  ) =>
    icon ? (
      <Container ref={ref} {...rest}>
        {icon}
      </Container>
    ) : (
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
        {chevron && <Icon svg={chevronDown} size="12px" color="textNoFocus" rotate={iconRotate} />}
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

export default withTooltip(Label, { Content: TooltipContent, align: "top" })
