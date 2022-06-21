import React from "react"
import { useAttributeValue, useChart } from "@/components/provider"
import Label from "./label"

const tooltipProps = {
  dimension: {
    heading: "Aggregate function",
    body: "It is applied for the selected dimensions across the nodes.",
  },
  node: {
    heading: "Aggregate function",
    body: "It is applied for the selected dimensions of every node.",
  },
  chart: {
    heading: "Aggregate function",
    body: "It is applied for the selected dimensions of every chart.",
  },
}

const DimensionsAggregation = ({ isAggregate, labelProps }) => {
  const chart = useChart()
  const groupBy = useAttributeValue("groupBy")

  const tooltipAttrs = tooltipProps[groupBy] || tooltipProps.node

  return (
    <Label
      secondaryLabel={""}
      label="sum of ABS"
      chevron={false}
      title={!!tooltipAttrs}
      tooltipProps={tooltipAttrs}
      data-track={chart.track("dimensionsAggregation")}
      dropProps={{ align: { top: "bottom", left: "left" }, "data-toolbox": true }}
      {...labelProps}
    />
  )
}

export default DimensionsAggregation
