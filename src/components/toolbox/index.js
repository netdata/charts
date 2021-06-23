import React, { useEffect, useState } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"

const Container = styled(Flex)`
  position: absolute;
  top: 0;
  right: 0;
`

const Button = styled.button`
  width: 20px;
  height: 20px;
`

const Toolbox = ({ chart }) => {
  const [navigation, setNavigation] = useState(chart.getAttribute("navigation"))

  useEffect(() => chart.onAttributeChange("navigation", setNavigation), [])

  const pan = () => {
    chart.updateAttribute("navigation", "pan")
  }

  const highlight = () => {
    chart.updateAttribute("navigation", "highlight")
  }

  const zoomIn = () => {
    const { after, before } = chart.getAttributes()
    const diff = Math.round((before - after) / 4)
    chart.moveX(after + diff, before - diff)
    chart.fetch()
  }

  const zoomOut = () => {
    const { after, before } = chart.getAttributes()
    const diff = Math.round((before - after) / 4)
    chart.moveX(after - diff, before + diff)
    chart.fetch()
  }

  return (
    <Container>
      <Button disabled={navigation === "pan"} onClick={pan}>
        p
      </Button>
      <Button disabled={navigation === "highlight"} onClick={highlight}>
        h
      </Button>
      <Button onClick={zoomIn}>zi</Button>
      <Button onClick={zoomOut}>zo</Button>
    </Container>
  )
}

export default Toolbox
