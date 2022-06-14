import React from "react"
import styled from "styled-components"
import Container, { alignment } from "./container"
import Alarm from "./alarm"
import AlarmRange from "./alarmRange"
import Highlight from "./highlight"
import Proceeded from "./proceeded"
import ChartName from "./chartName"
import LatestValue from "./latestValue"
import LayerContainer from "@netdata/netdata-ui/lib/components/templates/layer/container"
import { useAttributeValue } from "@/components/provider"

const NoEventsContainer = styled(LayerContainer)`
  pointer-events: none;
`

const AlarmOverlay = ({ id }) => (
  <Container id={id} top="20px" margin={[0, 2, 0, 0]} align={alignment.elementLeft}>
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
    <Container id={id} align={alignment.elementRight} bottom="25px" right={100}>
      <Highlight id={id} />
    </Container>
  )
}

const ProceededOverlay = ({ id }) => (
  <Container id={id} top="50%" align={alignment.chartMiddle}>
    <Proceeded id={id} />
  </Container>
)

const NameOverlay = props => (
  <NoEventsContainer isAbsolute position="top" noEvents margin={[2, 0, 0, 0]}>
    <ChartName {...props} />
  </NoEventsContainer>
)

const LatestValueOverlay = props => (
  <NoEventsContainer isAbsolute position="bottom" noEvents margin={[0, 0, 2, 0]}>
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
