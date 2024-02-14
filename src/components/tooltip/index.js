import React, { forwardRef } from "react"
import { Flex, TextSmall, Tooltip as BaseTooltip } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"

export const tooltipStyleProps = {
  padding: [1, 2],
  margin: [2],
  round: 1,
  width: { max: "300px", base: "fit-content" },
  background: "tooltip",
}

const DefaultContent = ({ children, ...rest }) => (
  <Flex {...tooltipStyleProps} {...rest}>
    <TextSmall color="bright" wordBreak="break-word">
      {children}
    </TextSmall>
  </Flex>
)

const Tooltip = forwardRef(({ content, Content = DefaultContent, ...rest }, ref) =>
  content ? (
    <BaseTooltip
      ref={ref}
      plain
      content={<Content {...rest}>{content}</Content>}
      {...rest}
      dropProps={{ "data-toolbox": rest["data-toolbox"] }}
    />
  ) : (
    rest.children
  )
)

Tooltip.defaultProps = {
  align: "bottom",
}

export const withTooltip = (Component, tooltipDefaultProps = {}) =>
  forwardRef(({ title, ...rest }, ref) => {
    const id = useAttributeValue("id")

    if (!title) return <Component ref={ref} {...rest} />

    return (
      <Tooltip
        content={title}
        disabled={rest.open}
        data-toolbox={id}
        {...tooltipDefaultProps}
        {...rest.tooltipProps}
      >
        <Component ref={ref} {...rest} />
      </Tooltip>
    )
  })

export default Tooltip
