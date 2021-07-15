import React, { memo } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Icon, { Button } from "@/components/icon"
import correlationsIcon from "@netdata/netdata-ui/lib/components/icon/assets/correlations.svg"
import zoomInIcon from "@netdata/netdata-ui/lib/components/icon/assets/zoom_in.svg"
import { useChart } from "@/components/provider"

const Correlation = () => {
  const chart = useChart()

  const {
    highlight: { range },
  } = chart.getAttribute("overlays")

  return (
    <Button
      icon={<Icon svg={correlationsIcon} />}
      title="Metrics Correlations"
      onClick={() => chart.sdk.trigger("correlation", chart, range)}
      data-testid="highlight-correlations"
    />
  )
}

const ZoomIn = () => {
  const chart = useChart()

  const onClick = () => {
    chart.zoomIn()

    const {
      highlight: {
        range: [after, before],
      },
    } = chart.getAttribute("overlays")

    chart.getApplicableNodes({ syncHighlight: true }).forEach(node => {
      const overlays = { ...node.getAttribute("overlays") }
      delete overlays.hightlight
      node.updateAttribute("overlays", overlays)
    })

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

const Highlight = () => (
  <HighlightContainer>
    <Correlation />
    <ZoomIn />
  </HighlightContainer>
)

export default memo(Highlight)
