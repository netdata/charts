import React, { forwardRef } from "react"
import BaseTooltip from "@netdata/netdata-ui/lib/components/drops/tooltip"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"

const tooltipBackground = ["neutral", "black"]

const Content = ({ children }) => (
  <Flex
    padding={[1.5, 2]}
    margin={[2]}
    background={tooltipBackground}
    round={1}
    width={{ max: "300px" }}
    data-toolbox
  >
    <TextSmall color="bright">{children}</TextSmall>
  </Flex>
)

const Tooltip = ({ content, ...rest }) => (
  <BaseTooltip
    plain
    animation
    content={<Content>{content}</Content>}
    {...rest}
    dropProps={{ "data-toolbox": true }}
  />
)

Tooltip.defaultProps = {
  align: "bottom",
}

export const withTooltip = Component =>
  forwardRef(({ title, ...rest }, ref) => {
    if (!title) return <Component {...rest} />

    return (
      <Tooltip content={title} {...rest.tooltipProps}>
        <Component ref={ref} {...rest} />
      </Tooltip>
    )
  })

export default Tooltip
