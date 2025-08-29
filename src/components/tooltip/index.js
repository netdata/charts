import React from "react"
import { Flex, TextSmall, Tooltip as BaseTooltip } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import RichTooltip from "./richTooltip"

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

const Tooltip = ({ content, Content = DefaultContent, ...rest }) => {
  // Handle rich tooltip format with title/heading and description/body
  // Support both { title, description } and { heading, body } formats
  if (content && typeof content === "object" && !React.isValidElement(content)) {
    const title = content.title || content.heading
    const description = content.description || content.body
    
    // Only use RichTooltip when BOTH title AND description are provided
    if (title && description) {
      return (
        <BaseTooltip
          plain
          content={<RichTooltip title={title} description={description} />}
          zIndex={1000}
          {...rest}
          dropProps={{ "data-toolbox": rest["data-toolbox"] }}
        />
      )
    }
    
    // Handle objects with only title/heading or only description/body - treat as simple text
    if (title || description) {
      const simpleContent = title || description
      return (
        <BaseTooltip
          plain
          content={<Content {...rest}>{simpleContent}</Content>}
          {...rest}
          dropProps={{ "data-toolbox": rest["data-toolbox"] }}
        />
      )
    }
  }
  
  // Handle regular content (strings, React elements, etc.)
  return content ? (
    <BaseTooltip
      plain
      content={<Content {...rest}>{content}</Content>}
      {...rest}
      dropProps={{ "data-toolbox": rest["data-toolbox"] }}
    />
  ) : (
    rest.children
  )
}

export const withTooltip =
  (Component, tooltipDefaultProps = {}) =>
  ({ title, tooltip, ...rest }) => {
    const id = useAttributeValue("id")
    
    // Support both title prop and tooltip prop for rich format
    // Also support tooltipProps containing the content
    const tooltipContent = tooltip || title || rest.tooltipProps?.content || rest.tooltipProps

    if (!tooltipContent) return <Component {...rest} />

    // If tooltipProps is the content object itself (with heading/body or title/description)
    const isTooltipPropsContent = rest.tooltipProps && (rest.tooltipProps.heading || rest.tooltipProps.body || rest.tooltipProps.title || rest.tooltipProps.description)
    
    return (
      <Tooltip
        content={isTooltipPropsContent ? rest.tooltipProps : tooltipContent}
        disabled={rest.open}
        data-toolbox={id}
        align="bottom"
        {...tooltipDefaultProps}
        {...(!isTooltipPropsContent ? rest.tooltipProps : {})}
      >
        <Component {...rest} />
      </Tooltip>
    )
  }

export { RichTooltip }
export default Tooltip
