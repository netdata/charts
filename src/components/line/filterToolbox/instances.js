import React, { useMemo } from "react"

import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import Multiselect from "./multiselect"

const tooltipProps = {
  heading: "Instances",
  body: "The instances contributing to the chart.",
}

const Instances = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedInstances")
  const { instances } = useMetadata()
  const options = useMemo(
    () =>
      instances.map(({ nm, id }) => ({
        label: nm || id,
        value: id,
        "data-track": chart.track(`instances-${id}`),
      })),
    [instances]
  )

  return (
    <Multiselect
      attrName="instances"
      allName="all instances"
      data-track={chart.track("instances")}
      labelProps={labelProps}
      onChange={chart.updateInstancesAttribute}
      options={options}
      secondaryLabel="using"
      tooltipProps={tooltipProps}
      value={value}
      {...rest}
    />
  )
}

export default Instances
