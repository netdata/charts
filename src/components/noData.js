import React, { useEffect, useState, useRef, forwardRef, useLayoutEffect } from "react"
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

const NoData = props => (
  <Flex
    column
    round
    border={{ side: "all", color: "borderSecondary" }}
    gap={1}
    padding={[1, 2]}
    {...props}
  >
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
  </Flex>
)

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

const HorizontalContainer = styled(Flex)`
  position: absolute;
  overflow: hidden;
  top: 50%;
  transform: translateY(-50%);
  right: calc(0);
  left: 60px;
  direction: rtl;
  overflow: hidden;
  pointer-events: none;
`

export const HorizontalNoData = () => {
  const chart = useChart()
  const ref = useRef()

  const getValue = () => chart.getUI().getPreceded()

  const [visible, setVisible] = useState(getValue)

  useEffect(
    () =>
      chart.getUI().on("underlayCallback", () => {
        const preceded = getValue()
        if (preceded === -1) return setVisible(false)

        setVisible(true)

        if (!ref.current) return

        const width = chart.getUI().getChartWidth()
        const pr = Math.min(preceded - 24, 60 + width / 2 + ref.current.firstChild.offsetWidth / 2)
        ref.current.style.right = `calc(100% - ${pr}px)`
      }),
    []
  )

  if (!visible) return null

  return (
    <HorizontalContainer ref={ref}>
      <NoData />
    </HorizontalContainer>
  )
}
