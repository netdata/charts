import React from "react"
import information from "@netdata/netdata-ui/lib/components/icon/assets/information.svg"
import Icon, { Button } from "@/components/icon"

const Information = props => (
  <Button
    icon={<Icon svg={information} />}
    title="Information"
    data-testid="chartHeaderToolbox-information"
    {...props}
  />
)

export default Information
