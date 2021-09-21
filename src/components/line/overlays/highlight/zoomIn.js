import React, { memo } from "react"
import Icon, { Button } from "@/components/icon"
import zoomInIcon from "@netdata/netdata-ui/lib/components/icon/assets/zoom_in.svg"
import { useChart } from "@/components/provider"

const ZoomIn = ({ id }) => {
  const chart = useChart()

  const onClick = () => {
    chart.zoomIn()

    const {
      [id]: {
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
      title="Zoom in"
      onClick={onClick}
      data-testid="highlight-zoomIn"
    />
  )
}

export default memo(ZoomIn)
