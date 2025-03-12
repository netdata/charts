import React from "react"
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
    <TextSmall color="tooltipText" wordBreak="break-word">
      {children}
    </TextSmall>
  </Flex>
)

const Tooltip = ({ content, Content = DefaultContent, ...rest }) =>
  content ? (
    <BaseTooltip
      plain
      content={<Content {...rest}>{content}</Content>}
      {...rest}
      dropProps={{ "data-toolbox": rest["data-toolbox"] }}
    />
  ) : (
    rest.children
  )

export const withTooltip =
  (Component, tooltipDefaultProps = {}) =>
  ({ title, ...rest }) => {
    const id = useAttributeValue("id")

    if (!title) return <Component {...rest} />

    return (
      <Tooltip
        content={title}
        disabled={rest.open}
        data-toolbox={id}
        align="bottom"
        {...tooltipDefaultProps}
        {...rest.tooltipProps}
      >
        <Component {...rest} />
      </Tooltip>
    )
  }

export default Tooltip
