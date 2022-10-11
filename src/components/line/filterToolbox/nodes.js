import React from "react"

import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import Multiselect from "./multiselect"

const tooltipProps = {
  heading: "Nodes",
  body: "Select one, multiple or all nodes.",
}

const Nodes = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("dimensions")
  const nodeIds = useAttributeValue("nodeIds")
  const { dimensions } = useMetadata()
  // console.log("nodeIds", nodeIds) // eslint-disable-line no-console

  return (
    <Multiselect
      attrName="dimensions"
      allName="All dimensions"
      data-track={chart.track("dimensions")}
      onChange={chart.updateDimensionsAttribute}
      options={dimensions}
      secondaryLabel="select"
      tooltipProps={tooltipProps}
      value={value}
      {...rest}
    />
  )
}

export default Nodes
