import React from "react"
import Container from "./container"
import Alarm from "./container"
import Highlight from "./container"

const AlarmOverlay = ({ id }) => (
  <Container id={id} top="20" margin={[0, 8, 0, 0]}>
    <Alarm id={id} />
  </Container>
)

const HighlightOverlay = ({ id }) => (
  <Container id={id} bottom="12">
    <Highlight id={id} />
  </Container>
)

export default {
  alarm: AlarmOverlay,
  highlight: HighlightOverlay,
}
