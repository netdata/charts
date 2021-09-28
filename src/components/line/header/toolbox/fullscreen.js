import React from "react"
import expand from "@netdata/netdata-ui/lib/components/icon/assets/expand.svg"
import collapse from "@netdata/netdata-ui/lib/components/icon/assets/collapse.svg"
import { useAttribute } from "@/components/provider"
import Icon, { Button } from "@/components/icon"

const Fullscreen = props => {
  const [fullscreen, setFullscreen] = useAttribute("fullscreen")

  return (
    <Button
      icon={<Icon svg={fullscreen ? collapse : expand} size={fullscreen ? "16px" : "24px"} />}
      onClick={() => setFullscreen(v => !v)}
      title={fullscreen ? "Minimize" : "Full screen"}
      data-testid="chartHeaderToolbox-fullscreen"
      data-track="fullscreen"
      {...props}
    />
  )
}

export default Fullscreen
