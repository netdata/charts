import React from "react"
import expand from "@netdata/netdata-ui/dist/components/icon/assets/expand.svg"
import collapse from "@netdata/netdata-ui/dist/components/icon/assets/collapse.svg"
import { useChart, useAttributeValue } from "@/components/provider"
import Icon, { Button } from "@/components/icon"

const Fullscreen = props => {
  const chart = useChart()
  const fullscreen = useAttributeValue("fullscreen")

  return (
    <Button
      icon={<Icon svg={fullscreen ? collapse : expand} size="16px" />}
      onClick={chart.toggleFullscreen}
      title={fullscreen ? "Minimize" : "Full screen"}
      data-testid="chartHeaderToolbox-fullscreen"
      data-track={chart.track("fullscreen")}
      {...props}
    />
  )
}

export default Fullscreen
