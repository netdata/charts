import React, { useEffect, useState } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { getSizeBy } from "@netdata/netdata-ui/lib/theme/utils"
import { webkitVisibleScrollbar } from "@netdata/netdata-ui/lib/mixins/webkit-visible-scrollbar"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import Color from "./dimensions/color"
import Name from "./dimensions/name"
import Value from "./dimensions/value"
import styled from "styled-components"

const Dimension = ({ chart, id }) => {
  const [unit, setUnit] = useState(chart.getUnitSign)

  useEffect(() => chart.on("convertedValuesChange", () => setUnit(chart.getUnitSign)), [])

  return (
    <Flex width="88px" flex={false} gap={1} data-testid="chartLegendDimension">
      <Color chart={chart} id={id} />
      <Flex flex column overflow="hidden" data-testid="chartLegendDimension-details">
        <Name chart={chart} id={id} />
        <Flex gap={1} data-testid="chartLegendDimension-valueContainer">
          <Value chart={chart} id={id} strong />
          <TextMicro whiteSpace="nowrap" truncate>
            {unit}
          </TextMicro>
        </Flex>
      </Flex>
    </Flex>
  )
}

const Container = styled(Flex).attrs({
  gap: 1,
  overflow: { horizontal: "auto" },
  padding: [3, 0, 1],
  alignItems: "start",
})`
  ${webkitVisibleScrollbar}

  &::-webkit-scrollbar {
    height: ${getSizeBy(1)};
  }
`

const Legend = ({ chart, ...rest }) => {
  const getList = () => chart.getDimensionIds()

  const [dimensionIds, setDimensionIds] = useState(getList)

  useEffect(() => {
    const off = chart.on("dimensionChanged", () => {
      setDimensionIds(getList)
    })

    return () => {
      off()
    }
  }, [])

  return (
    <Container data-testid="chartLegend" {...rest}>
      {dimensionIds.map(id => (
        <Dimension key={id} chart={chart} id={id} />
      ))}
    </Container>
  )
}

export default Legend
