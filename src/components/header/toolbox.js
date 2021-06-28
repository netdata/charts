import React, { useEffect, useState } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import information from "@netdata/netdata-ui/lib/components/icon/assets/information.svg"
import filter from "@netdata/netdata-ui/lib/components/icon/assets/filter.svg"
import share from "@netdata/netdata-ui/lib/components/icon/assets/share.svg"
import expand from "@netdata/netdata-ui/lib/components/icon/assets/expand.svg"
import dashboard_add from "@netdata/netdata-ui/lib/components/icon/assets/dashboard_add.svg"
import pin from "@netdata/netdata-ui/lib/components/icon/assets/pin.svg"
import collapse from "@netdata/netdata-ui/lib/components/icon/assets/collapse.svg"

import Icon, { Button } from "@/components/icon"

const Fullscreen = ({ chart, ...rest }) => {
  const getValue = () => chart.getAttribute("fullscreen")
  const [open, setOpen] = useState(getValue)

  useEffect(() => chart.onAttributeChange("fullscreen", () => setOpen(getValue)), [])

  return (
    <Button
      icon={<Icon svg={open ? collapse : expand} size={open ? "16px" : "24px"} />}
      onClick={() => chart.updateAttribute("fullscreen", !chart.getAttribute("fullscreen"))}
      title={open ? "Minimize" : "Full screen"}
      data-testid="chartHeaderToolbox-fullscreen"
      {...rest}
    />
  )
}

const Toolbox = ({ chart, detailsOpen, toggleDetails, ...rest }) => {
  const [disabled, setDisabled] = useState(() => !chart.getAttribute("focused"))

  useEffect(() => chart.onAttributeChange("focused", v => setDisabled(!v)), [])

  return (
    <Flex gap={3} justifyContent="end" data-testid="chartHeaderToolbox" {...rest}>
      <Button
        icon={<Icon svg={information} />}
        title="Information"
        disabled={disabled}
        onClick={toggleDetails}
        active={detailsOpen}
        data-testid="chartHeaderToolbox-information"
      />
      <Flex width="1px" background="placeholder" />
      <Fullscreen disabled={disabled} chart={chart} />
    </Flex>
  )
}

export default Toolbox
