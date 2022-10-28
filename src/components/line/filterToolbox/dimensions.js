import React, { useMemo } from "react"

import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import Multiselect from "./multiselect"

const tooltipProps = {
  heading: "Dimensions",
  body: "Select one, multiple or all dimensions. A dimension is any value, either raw data or the result of a calculation that Netdata visualizes on a chart.",
}

const Dimensions = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("dimensions")
  const { dimensions } = useMetadata()
  const options = useMemo(
    () =>
      Object.entries(dimensions).map(([key, value]) => ({
        label: value?.name || key,
        value: key,
      })),
    [dimensions]
  )

  return (
    <Multiselect
      attrName="dimensions"
      allName="All dimensions"
      data-track={chart.track("dimensions")}
      labelProps={labelProps}
      onChange={chart.updateDimensionsAttribute}
      options={options}
      secondaryLabel="select"
      tooltipProps={tooltipProps}
      value={value}
      {...rest}
    />
  )
}

export default Dimensions
