import React from "react"
import styled from "styled-components"
import { Flex, Text, getColor } from "@netdata/netdata-ui"
import {
  useAttributeValue,
  usePayload,
  useFormatTime,
  useFormatDate,
  useChart,
} from "@/components/provider"

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

const Timestamp = ({ timestamp, ...rest }) => {
  const time = useFormatTime(timestamp)
  const date = useFormatDate(timestamp)

  return (
    <StrokeLabel
      color="text"
      whiteSpace="nowrap"
      data-testid="chartIndicator-dateTime-latest-value"
      {...rest}
    >
      {date} • {time}
    </StrokeLabel>
  )
}

const LatestTime = ({ textProps, ...rest }) => {
  const chart = useChart()

  const [x] = useAttributeValue("hoverX") || []

  const { data } = usePayload()

  if (!data.length) return null

  const index = x ? chart.getClosestRow(x) : data.length - 1
  const timestamp = data[index]?.[0]

  if (!timestamp) return null

  return (
    <StyledFlex round={5} background="mainBackground" padding={[0.5, 4]} {...rest}>
      <Timestamp timestamp={timestamp} {...textProps} />
    </StyledFlex>
  )
}

export default LatestTime
