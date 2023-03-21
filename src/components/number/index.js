import React, { forwardRef, useState } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import ChartContainer from "@/components/chartContainer"
import { useChart, useTitle, useUnitSign, useImmediateListener } from "@/components/provider"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"
import { useIsFetching } from "@/components/provider"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"
import textAnimation from "../helpers/textAnimation"

const Label = styled(Text)`
  line-height: 1;
  font-size: ${({ fontSize }) => fontSize};
  flex: ${({ flex = 0 }) => flex};
  ${({ isFetching }) => isFetching && textAnimation};
`

export const Title = props => {
  const title = useTitle()
  const isFetching = useIsFetching()

  return (
    <Label flex="1" color="border" fontSize="1.2em" strong isFetching={isFetching} {...props}>
      {title}
    </Label>
  )
}

const StrokeLabel = styled(Label)`
  text-shadow: 0.02em 0 ${getColor("borderSecondary")}, 0 0.02em ${getColor("borderSecondary")},
    -0.02em 0 ${getColor("borderSecondary")}, 0 -0.02em ${getColor("borderSecondary")};
`
export const Value = props => {
  const chart = useChart()

  const getValue = () => {
    const { hoverX, after } = chart.getAttributes()
    if (!hoverX && after > 0) return "-"

    const v = chart.getUI().getValue()
    return chart.getConvertedValue(v)
  }
  const [value, setValue] = useState(getValue)

  useImmediateListener(() => chart.getUI().on("rendered", () => setValue(getValue())), [])

  return (
    <StrokeLabel flex="2" color="main" fontSize="2.2em" strong {...props}>
      {value}
    </StrokeLabel>
  )
}

export const Unit = props => {
  const unit = useUnitSign()
  return (
    <Label color="border" fontSize="1em" {...props}>
      {unit}
    </Label>
  )
}

export const NumberChart = forwardRef((props, ref) => (
  <ChartWrapper {...props} ref={ref}>
    <ChartContainer height="auto" width="auto" column alignItems="center" justifyContent="center">
      <Flex column>
        <Value fontSize="1.2em" />
        <Unit fontSize="0.8em" />
      </Flex>
    </ChartContainer>
  </ChartWrapper>
))

export default withChart(NumberChart, { tile: true })
