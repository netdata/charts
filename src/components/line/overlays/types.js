import React, { Fragment } from "react"
import styled from "styled-components"
import Container, { alignment } from "./container"
import Alarm from "./alarm"
import AlarmRange from "./alarmRange"
import Highlight, { HighlightPeriod } from "./highlight"
import Proceeded from "./proceeded"
import ChartName from "./chartName"
import LatestValue from "./latestValue"
import LayerContainer from "@netdata/netdata-ui/lib/components/templates/layer/container"
import { useAttributeValue } from "@/components/provider"

const NoEventsContainer = styled(LayerContainer)`
  pointer-events: none;
`

const AlarmOverlay = ({ id }) => (
  <Container id={id} top="20px" margin={[0, 8, 0, 0]}>
    <Alarm id={id} />
  </Container>
)

const AlarmRangeOverlay = ({ id }) => (
  <Container id={id} top="20px" margin={[0, 2, 0, 0]} align={alignment.elementLeft}>
    <AlarmRange id={id} />
  </Container>
)

const HighlightOverlay = ({ id }) => {
  const sparkline = useAttributeValue("sparkline")
  if (sparkline) return null

  return (
    <Fragment>
      <Container id={id} top="40%" align={alignment.elementRight} right={-8}>
        <HighlightPeriod id={id} />
      </Container>
      <Container id={id} bottom="26px" align={alignment.elementRight} right={-8}>
        <Highlight id={id} />
      </Container>
    </Fragment>
  )
}

const ProceededOverlay = ({ id }) => (
  <Container id={id} top="50%" align={alignment.chartMiddle}>
    <Proceeded id={id} />
  </Container>
)

const NameOverlay = props => (
  <NoEventsContainer isAbsolute position="top" noEvents margin={[2,0,0,0]}>
    <ChartName {...props} />
  </NoEventsContainer>
)

const LatestValueOverlay = props => (
  <NoEventsContainer isAbsolute position="bottom" noEvents margin={[0,0,2,0]}>
    <LatestValue {...props} />
  </NoEventsContainer>
)

export default {
  alarm: AlarmOverlay,
  alarmRange: AlarmRangeOverlay,
  highlight: HighlightOverlay,
  proceeded: ProceededOverlay,
  name: NameOverlay,
  latestValue: LatestValueOverlay,
}
