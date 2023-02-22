import React, { useMemo } from "react"

import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import Multiselect from "./multiselect"

const tooltipProps = {
  heading: "Dimensions",
  body: "Select one, multiple or all dimensions. A dimension is any value, either raw data or the result of a calculation that Netdata visualizes on a chart.",
}

const Dimensions = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedDimensions")
  const { dimensions } = useMetadata()
  const options = useMemo(
    () =>
      dimensions.map(({ nm, id }) => ({
        label: nm || id,
        value: id,
        "data-track": chart.track(`dimensions-${id}`),
      })),
    [dimensions]
  )

  return (
    <Multiselect
      attrName="dimensions"
      allName="all dimensions"
      data-track={chart.track("dimensions")}
      labelProps={labelProps}
      onChange={chart.updateDimensionsAttribute}
      options={options}
      secondaryLabel="using"
      tooltipProps={tooltipProps}
      value={value}
      {...rest}
    />
  )
}

export default Dimensions
