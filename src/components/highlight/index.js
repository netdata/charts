import React, { useEffect, useRef, useState, memo, useLayoutEffect } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Icon, { Button } from "@/components/icon"
import correlationsIcon from "@netdata/netdata-ui/lib/components/icon/assets/correlations.svg"
import zoomInIcon from "@netdata/netdata-ui/lib/components/icon/assets/zoom_in.svg"
import { useChart } from "@/components/provider"

const Correlation = () => {
  const chart = useChart()

  return (
    <Button
      icon={<Icon svg={correlationsIcon} />}
      title="Metrics Correlations"
      onClick={() => chart.sdk.trigger("correlation", chart, chart.getAttribute("highlight"))}
      data-testid="highlight-correlations"
    />
  )
}

const ZoomIn = () => {
  const chart = useChart()

  const onClick = () => {
    chart.zoomIn()

    const [after, before] = chart.getAttribute("highlight")

    chart
      .getApplicableNodes({ syncHighlight: true })
      .forEach(node => node.updateAttribute("highlight", null))

    chart.moveX(after, before)
  }

  return (
    <Button
      icon={<Icon svg={zoomInIcon} />}
      title="Zoom In"
      onClick={onClick}
      data-testid="highlight-zoomIn"
    />
  )
}

const HighlightContainer = styled(Flex).attrs({
  gap: 2,
  padding: [2, 3],
  round: true,
  background: "dropdown",
})`
  direction: initial;
`

const Highlight = memo(() => (
  <HighlightContainer>
    <Correlation />
    <ZoomIn />
  </HighlightContainer>
))

const HorizontalContainer = styled(Flex)`
  position: absolute;
  overflow: hidden;
  transform: translateY(-50%);
  right: calc(0);
  left: 60px;
  bottom: 12px;
  direction: rtl;
  overflow: hidden;
`

const Container = () => {
  const chart = useChart()
  const ref = useRef()
  const [area, setArea] = useState()

  const updateRight = area => {
    if (!area || !ref.current) return

    const { from, width } = area
    const right = from + width / 2 + ref.current.firstChild.offsetWidth / 2
    ref.current.style.right = `calc(100% - ${right}px)`
  }

  useEffect(
    () =>
      chart.getUI().on("highlightedAreaChanged", area => {
        updateRight(area)
        setArea(s => (!!s !== !!area ? area : s))
      }),
    []
  )

  useLayoutEffect(() => updateRight(area), [area])

  if (!area) return null

  return (
    <HorizontalContainer ref={ref}>
      <Highlight />
    </HorizontalContainer>
  )
}

export default memo(Container)
