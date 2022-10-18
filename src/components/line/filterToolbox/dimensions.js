import React from "react"

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

  return (
    <Multiselect
      attrName="dimensions"
      allName="All dimensions"
      data-track={chart.track("dimensions")}
      labelProps={labelProps}
      onChange={chart.updateDimensionsAttribute}
      options={dimensions}
      secondaryLabel="select"
      tooltipProps={tooltipProps}
      value={value}
      {...rest}
    />
  )
}

export default Dimensions
