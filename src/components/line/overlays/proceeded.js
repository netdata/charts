import React from "react"
import styled from "styled-components"
import { Flex, Text } from "@netdata/netdata-ui"
import { useChart, useChartError } from "@/components/provider"

const ProceededContainer = styled(Flex).attrs({
  column: true,
  round: true,
  border: { side: "all", color: "borderSecondary" },
  gap: 1,
  padding: [1, 2],
  flex: false,
})`
  direction: initial;
`

const Proceeded = ({ defaultValue, uiName, ...rest }) => {
  const chart = useChart()

  const chartWidth = chart.getUI(uiName).getChartWidth()
  const error = useChartError()

  if (chartWidth < 240) return null

  if (!error || !defaultValue) return null

  return (
    <ProceededContainer {...rest}>
      <Text textAlign="center" textTransform="firstLetter">
        {error || defaultValue}
      </Text>
    </ProceededContainer>
  )
}

const CenterContainer = styled(Flex)`
  z-index: 60000;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`

export const Processing = () => (
  <CenterContainer>
    <Proceeded defaultValue="Processing" />
  </CenterContainer>
)

export default Proceeded
