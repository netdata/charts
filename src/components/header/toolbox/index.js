import React, { useEffect, useState } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import information from "@netdata/netdata-ui/lib/components/icon/assets/information.svg"
import filter from "@netdata/netdata-ui/lib/components/icon/assets/filter.svg"
import share from "@netdata/netdata-ui/lib/components/icon/assets/share.svg"
import dashboardAdd from "@netdata/netdata-ui/lib/components/icon/assets/dashboard_add.svg"
import pin from "@netdata/netdata-ui/lib/components/icon/assets/pin.svg"
import stackedChart from "@netdata/netdata-ui/lib/components/icon/assets/stacked_chart.svg"
import Icon, { Button } from "@/components/icon"
import { useAttributeValue } from "@/components/provider"
import Fullscreen from "./fullscreen"
import ChartType from "./chartType"

const Separator = () => <Flex width="1px" background="tabsBorder" />

const Toolbox = ({ detailsOpen, toggleDetails, ...rest }) => {
  const focused = useAttributeValue("focused")
  const disabled = !focused

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
      <Separator />
      <ChartType disabled={disabled} />
      <Separator />
      <Fullscreen disabled={disabled} />
    </Flex>
  )
}

export default Toolbox
