import React, { forwardRef } from "react"
import BaseTooltip from "@netdata/netdata-ui/lib/components/drops/tooltip"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"

export const tooltipStyleProps = {
  padding: [1, 2],
  margin: [2],
  round: 1,
  width: { max: "300px", base: "fit-content" },
  "data-toolbox": true,
  background: ["neutral", "black"],
}

const DefaultContent = ({ children, ...rest }) => (
  <Flex {...tooltipStyleProps} {...rest}>
    <TextSmall color="bright" wordBreak="break-word">
      {children}
    </TextSmall>
  </Flex>
)

const Tooltip = forwardRef(({ content, Content = DefaultContent, ...rest }, ref) => (
  <BaseTooltip
    ref={ref}
    plain
    content={<Content {...rest}>{content}</Content>}
    {...rest}
    dropProps={{ "data-toolbox": true }}
  />
))

Tooltip.defaultProps = {
  align: "bottom",
}

export const withTooltip = (Component, tooltipDefaultProps = {}) =>
  forwardRef(({ title, ...rest }, ref) => {
    if (!title) return <Component ref={ref} {...rest} />

    return (
      <Tooltip content={title} disabled={rest.open} {...tooltipDefaultProps} {...rest.tooltipProps}>
        <Component ref={ref} {...rest} />
      </Tooltip>
    )
  })

export default Tooltip
