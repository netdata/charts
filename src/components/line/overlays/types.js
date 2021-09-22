import React, { Fragment } from "react"
import Container, { alignment } from "./container"
import Alarm from "./alarm"
import Highlight, { HighlightPeriod } from "./highlight"
import Proceeded from "./proceeded"

const AlarmOverlay = ({ id }) => (
  <Container id={id} top="20px" margin={[0, 8, 0, 0]}>
    <Alarm id={id} />
  </Container>
)

const HighlightOverlay = ({ id }) => (
  <Fragment>
    <Container id={id} top="40%" align={alignment.elementRight} right={-8}>
      <HighlightPeriod id={id} />
    </Container>
    <Container id={id} bottom="26px" align={alignment.elementRight} right={-8}>
      <Highlight id={id} />
    </Container>
  </Fragment>
)

const ProceededOverlay = ({ id }) => (
  <Container id={id} top="50%" align={alignment.chartMiddle}>
    <Proceeded id={id} />
  </Container>
)

export default {
  alarm: AlarmOverlay,
  highlight: HighlightOverlay,
  proceeded: ProceededOverlay,
}
