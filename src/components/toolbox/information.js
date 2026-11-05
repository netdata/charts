import React from "react"
import information from "@netdata/netdata-ui/dist/components/icon/assets/information.svg"
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

Information.menu = {
  id: "info",
  group: "show",
  order: 30,
  useItem: ({ onClose }) => {
    const [showingInfo, setShowingInfo] = useAttribute("showingInfo")

    return {
      label: "Chart info",
      check: !!showingInfo,
      testId: "chartMore-info",
      track: "information",
      onClick: () => {
        setShowingInfo(!showingInfo)
        onClose()
      },
    }
  },
}

export default Information
