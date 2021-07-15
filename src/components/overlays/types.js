import React from "react"
import Container from "./container"
import Alarm from "./alarm"
import Highlight from "./highlight"
import Proceeded from "./proceeded"

const AlarmOverlay = ({ id }) => (
  <Container id={id} top="20px" margin={[0, 8, 0, 0]}>
    <Alarm id={id} />
  </Container>
)

const HighlightOverlay = ({ id }) => (
  <Container id={id} bottom="12px">
    <Highlight id={id} />
  </Container>
)

const ProceededOverlay = ({ id }) => (
  <Container id={id} top="50%" alignMiddle>
    <Proceeded id={id} />
  </Container>
)

export default {
  alarm: AlarmOverlay,
  highlight: HighlightOverlay,
  proceeded: ProceededOverlay,
}
