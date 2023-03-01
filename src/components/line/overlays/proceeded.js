import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import { useChart, useChartError } from "@/components/provider"

const NoDataContainer = styled(Flex).attrs({
  column: true,
  round: true,
  border: { side: "all", color: "borderSecondary" },
  gap: 1,
  padding: [1, 2],
  flex: false,
})`
  direction: initial;
`

const NoData = props => {
  const chart = useChart()

  const chartWidth = chart.getUI().getChartWidth()
  const error = useChartError()
  console.log("error", error)

  if (chartWidth < 240) return null

  return (
    <NoDataContainer {...props}>
      <Text textAlign="center" textTransform="firstLetter">
        {error || "No data"}
      </Text>
    </NoDataContainer>
  )
}

const CenterContainer = styled(Flex)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`

export const CenterNoData = () => (
  <CenterContainer>
    <NoData />
  </CenterContainer>
)

export default NoData
