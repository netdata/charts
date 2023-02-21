import React, { useMemo } from "react"

import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import Multiselect from "./multiselect"

const tooltipProps = {
  heading: "Instances",
  body: "The instances contributing to the chart.",
}

const Instances = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("instances")
  const { instances } = useMetadata()
  const options = useMemo(
    () =>
      Object.entries(instances || {}).map(([key, value]) => ({
        label: value?.name || key,
        value: key,
        "data-track": chart.track(`instances-${key}`),
      })),
    [instances]
  )

  return (
    <Multiselect
      attrName="instances"
      allName="All instances"
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
