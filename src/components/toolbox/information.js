import React from "react"
import information from "@netdata/netdata-ui/lib/components/icon/assets/information.svg"
import Icon, { Button } from "@/components/icon"
import { useChart, useAttribute } from "@/components/provider"

const Information = props => {
  const chart = useChart()
  const [value, setValue] = useAttribute("showingInfo")

  return (
    <Button
      icon={<Icon svg={information} size="16px" />}
      title="Information"
      data-testid="chartHeaderToolbox-information"
      active={value}
      onClick={() => setValue(v => !v)}
      data-track={chart.track("information")}
      {...props}
    />
  )
}

export default Information
