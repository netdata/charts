import React from "react"
import { useAttributeValue } from "@/components/provider"
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
  const groupBy = useAttributeValue("groupBy")

  return (
    <Label
      secondaryLabel={isAggregate ? "of the" : ""}
      label="Sum of ABS"
      chevron={false}
      title={!!tooltipProps[groupBy]}
      tooltipProps={tooltipProps[groupBy]}
      data-track="dimensionsAggregation"
      {...labelProps}
    />
  )
}

export default DimensionsAggregation
