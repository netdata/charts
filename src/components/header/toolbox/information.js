import React from "react"
import information from "@netdata/netdata-ui/lib/components/icon/assets/information.svg"
import Icon, { Button } from "@/components/icon"
import { useAttribute } from "@/components/provider"

const Information = props => {
  const [value, setValue] = useAttribute("detailed")

  return (
    <Button
      icon={<Icon svg={information} />}
      title="Information"
      data-testid="chartHeaderToolbox-information"
      active={value}
      onClick={() => setValue(v => !v)}
      {...props}
    />
  )
}

export default Information
