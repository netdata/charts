import React from "react"
import styled from "styled-components"
import { Flex, Text, getColor } from "@netdata/netdata-ui"
import { useIsModern, useLatestDisplayValueWithUnit, useOnResize } from "@/components/provider"
import FontSizer from "@/components/helpers/fontSizer"
import { useInModernTile } from "@/components/modern/tile/context"

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

const DefaultLatestValue = ({ dimensionId, textProps, ...rest }) => {
  const { convertedValue: value, convertedUnit: unit } = useLatestDisplayValueWithUnit(dimensionId)
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
      >
        {unit}
      </FontSizer>
    </StyledFlex>
  )
}

// a modern tile draws the readout above the trend itself, so the overlay steps aside there
const LatestValue = props => {
  const isModern = useIsModern()
  const inModernTile = useInModernTile()

  if (isModern && inModernTile) return null

  return <DefaultLatestValue {...props} />
}

export default LatestValue
