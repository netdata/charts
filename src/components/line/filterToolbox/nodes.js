import React, { useMemo } from "react"

import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import Multiselect from "./multiselect"

const tooltipProps = {
  heading: "Nodes",
  body: "The instances contributing to the chart.",
}

const Nodes = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedHosts")
  const isAgent = chart.getAttributes("agent")
  const { hosts } = useMetadata()
  const options = useMemo(
    () =>
      hosts.map(host => {
        const id = isAgent ? host.mg : host.nd

        return {
          label: host.nm || id,
          value: id,
          "data-track": chart.track(`hosts-${id}`),
        }
      }),
    [hosts]
  )

  return (
    <Multiselect
      attrName="hosts"
      allName="all nodes"
      data-track={chart.track("hosts")}
      labelProps={labelProps}
      onChange={chart.updateNodesAttribute}
      options={options}
      secondaryLabel="On"
      tooltipProps={tooltipProps}
      value={value}
      {...rest}
    />
  )
}

export default Nodes
