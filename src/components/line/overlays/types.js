import React, { Fragment, useState } from "react"
import Container from "./container"
import Alarm from "./alarm"
import Highlight, { CorrelationPeriod } from "./highlight"
import Proceeded from "./proceeded"

const AlarmOverlay = ({ id }) => (
  <Container id={id} top="20px" margin={[0, 8, 0, 0]}>
    <Alarm id={id} />
  </Container>
)

const HighlightOverlay = ({ id }) => {
  const [showWarning, setShowWarning] = useState(false)

  return (
    <Fragment>
      <Container id={id} top="20px">
        <CorrelationPeriod id={id} showWarning={showWarning} />
      </Container>
      <Container id={id} bottom="12px">
        <Highlight id={id} correlationProps={{ setShowWarning }} />
      </Container>
    </Fragment>
  )
}

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
