import React, { useEffect, useState } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import information from "@netdata/netdata-ui/lib/components/icon/assets/information.svg"
import filter from "@netdata/netdata-ui/lib/components/icon/assets/filter.svg"
import share from "@netdata/netdata-ui/lib/components/icon/assets/share.svg"
import expand from "@netdata/netdata-ui/lib/components/icon/assets/expand.svg"
import dashboard_add from "@netdata/netdata-ui/lib/components/icon/assets/dashboard_add.svg"
import pin from "@netdata/netdata-ui/lib/components/icon/assets/pin.svg"
import Icon, { Button } from "@/components/icon"

const Toolbox = ({ chart, detailsOpen, toggleDetails, ...rest }) => {
  const [disabled, setDisabled] = useState(() => !chart.getAttribute("focused"))

  useEffect(() => {
    return chart.onAttributeChange("focused", v => setDisabled(!v))
  }, [])

  return (
    <Flex gap={3} justifyContent="end" {...rest}>
      <Button
        icon={<Icon svg={information} />}
        title="Information"
        disabled={disabled}
        onClick={toggleDetails}
        active={detailsOpen}
      />
      <Flex width="1px" background="placeholder" />
      <Button icon={<Icon svg={expand} />} title="Full screen" disabled={disabled} />
    </Flex>
  )
}

export default Toolbox
