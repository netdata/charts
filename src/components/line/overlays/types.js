import React from "react"
import styled from "styled-components"
import LayerContainer from "@netdata/netdata-ui/dist/components/templates/layer/container"
import Container, { alignment } from "./container"
import Alarm from "./alarm"
import AlarmRange from "./alarmRange"
import Highlight from "./highlight"
import Proceeded from "./proceeded"
import ChartName from "./chartName"
import LatestValue from "./latestValue"
import { useAttributeValue } from "@/components/provider"

const NoEventsContainer = styled(LayerContainer)`
  pointer-events: none;
`

const AlarmOverlay = ({ id, ...rest }) => (
  <Container id={id} top="20px" margin={[0, 2, 0, 0]} align={alignment.elementLeft} {...rest}>
    <Alarm id={id} />
  </Container>
)

const AlarmRangeOverlay = ({ id, ...rest }) => (
  <Container id={id} top="20px" margin={[0, 2, 0, 0]} align={alignment.elementLeft} {...rest}>
    <AlarmRange id={id} />
  </Container>
)

const HighlightOverlay = ({ id, ...rest }) => {
  const sparkline = useAttributeValue("sparkline")

  if (sparkline) return null

  return (
    <Container id={id} align={alignment.elementRight} bottom="25px" right={100} {...rest} noEvents>
      <Highlight id={id} />
    </Container>
  )
}

const ProceededOverlay = ({ id, uiName, ...rest }) => (
  <Container id={id} top="50%" align={alignment.chartMiddle} uiName={uiName} {...rest}>
    <Proceeded id={id} uiName={uiName} />
  </Container>
)

const NameOverlay = ({ containerProps, ...rest }) => (
  <NoEventsContainer isAbsolute position="top" margin={[2, 0, 0, 0]} {...containerProps}>
    <ChartName {...rest} />
  </NoEventsContainer>
)

const LatestValueOverlay = props => (
  <NoEventsContainer isAbsolute position="center">
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
