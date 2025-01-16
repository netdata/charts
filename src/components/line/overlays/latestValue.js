import React from "react"
import styled from "styled-components"
import { Flex, Text, getColor } from "@netdata/netdata-ui"
import { useLatestConvertedValue, useUnitSign, useOnResize } from "@/components/provider"
import FontSizer from "@/components/helpers/fontSizer"

const StrokeLabel = styled(Text)`
  text-shadow:
    0.02em 0 ${getColor("borderSecondary")},
    0 0.02em ${getColor("borderSecondary")},
    -0.02em 0 ${getColor("borderSecondary")},
    0 -0.02em ${getColor("borderSecondary")};
`

const StyledFlex = styled(Flex)`
  pointer-events: none;
`

const defaultTextProps = {
  color: "text",
  whiteSpace: "nowrap",
}

const LatestValue = ({ dimensionId, textProps, ...rest }) => {
  const unit = useUnitSign({ dimensionId })
  const value = useLatestConvertedValue(dimensionId)
  const { width, height } = useOnResize()

  if (!value || value === "-")
    return (
      <FontSizer
        Component={StrokeLabel}
        maxHeight={(height - 20) * 0.9}
        maxWidth={width - 20}
        fontSize="2.5em"
        strong
        {...defaultTextProps}
        {...textProps}
        {...rest}
      >
        {typeof value !== "string" ? "Loading..." : "No data"}
      </FontSizer>
    )

  return (
    <StyledFlex column {...rest}>
      <FontSizer
        Component={StrokeLabel}
        maxHeight={(height - 20) * 0.8}
        maxWidth={width - 20}
        fontSize="2.1em"
        lineHeight="1.1em"
        strong
        {...defaultTextProps}
        {...textProps}
      >
        {value}
      </FontSizer>
      <FontSizer
        Component={StrokeLabel}
        maxHeight={(height - 20) * 0.15}
        maxWidth={(width - 20) * 0.2}
        fontSize="1.1em"
        strong
        {...defaultTextProps}
        color="textLite"
        {...textProps}
        cacheKey={value}
      >
        {unit}
      </FontSizer>
    </StyledFlex>
  )
}

export default LatestValue
