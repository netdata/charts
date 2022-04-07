import React, { Fragment } from "react"
import Container, { alignment } from "./container"
import Alarm from "./alarm"
import Highlight, { HighlightPeriod } from "./highlight"
import Proceeded from "./proceeded"
import ChartName from "./chartName"
import LatestValue from "./latestValue"
import LayerContainer from "@netdata/netdata-ui/lib/components/templates/layer/container"
import { useAttributeValue } from "@/components/provider"

const AlarmOverlay = ({ id }) => (
  <Container id={id} top="20px" margin={[0, 8, 0, 0]}>
    <Alarm id={id} />
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
  <LayerContainer isAbsolute position="top">
    <ChartName {...props} />
  </LayerContainer>
)

const LatestValueOverlay = props => (
  <LayerContainer isAbsolute position="bottom">
    <LatestValue {...props} />
  </LayerContainer>
)

export default {
  alarm: AlarmOverlay,
  highlight: HighlightOverlay,
  proceeded: ProceededOverlay,
  name: NameOverlay,
  latestValue: LatestValueOverlay,
}
