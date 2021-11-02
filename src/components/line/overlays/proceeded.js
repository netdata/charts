import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextMicro, TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import { useChart } from "@/components/provider"

const LinkContainer = styled(Flex).attrs({
  as: "a",
  target: "_blank",
  rel: "noopener",
  background: ["green", "frostee"],
  padding: [0.5, 1],
  round: true,
  flex: true,
})`
  text-decoration: none;
`

const Link = ({ to, children }) => (
  <LinkContainer href={to}>
    <TextMicro color="primary" wordBreak="keep-all" truncate>
      {children}
    </TextMicro>
  </LinkContainer>
)

const NoDataContainer = styled(Flex).attrs({
  column: true,
  round: true,
  border: { side: "all", color: "borderSecondary" },
  gap: 1,
  padding: [1, 2],
})`
  direction: initial;
`

const NoData = props => {
  const chart = useChart()

  const chartWidth = chart.getUI().getChartWidth()

  if (chartWidth < 240) {
    return (
      <NoDataContainer {...props}>
        <TextSmall textAlign="center">No data</TextSmall>
      </NoDataContainer>
    )
  }

  return (
    <NoDataContainer {...props}>
      <TextSmall textAlign="center">Missing key historical data for this period?</TextSmall>
      <Flex alignItems="baseline" gap={1}>
        <Link to="https://learn.netdata.cloud/docs/agent/streaming#database-replication">
          Explore Netdata's replication capabilities
        </Link>
        <TextMicro>-</TextMicro>
        <Link to="https://learn.netdata.cloud/guides/longer-metrics-storage/">
          Review Netdata's history configurations
        </Link>
      </Flex>
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
